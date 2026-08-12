const assert = require('node:assert/strict');
const { createProviderDiagnostics } = require('../backend/src/gateway/providerDiagnostics');
const { createOverpassProvider } = require('../backend/src/gateway/providers/overpass');
const { createNearbyService } = require('../backend/src/services/nearbyService');
const { createGatewayRoutes } = require('../backend/src/routes/gateway');

const params = { latitude: 48.2082, longitude: 16.3738, radius: 5000, limit: 10, category: 'hospital', language: 'en' };
const env = {
  gateway: { providerTimeoutMs: 5, nearbyCache: { ttlMs: 1000, staleMs: 5000 }, rateLimit: { windowMs: 60000, max: 100 } },
  providers: { googlePlacesApiKey: '', overpassApiUrl: 'https://overpass.example' },
  supabase: { url: '', anonKey: '', serviceRoleKey: '' },
};

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function capture() {
  const events = [];
  return { events, write: (message, meta) => events.push({ message, ...meta }) };
}

test('diagnostic allowlist excludes secrets, coordinates, bodies, headers and arbitrary fields', () => {
  const sink = capture();
  const diagnostics = createProviderDiagnostics('request-safe-1', sink.write);
  diagnostics.emit({
    provider: 'osm', stage: 'provider_failure', attempt: 1, elapsedMs: 8,
    upstreamStatus: 503, errorCode: 'PROVIDER_UNAVAILABLE', errorClass: 'TypeError',
    latitude: params.latitude, longitude: params.longitude, requestBody: 'secret-body',
    responseBody: 'secret-response', authorization: 'Bearer secret-token', apiKey: 'secret-key',
    userId: 'user-secret', url: 'https://example.test?private=query',
  });
  assert.equal(sink.events.length, 1);
  assert.deepEqual(Object.keys(sink.events[0]).sort(), [
    'attempt', 'elapsedMs', 'errorClass', 'errorCode', 'message', 'provider',
    'requestId', 'stage', 'upstreamStatus',
  ]);
  const serialized = JSON.stringify(sink.events);
  assert.doesNotMatch(serialized, /48\.2082|16\.3738|secret|authorization|requestBody|responseBody|userId|private=query/i);
});

test('Overpass diagnostics capture safe HTTP status, parse and normalization stages', async () => {
  const sink = capture();
  const diagnostics = createProviderDiagnostics('request-http', sink.write);
  const provider = createOverpassProvider(env, {
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ elements: [] }) }),
  });
  const results = await provider.searchNearby(params, { diagnostics });
  assert.equal(results.length, 0);
  assert.ok(sink.events.some((event) => event.stage === 'http_response' && event.upstreamStatus === 200));
  assert.ok(sink.events.some((event) => event.stage === 'parse' && event.resultCount === 0));
  assert.ok(sink.events.some((event) => event.stage === 'normalization' && event.resultCount === 0));
});

test('Overpass diagnostics distinguish 429, 4xx and 5xx without response bodies', async () => {
  for (const status of [429, 400, 503]) {
    const sink = capture();
    const diagnostics = createProviderDiagnostics(`request-${status}`, sink.write);
    const provider = createOverpassProvider(env, {
      sleep: async () => {},
      fetchImpl: async () => ({ ok: false, status, json: async () => ({ secret: 'must-not-log' }) }),
    });
    await assert.rejects(() => provider.searchNearby(params, { diagnostics }), (error) => error.code === 'PROVIDER_UNAVAILABLE');
    assert.ok(sink.events.some((event) => event.stage === 'http_response' && event.upstreamStatus === status));
    assert.doesNotMatch(JSON.stringify(sink.events), /must-not-log/);
  }
});

test('Overpass diagnostics distinguish invalid JSON and invalid envelope', async () => {
  const invalidJson = capture();
  await assert.rejects(
    () => createOverpassProvider(env, { fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('private response'); } }) })
      .searchNearby(params, { diagnostics: createProviderDiagnostics('parse-json', invalidJson.write) }),
    (error) => error.code === 'PROVIDER_UNAVAILABLE',
  );
  assert.ok(invalidJson.events.some((event) => event.stage === 'parse' && event.errorCode === 'INVALID_JSON' && event.errorClass === 'SyntaxError'));
  assert.doesNotMatch(JSON.stringify(invalidJson.events), /private response/);

  const invalidEnvelope = capture();
  await assert.rejects(
    () => createOverpassProvider(env, { fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ results: [] }) }) })
      .searchNearby(params, { diagnostics: createProviderDiagnostics('parse-envelope', invalidEnvelope.write) }),
    (error) => error.code === 'PROVIDER_UNAVAILABLE',
  );
  assert.ok(invalidEnvelope.events.some((event) => event.stage === 'parse' && event.errorCode === 'INVALID_ENVELOPE'));
});

test('Overpass timeout and fetch failures have safe classifications', async () => {
  const timeoutSink = capture();
  const timeoutProvider = createOverpassProvider(env, {
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('private'), { name: 'AbortError' })))),
  });
  await assert.rejects(
    () => timeoutProvider.searchNearby(params, { diagnostics: createProviderDiagnostics('timeout', timeoutSink.write) }),
    (error) => error.code === 'PROVIDER_TIMEOUT',
  );
  assert.ok(timeoutSink.events.some((event) => event.stage === 'provider_failure' && event.errorCode === 'PROVIDER_TIMEOUT' && event.errorClass === 'AbortError'));

  const fetchSink = capture();
  const fetchProvider = createOverpassProvider(env, {
    fetchImpl: async () => { throw Object.assign(new TypeError('getaddrinfo private-host'), { cause: { code: 'ENOTFOUND' } }); },
  });
  await assert.rejects(
    () => fetchProvider.searchNearby(params, { diagnostics: createProviderDiagnostics('fetch', fetchSink.write) }),
    (error) => error.code === 'PROVIDER_UNAVAILABLE',
  );
  assert.ok(fetchSink.events.some((event) => event.errorClass === 'ENOTFOUND'));
  assert.doesNotMatch(JSON.stringify(fetchSink.events), /private-host/);
});

test('service diagnostics identify providers and preserve fallback behavior', async () => {
  const sink = capture();
  const providers = [
    { name: 'naero', configured: true, searchNearby: async () => [] },
    { name: 'google', configured: true, searchNearby: async () => { throw Object.assign(new Error(), { name: 'GatewayError', code: 'PROVIDER_UNAVAILABLE' }); } },
    { name: 'osm', configured: true, searchNearby: async () => [{ provider: 'osm', providerId: 'node/1', name: 'Hospital', latitude: params.latitude, longitude: params.longitude, sourceAttribution: 'OpenStreetMap contributors', confidence: 'high' }] },
  ];
  const result = await createNearbyService(env, { providers, providerDiagnosticsLogger: sink.write }).searchNearby(params, { requestId: 'provider-chain' });
  assert.equal(result.items.length, 1);
  assert.equal(result.partial, true);
  for (const provider of ['naero', 'google', 'osm']) assert.ok(sink.events.some((event) => event.provider === provider && event.stage === 'provider_start'));
  assert.ok(sink.events.some((event) => event.provider === 'google' && event.stage === 'provider_failure'));
  assert.ok(sink.events.some((event) => event.provider === 'osm' && event.stage === 'provider_success' && event.resultCount === 1));
});

test('circuit open, skipped, cooldown probe, reopen and close are distinguishable', async () => {
  const sink = capture();
  let currentTime = 1000;
  let shouldFail = true;
  const provider = {
    name: 'osm', configured: true,
    searchNearby: async () => {
      if (shouldFail) throw Object.assign(new Error(), { name: 'GatewayError', code: 'PROVIDER_UNAVAILABLE' });
      return [];
    },
  };
  const service = createNearbyService(env, { providers: [provider], providerDiagnosticsLogger: sink.write, now: () => currentTime });
  for (let i = 0; i < 3; i += 1) await assert.rejects(() => service.searchNearby(params, { requestId: `failure-${i}` }));
  assert.ok(sink.events.some((event) => event.stage === 'circuit_open' && event.errorCode === 'CIRCUIT_THRESHOLD'));
  await assert.rejects(() => service.searchNearby(params, { requestId: 'skipped' }), (error) => error.code === 'PROVIDER_NOT_CONFIGURED');
  assert.ok(sink.events.some((event) => event.requestId === 'skipped' && event.stage === 'circuit_open' && event.errorCode === 'CIRCUIT_OPEN'));
  currentTime += 30001;
  await assert.rejects(() => service.searchNearby(params, { requestId: 'reopened' }));
  assert.ok(sink.events.some((event) => event.requestId === 'reopened' && event.stage === 'circuit_probe'));
  assert.ok(sink.events.some((event) => event.requestId === 'reopened' && event.stage === 'circuit_open' && event.errorCode === 'CIRCUIT_REOPENED'));
  currentTime += 30001;
  shouldFail = false;
  await service.searchNearby(params, { requestId: 'closed' });
  assert.ok(sink.events.some((event) => event.requestId === 'closed' && event.stage === 'circuit_probe'));
  assert.ok(sink.events.some((event) => event.requestId === 'closed' && event.stage === 'circuit_closed'));
});

test('gateway carries request ID and leaves the success contract unchanged', async () => {
  let context;
  const nearbyService = {
    searchNearby: async (_input, receivedContext) => {
      context = receivedContext;
      return { items: [], providers: ['osm'], attributions: [], cached: false, stale: false, partial: false };
    },
  };
  const routes = createGatewayRoutes(env, { nearbyService });
  const req = { method: 'GET', requestId: 'correlated-request', socket: { remoteAddress: '127.0.0.1' } };
  const result = await routes.handle(req, new URL('http://localhost/api/v1/nearby?latitude=48.2082&longitude=16.3738&category=hospital'));
  assert.equal(context.requestId, 'correlated-request');
  assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(result.body).sort(), ['data', 'meta', 'success']);
  assert.equal(result.body.meta.requestId, 'correlated-request');
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`Provider observability tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
