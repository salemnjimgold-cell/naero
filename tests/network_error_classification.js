const assert = require('node:assert/strict');
const { classifyNetworkError, createProviderDiagnostics } = require('../backend/src/gateway/providerDiagnostics');
const { createOverpassProvider } = require('../backend/src/gateway/providers/overpass');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function networkError(code, extras = {}) {
  return Object.assign(new TypeError('private host https://secret.example token=private-token'), {
    cause: {
      code,
      hostname: 'secret.example',
      address: '192.0.2.10',
      url: 'https://secret.example/private?token=private-token',
      credentials: 'private-credentials',
      nested: { arbitrary: 'private-nested-value' },
      ...extras,
    },
  });
}

test('known DNS codes map safely', () => {
  assert.equal(classifyNetworkError(networkError('ENOTFOUND')), 'dns_failure');
  assert.equal(classifyNetworkError(networkError('EAI_AGAIN')), 'dns_failure');
});

test('connection reset and refused codes map safely', () => {
  assert.equal(classifyNetworkError(networkError('ECONNRESET')), 'connection_reset');
  assert.equal(classifyNetworkError(networkError('ECONNREFUSED')), 'connection_refused');
  assert.equal(classifyNetworkError(networkError('UND_ERR_SOCKET')), 'connection_closed');
});

test('connect timeout codes map safely', () => {
  assert.equal(classifyNetworkError(networkError('UND_ERR_CONNECT_TIMEOUT')), 'connect_timeout');
  assert.equal(classifyNetworkError(networkError('ETIMEDOUT')), 'connect_timeout');
});

test('representative TLS errors map safely', () => {
  for (const code of [
    'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT',
    'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  ]) assert.equal(classifyNetworkError(networkError(code)), 'tls_failure');
});

test('network and address unreachable codes map safely', () => {
  assert.equal(classifyNetworkError(networkError('ENETUNREACH')), 'network_unreachable');
  assert.equal(classifyNetworkError(networkError('EHOSTUNREACH')), 'address_unreachable');
});

test('unknown and absent codes map to generic network failure', () => {
  assert.equal(classifyNetworkError(networkError('PRIVATE_UNKNOWN_CODE')), 'generic_network_failure');
  assert.equal(classifyNetworkError(new TypeError('private message')), 'generic_network_failure');
  assert.equal(classifyNetworkError(null), 'generic_network_failure');
});

test('diagnostic emitter cannot leak raw network error properties', () => {
  const events = [];
  const error = networkError('ENOTFOUND');
  const diagnostics = createProviderDiagnostics('network-safe', (message, meta) => events.push({ message, ...meta }));
  diagnostics.emit({
    provider: 'osm', stage: 'provider_failure', errorClass: 'TypeError',
    networkClass: classifyNetworkError(error), error, cause: error.cause,
    message: error.message, hostname: error.cause.hostname, address: error.cause.address,
    url: error.cause.url, credentials: error.cause.credentials, token: 'private-token',
  });
  assert.equal(events[0].networkClass, 'dns_failure');
  assert.deepEqual(Object.keys(events[0]).sort(), ['errorClass', 'message', 'networkClass', 'provider', 'requestId', 'stage']);
  assert.doesNotMatch(JSON.stringify(events), /secret\.example|192\.0\.2\.10|private|credential|token|hostname|address|url|nested/i);
});

test('Overpass fetch failure emits only normalized network classification', async () => {
  const events = [];
  const env = {
    gateway: { providerTimeoutMs: 50 },
    providers: { overpassApiUrl: 'https://configured.example' },
  };
  const provider = createOverpassProvider(env, { fetchImpl: async () => { throw networkError('ECONNRESET'); } });
  const diagnostics = createProviderDiagnostics('overpass-network', (message, meta) => events.push({ message, ...meta }));
  await assert.rejects(
    () => provider.searchNearby({ latitude: 1, longitude: 2, radius: 1000, limit: 5, category: 'hospital' }, { diagnostics }),
    (error) => error.code === 'PROVIDER_UNAVAILABLE',
  );
  const failure = events.find((event) => event.stage === 'provider_failure');
  assert.equal(failure.networkClass, 'connection_reset');
  assert.equal(failure.errorClass, 'ECONNRESET');
  assert.doesNotMatch(JSON.stringify(events), /secret\.example|192\.0\.2\.10|private|credential|token/i);
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`Network error classification tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
