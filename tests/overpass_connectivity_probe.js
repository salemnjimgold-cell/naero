const assert = require('node:assert/strict');
const http = require('node:http');
const {
  CANDIDATES,
  DIAGNOSTIC,
  QUERY,
  TIMEOUT_MS,
  createOverpassConnectivityProbe,
  createProbeEmitter,
} = require('../backend/src/diagnostics/overpassConnectivityProbe');
const { startServer } = require('../backend/src/server');
const { readEnv } = require('../backend/src/config/env');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const production = { nodeEnv: 'production', serviceEnv: 'production' };
function response(status, payload, jsonError) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() { if (jsonError) throw jsonError; return payload; },
  };
}
function transportAttempt(code, address, extras = {}) {
  return Object.assign(new Error('private transport message'), {
    code, address, hostname: 'private.example', stack: 'private stack', ...extras,
  });
}
function aggregateFetchError() {
  return Object.assign(new TypeError('private URL'), {
    cause: Object.assign(new Error('private connect message'), {
      code: 'UND_ERR_CONNECT_TIMEOUT',
      cause: new AggregateError([
        transportAttempt('ETIMEDOUT', '2001:db8::10'),
        transportAttempt('ECONNREFUSED', '192.0.2.10'),
      ], 'private aggregate message'),
    }),
  });
}

test('candidate allowlist is exact and immutable', () => {
  assert.deepEqual(CANDIDATES.map(({ id }) => id), ['fossgis_main', 'private_coffee', 'vk_maps']);
  assert.ok(CANDIDATES.every(({ endpoint }) => endpoint.startsWith('https://')));
  assert.ok(Object.isFrozen(CANDIDATES));
  assert.equal(QUERY, '[out:json][timeout:3];\nout count;');
});

test('production gating requires both production values', async () => {
  let calls = 0;
  for (const env of [
    {},
    { nodeEnv: 'test', serviceEnv: 'production' },
    { nodeEnv: 'production', serviceEnv: 'staging' },
  ]) {
    const run = createOverpassConnectivityProbe({ fetchImpl: async () => { calls += 1; } });
    assert.deepEqual(await run(env), []);
  }
  assert.equal(calls, 0);
});

test('runs once, sequentially, with exactly three requests and no retry', async () => {
  const calls = [];
  let active = 0;
  let maxActive = 0;
  const run = createOverpassConnectivityProbe({
    fetchImpl: async (endpoint) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      calls.push(endpoint);
      await Promise.resolve();
      active -= 1;
      return response(200, { elements: [] });
    },
    write() {},
  });
  const first = run(production);
  const second = run(production);
  assert.strictEqual(first, second);
  await first;
  await run(production);
  assert.equal(calls.length, 3);
  assert.deepEqual(calls, CANDIDATES.map(({ endpoint }) => endpoint));
  assert.equal(maxActive, 1);
});

test('uses fixed POST contract and a five-second deadline', async () => {
  const requests = [];
  const timerDelays = [];
  const run = createOverpassConnectivityProbe({
    fetchImpl: async (endpoint, options) => {
      requests.push({ endpoint, options });
      return response(200, { elements: [] });
    },
    setTimeoutImpl(callback, delay) { timerDelays.push(delay); return callback; },
    clearTimeoutImpl() {},
    write() {},
  });
  await run(production);
  assert.deepEqual(timerDelays, [TIMEOUT_MS, TIMEOUT_MS, TIMEOUT_MS]);
  for (const { options } of requests) {
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['content-type'], 'application/x-www-form-urlencoded;charset=UTF-8');
    assert.equal(new URLSearchParams(options.body).get('data'), QUERY);
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.authorization, undefined);
    assert.equal(options.headers.cookie, undefined);
  }
});

test('classifies successful, non-2xx, invalid JSON and invalid envelopes', async () => {
  const events = [];
  const replies = [
    response(200, { elements: [] }),
    response(503, { private: 'body' }),
    response(200, null, new SyntaxError('private response body')),
  ];
  const run = createOverpassConnectivityProbe({
    fetchImpl: async () => replies.shift(),
    write: (message, meta) => events.push(meta),
  });
  const results = await run(production);
  assert.equal(results[0].success, true);
  assert.equal(results[0].validOverpassEnvelope, true);
  assert.equal(results[1].success, false);
  assert.equal(results[1].upstreamStatus, 503);
  assert.equal(results[2].success, false);
  assert.equal(results[2].validOverpassEnvelope, false);
  assert.doesNotMatch(JSON.stringify(events), /private response body|\"private\":\"body\"/i);
});

test('invalid envelope is a compatibility failure', async () => {
  const run = createOverpassConnectivityProbe({
    fetchImpl: async () => response(200, { elements: 'invalid', private: 'body' }),
    write() {},
  });
  const results = await run(production);
  assert.ok(results.every((result) => result.success === false && result.validOverpassEnvelope === false));
});

test('probe timeout aborts safely at five seconds', async () => {
  const events = [];
  const run = createOverpassConnectivityProbe({
    fetchImpl: async (endpoint, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('private'), { name: 'AbortError' })), { once: true });
    }),
    setTimeoutImpl(callback, delay) { assert.equal(delay, 5000); queueMicrotask(callback); return 1; },
    clearTimeoutImpl() {},
    write: (message, meta) => events.push(meta),
  });
  await run(production);
  assert.equal(events.length, 3);
  assert.ok(events.every((event) => event.probeTimeout === true && event.success === false));
});

test('network aggregate emits only normalized multi-address diagnostics', async () => {
  const events = [];
  const run = createOverpassConnectivityProbe({
    fetchImpl: async () => { throw aggregateFetchError(); },
    write: (message, meta) => events.push(meta),
  });
  await run(production);
  assert.equal(events[0].networkClass, 'connect_timeout');
  assert.equal(events[0].multiAddress, true);
  assert.equal(events[0].attemptCount, 2);
  assert.deepEqual(events[0].addressFamilies, ['IPv6', 'IPv4']);
  assert.deepEqual(events[0].attemptOutcomes, [
    { family: 'IPv6', outcome: 'timeout' },
    { family: 'IPv4', outcome: 'refused' },
  ]);
  assert.doesNotMatch(JSON.stringify(events), /192\.0\.2|2001:db8|private URL|private transport message|private connect message|private aggregate message|private stack|hostname/i);
});

test('strict emitter discards arbitrary and malicious metadata', () => {
  const events = [];
  const emit = createProbeEmitter((message, meta) => events.push({ message, ...meta }));
  const hostile = {};
  Object.defineProperty(hostile, 'family', { get() { throw new Error('private getter'); } });
  emit({
    candidateId: 'fossgis_main', success: false, elapsedMs: 1, probeTimeout: false,
    addressFamilies: ['IPv4', 'private-family'],
    attemptOutcomes: [{ family: 'IPv6', outcome: 'unreachable', address: '2001:db8::1' }, hostile],
    url: 'https://private.example', hostname: 'private.example', address: '192.0.2.10',
    port: 443, message: 'private message', stack: 'private stack', error: aggregateFetchError(),
    headers: { authorization: 'private-token' }, body: 'private body', credentials: 'private-credentials',
  });
  assert.deepEqual(Object.keys(events[0]).sort(), [
    'addressFamilies', 'attemptOutcomes', 'candidateId', 'diagnostic', 'elapsedMs',
    'message', 'probeTimeout', 'success',
  ]);
  assert.equal(events[0].diagnostic, DIAGNOSTIC);
  assert.doesNotMatch(JSON.stringify(events), /192\.0\.2|2001:db8|private\.example|private-token|private message|private stack|private body|private-credentials/i);
});

test('unknown candidates fail closed', () => {
  let writes = 0;
  const emit = createProbeEmitter(() => { writes += 1; });
  assert.equal(emit({ candidateId: 'arbitrary', success: true, url: 'https://private.example' }), undefined);
  const hostileFamilies = [];
  Object.defineProperty(hostileFamilies, '0', { get() { throw new Error('private getter'); } });
  hostileFamilies.length = 1;
  assert.equal(emit({ candidateId: 'fossgis_main', success: false, addressFamilies: hostileFamilies }), undefined);
  assert.equal(writes, 0);
});

test('diagnostic failure cannot prevent server startup', async () => {
  const env = {
    ...readEnv({ NODE_ENV: 'test', PORT: '0' }),
    port: 0,
    corsOrigins: ['http://localhost:8081'],
  };
  const server = startServer({ env, overpassConnectivityProbe() { throw new Error('private probe failure'); } });
  await new Promise((resolve) => server.listening ? resolve() : server.once('listening', resolve));
  const { port } = server.address();
  try {
    const health = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => resolve(res.statusCode)).on('error', reject);
    });
    assert.equal(health, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`Same-runtime Overpass probe tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
