const assert = require('node:assert/strict');
const {
  classifyAddressFamilyAttempts,
  classifyNetworkError,
  createProviderDiagnostics,
} = require('../backend/src/gateway/providerDiagnostics');
const { createOverpassProvider } = require('../backend/src/gateway/providers/overpass');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function attempt(code, address, extras = {}) {
  return Object.assign(new Error('private message'), {
    code,
    address,
    hostname: 'private.example',
    stack: 'private stack',
    token: 'private-token',
    ...extras,
  });
}
function fetchError(cause) {
  return Object.assign(new TypeError('private URL'), { cause });
}
function aggregateFetchError(attempts) {
  const connectError = Object.assign(new Error('private connect message'), {
    code: 'UND_ERR_CONNECT_TIMEOUT',
    cause: new AggregateError(attempts, 'private aggregate message'),
  });
  return fetchError(connectError);
}

test('classifies a single IPv4 timeout', () => {
  assert.deepEqual(classifyAddressFamilyAttempts(fetchError(attempt('ETIMEDOUT', '192.0.2.10'))), {
    multiAddress: false,
    attemptCount: 1,
    addressFamilies: ['IPv4'],
    attemptOutcomes: [{ family: 'IPv4', outcome: 'timeout' }],
  });
});

test('classifies a single IPv6 timeout', () => {
  assert.deepEqual(classifyAddressFamilyAttempts(fetchError(attempt('ETIMEDOUT', '2001:db8::10'))), {
    multiAddress: false,
    attemptCount: 1,
    addressFamilies: ['IPv6'],
    attemptOutcomes: [{ family: 'IPv6', outcome: 'timeout' }],
  });
});

test('classifies ordered mixed-family aggregate attempts', () => {
  const result = classifyAddressFamilyAttempts(aggregateFetchError([
    attempt('ETIMEDOUT', '2001:db8::10'),
    attempt('ENETUNREACH', '192.0.2.10'),
  ]));
  assert.deepEqual(result, {
    multiAddress: true,
    attemptCount: 2,
    addressFamilies: ['IPv6', 'IPv4'],
    attemptOutcomes: [
      { family: 'IPv6', outcome: 'timeout' },
      { family: 'IPv4', outcome: 'unreachable' },
    ],
  });
});

test('normalizes multiple fixed attempt outcomes', () => {
  const result = classifyAddressFamilyAttempts(aggregateFetchError([
    attempt('ECONNREFUSED', '192.0.2.1'),
    attempt('ECONNRESET', '2001:db8::1'),
    attempt('UND_ERR_SOCKET', '192.0.2.2'),
    attempt('CERT_HAS_EXPIRED', '2001:db8::2'),
  ]));
  assert.deepEqual(result.attemptOutcomes.map(({ outcome }) => outcome), [
    'refused', 'reset', 'closed', 'tls_failure',
  ]);
});

test('unknown nested errors fail closed to fixed output', () => {
  const result = classifyAddressFamilyAttempts(aggregateFetchError([
    attempt('PRIVATE_CODE', 'not-an-address', { arbitrary: { secret: 'private' } }),
  ]));
  assert.deepEqual(result, { multiAddress: true, attemptCount: 1 });
});

test('malicious getters and unexpected causes fail closed', () => {
  const hostile = {};
  Object.defineProperty(hostile, 'cause', { get() { throw new Error('private getter'); } });
  assert.equal(classifyAddressFamilyAttempts(hostile), undefined);
  assert.equal(classifyAddressFamilyAttempts(null), undefined);
});

test('attempt inspection is bounded', () => {
  const attempts = Array.from({ length: 20 }, (_, index) => attempt('ETIMEDOUT', `192.0.2.${index + 1}`));
  const result = classifyAddressFamilyAttempts(aggregateFetchError(attempts));
  assert.equal(result.attemptCount, 8);
  assert.equal(result.attemptOutcomes.length, 8);
});

test('diagnostic emitter cannot leak transport details', () => {
  const events = [];
  const error = aggregateFetchError([
    attempt('ETIMEDOUT', '2001:db8::10'),
    attempt('ECONNREFUSED', '192.0.2.10'),
  ]);
  const diagnostics = createProviderDiagnostics('family-safe', (message, meta) => events.push({ message, ...meta }));
  diagnostics.emit({
    provider: 'osm', stage: 'provider_failure',
    ...classifyAddressFamilyAttempts(error),
    error, cause: error.cause, message: error.message, stack: error.stack,
    hostname: 'private.example', address: '192.0.2.10', url: 'https://private.example',
    token: 'private-token', credentials: 'private-credentials', arbitrary: { nested: 'private' },
  });
  assert.deepEqual(Object.keys(events[0]).sort(), [
    'addressFamilies', 'attemptCount', 'attemptOutcomes', 'message', 'multiAddress',
    'provider', 'requestId', 'stage',
  ]);
  assert.doesNotMatch(JSON.stringify(events), /192\.0\.2|2001:db8|private\.example|private-token|private-credentials|private URL|private message|private stack/i);
});

test('emitter discards invalid structured diagnostic values', () => {
  const events = [];
  const diagnostics = createProviderDiagnostics('invalid-safe', (message, meta) => events.push({ message, ...meta }));
  diagnostics.emit({
    provider: 'osm', stage: 'provider_failure', multiAddress: 'yes', attemptCount: 999,
    addressFamilies: ['IPv4', 'private-family'],
    attemptOutcomes: [
      { family: 'IPv6', outcome: 'timeout', address: '2001:db8::1' },
      { family: 'private-family', outcome: 'private-outcome' },
    ],
  });
  assert.equal(events[0].multiAddress, undefined);
  assert.equal(events[0].attemptCount, undefined);
  assert.deepEqual(events[0].addressFamilies, ['IPv4']);
  assert.deepEqual(events[0].attemptOutcomes, [{ family: 'IPv6', outcome: 'timeout' }]);
  assert.doesNotMatch(JSON.stringify(events), /2001:db8|private-family|private-outcome/i);
});

test('connect timeout network classification is unchanged', () => {
  assert.equal(classifyNetworkError(aggregateFetchError([attempt('ETIMEDOUT', '192.0.2.10')])), 'connect_timeout');
});

test('Overpass emits derived family diagnostics without changing its gateway error', async () => {
  const events = [];
  const transportError = aggregateFetchError([
    attempt('ETIMEDOUT', '2001:db8::10'),
    attempt('EHOSTUNREACH', '192.0.2.10'),
  ]);
  const provider = createOverpassProvider({
    gateway: { providerTimeoutMs: 15000 },
    providers: { overpassApiUrl: 'https://configured.example' },
  }, { fetchImpl: async () => { throw transportError; } });
  const diagnostics = createProviderDiagnostics('provider-family-safe', (message, meta) => events.push({ message, ...meta }));
  await assert.rejects(
    () => provider.searchNearby({ latitude: 1, longitude: 2, radius: 1000, limit: 5, category: 'hospital' }, { diagnostics }),
    (error) => error.code === 'PROVIDER_UNAVAILABLE',
  );
  const failure = events.find((event) => event.stage === 'provider_failure');
  assert.equal(failure.multiAddress, true);
  assert.equal(failure.attemptCount, 2);
  assert.deepEqual(failure.attemptOutcomes, [
    { family: 'IPv6', outcome: 'timeout' },
    { family: 'IPv4', outcome: 'unreachable' },
  ]);
  assert.doesNotMatch(JSON.stringify(events), /192\.0\.2|2001:db8|configured\.example|private/i);
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`Address-family diagnostic tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
