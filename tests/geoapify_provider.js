const assert = require('node:assert/strict');
const { createGeoapifyProvider, buildGeoapifyUrl, normalizeGeoapifyPlace, GEOAPIFY_ATTRIBUTION } = require('../backend/src/gateway/providers/geoapify');
const { GEOAPIFY_CATEGORY_MAP, GEOAPIFY_CATEGORY_TIERS } = require('../backend/src/gateway/providers/geoapifyCategories');
const { CATEGORY_REGISTRY } = require('../backend/src/gateway/categories');
const { createNearbyService } = require('../backend/src/services/nearbyService');
const { normalizeResult } = require('../backend/src/gateway/nearbyCore');
const { readEnv, getPublicConfig } = require('../backend/src/config/env');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const params = { latitude: 48.2082, longitude: 16.3738, radius: 5000, limit: 10, category: 'hospital', language: 'en', countryCode: 'AT' };
const env = {
  gateway: { providerTimeoutMs: 20, nearbyCache: { ttlMs: 1000, staleMs: 5000 } },
  providers: { geoapifyApiKey: '', googlePlacesApiKey: '', overpassApiUrl: '' },
};
function feature(overrides = {}) {
  return {
    type: 'Feature', geometry: { type: 'Point', coordinates: [16.374, 48.208] },
    properties: {
      place_id: 'geo-place-1', name: 'Public Hospital', formatted: 'Main Street 1, Vienna',
      city: 'Vienna', state: 'Vienna', country: 'Austria', country_code: 'at',
      lat: 48.208, lon: 16.374, website: 'https://hospital.example', opening_hours: 'Mo-Fr 08:00-18:00',
      ...overrides,
    },
  };
}
function response(payload, status = 200, options = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => {
    if (options.invalidJson) throw new SyntaxError('raw response must not leak');
    return payload;
  } };
}
function configured(options = {}) {
  return createGeoapifyProvider({ ...env, providers: { ...env.providers, geoapifyApiKey: 'test-backend-key' } }, options);
}

test('provider is backend-only disabled when key is absent', async () => {
  const provider = createGeoapifyProvider(env);
  assert.equal(provider.configured, false); assert.equal(provider.sourceRole, 'LIVE');
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_NOT_CONFIGURED');
});
test('environment reads backend key without exposing it through public config', () => {
  const parsed = readEnv({ NAERO_ENV_FILE: 'missing-lde1-env-file', GEOAPIFY_API_KEY: 'test-backend-key' });
  assert.equal(parsed.providers.geoapifyApiKey, 'test-backend-key');
  assert.doesNotMatch(JSON.stringify(getPublicConfig(parsed)), /geoapify|test-backend-key/i);
});
test('category policy covers every Naero category exactly', () => {
  assert.deepEqual(Object.keys(GEOAPIFY_CATEGORY_MAP).sort(), Object.keys(CATEGORY_REGISTRY).sort());
  const tiers = Object.values(GEOAPIFY_CATEGORY_MAP).map((item) => item.tier);
  assert.ok(tiers.includes(GEOAPIFY_CATEGORY_TIERS.STRONG));
  assert.ok(tiers.includes(GEOAPIFY_CATEGORY_TIERS.VALIDATE));
  assert.ok(tiers.includes(GEOAPIFY_CATEGORY_TIERS.CURATED));
  for (const key of ['immigration_office', 'legal_aid', 'ngo', 'translator', 'shelter', 'job_center', 'emergency']) {
    assert.deepEqual(GEOAPIFY_CATEGORY_MAP[key].categories, []);
  }
});
test('request uses fixed HTTPS endpoint, circle, proximity, language, radius and bounded limit', () => {
  const url = buildGeoapifyUrl({ ...params, limit: 50 }, 'test-backend-key');
  assert.equal(url.origin + url.pathname, 'https://api.geoapify.com/v2/places');
  assert.equal(url.searchParams.get('categories'), 'healthcare.hospital');
  assert.equal(url.searchParams.get('filter'), 'circle:16.3738,48.2082,5000');
  assert.equal(url.searchParams.get('bias'), 'proximity:16.3738,48.2082');
  assert.equal(url.searchParams.get('lang'), 'en'); assert.equal(url.searchParams.get('limit'), '20');
  assert.equal(url.searchParams.get('apiKey'), 'test-backend-key');
});
test('halal food uses explicit condition and unsupported category fails before request', () => {
  const url = buildGeoapifyUrl({ ...params, category: 'halal_food' }, 'key');
  assert.equal(url.searchParams.get('categories'), 'catering'); assert.equal(url.searchParams.get('conditions'), 'halal');
  assert.throws(() => buildGeoapifyUrl({ ...params, category: 'legal_aid' }, 'key'), (error) => error.code === 'INVALID_CATEGORY');
});
test('valid GeoJSON normalizes supported fields without fabricated trust fields', async () => {
  const provider = configured({ fetchImpl: async () => response({ type: 'FeatureCollection', features: [feature()] }) });
  const [item] = await provider.searchNearby(params);
  assert.equal(item.provider, 'geoapify'); assert.equal(item.providerId, 'geo-place-1'); assert.equal(item.name, 'Public Hospital');
  assert.equal(item.countryCode, 'AT'); assert.deepEqual(item.openingHours, ['Mo-Fr 08:00-18:00']);
  assert.equal(item.rating, null); assert.equal(item.reviewCount, null); assert.equal(item.verified, false); assert.equal(item.isOpenNow, null);
  assert.equal(item.sourceAttribution, GEOAPIFY_ATTRIBUTION);
  const canonical = normalizeResult({ ...item, sourceRole: 'LIVE' }, params);
  assert.ok(canonical.distanceMeters >= 0 && canonical.distanceMeters < 100);
});
test('geometry coordinates are used when property coordinates are absent', () => {
  const item = normalizeGeoapifyPlace(feature({ lat: undefined, lon: undefined }), params);
  assert.equal(item.latitude, 48.208); assert.equal(item.longitude, 16.374);
});
test('legitimate empty FeatureCollection succeeds', async () => {
  const provider = configured({ fetchImpl: async () => response({ type: 'FeatureCollection', features: [] }) });
  assert.deepEqual(await provider.searchNearby(params), []);
});
test('missing place_id and wrong-country records are discarded', async () => {
  const provider = configured({ fetchImpl: async () => response({ type: 'FeatureCollection', features: [feature({ place_id: null }), feature({ place_id: 'de-1', country_code: 'de' })] }) });
  assert.deepEqual(await provider.searchNearby(params), []);
});
test('malformed envelope and invalid JSON fail safely', async () => {
  await assert.rejects(() => configured({ fetchImpl: async () => response({ places: [] }) }).searchNearby(params), (error) => error.code === 'PROVIDER_UNAVAILABLE');
  await assert.rejects(() => configured({ fetchImpl: async () => response(null, 200, { invalidJson: true }) }).searchNearby(params), (error) => error.code === 'PROVIDER_UNAVAILABLE' && !error.message.includes('raw response'));
});
for (const status of [400, 401, 403, 429, 500, 503]) test(`HTTP ${status} is normalized`, async () => {
  await assert.rejects(() => configured({ fetchImpl: async () => response({}, status) }).searchNearby(params), (error) => error.code === 'PROVIDER_UNAVAILABLE');
});
test('AbortController timeout is normalized', async () => {
  const provider = configured({ fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' })))) });
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_TIMEOUT');
});
test('network failure is normalized without raw error leakage', async () => {
  const provider = configured({ fetchImpl: async () => { throw Object.assign(new TypeError('host and secret-key'), { cause: { code: 'ENOTFOUND' } }); } });
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_UNAVAILABLE' && !/host|secret-key/.test(error.message));
});
test('diagnostics contain safe stages but no key, URL, coordinates or response body', async () => {
  const events = [];
  const provider = configured({ fetchImpl: async () => response({ type: 'FeatureCollection', features: [feature({ secret: 'raw-body-secret' })] }) });
  await provider.searchNearby(params, { diagnostics: { emit: (event) => events.push(event) } });
  const serialized = JSON.stringify(events);
  for (const safe of ['request', 'http_response', 'parse', 'normalization']) assert.match(serialized, new RegExp(safe));
  assert.doesNotMatch(serialized, /test-backend-key|raw-body-secret|48\.2082|16\.3738|api\.geoapify|latitude|longitude/i);
});
test('verified sufficiency skips Geoapify', async () => {
  let calls = 0;
  const raw = (provider, providerId, name) => ({ provider, providerId, name, latitude: 48.208, longitude: 16.374, verified: provider === 'naero', sourceAttribution: provider });
  const providers = [
    { name: 'naero', sourceRole: 'VERIFIED', configured: true, searchNearby: async () => [raw('naero', 'v1', 'One'), raw('naero', 'v2', 'Two')] },
    { name: 'geoapify', sourceRole: 'LIVE', configured: true, supportsCategory: () => true, searchNearby: async () => { calls += 1; return []; } },
  ];
  const result = await createNearbyService(env, { providers }).searchNearby({ ...params, limit: 2 });
  assert.equal(result.items.length, 2); assert.equal(calls, 0);
});
test('Geoapify sufficiency skips later live fallback', async () => {
  let osmCalls = 0;
  const raw = (provider, providerId, name) => ({ provider, providerId, name, latitude: 48.208, longitude: 16.374, sourceAttribution: provider });
  const providers = [
    { name: 'naero', sourceRole: 'VERIFIED', configured: true, searchNearby: async () => [] },
    { name: 'geoapify', sourceRole: 'LIVE', configured: true, supportsCategory: () => true, searchNearby: async () => [raw('geoapify', 'g1', 'One')] },
    { name: 'osm', sourceRole: 'LIVE', configured: true, searchNearby: async () => { osmCalls += 1; return []; } },
  ];
  const result = await createNearbyService(env, { providers }).searchNearby({ ...params, limit: 1 });
  assert.equal(result.items.length, 1); assert.equal(osmCalls, 0); assert.deepEqual(result.sourcesSucceeded, ['naero', 'geoapify']);
  assert.equal(result.items[0]._lineage[0].sourceRole, 'LIVE');
});
test('Geoapify failure plus usable verified result remains partial', async () => {
  const providers = [
    { name: 'naero', sourceRole: 'VERIFIED', configured: true, searchNearby: async () => [{ provider: 'naero', providerId: 'v1', name: 'One', latitude: 48.208, longitude: 16.374, verified: true }] },
    { name: 'geoapify', sourceRole: 'LIVE', configured: true, supportsCategory: () => true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_UNAVAILABLE' }); } },
  ];
  const result = await createNearbyService(env, { providers }).searchNearby({ ...params, limit: 2 });
  assert.equal(result.items.length, 1); assert.equal(result.partial, true);
});
test('Geoapify total failure preserves safe gateway failure semantics', async () => {
  const providers = [{ name: 'geoapify', sourceRole: 'LIVE', configured: true, supportsCategory: () => true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_UNAVAILABLE' }); } }];
  await assert.rejects(() => createNearbyService(env, { providers }).searchNearby(params), (error) => error.code === 'PROVIDER_UNAVAILABLE');
});
test('default provider priority is verified, Geoapify, Google, OSM', () => {
  const service = createNearbyService({
    ...env,
    providers: { geoapifyApiKey: 'configured', googlePlacesApiKey: 'configured', overpassApiUrl: 'https://overpass.example' },
    supabase: { url: 'https://supabase.example', anonKey: 'configured', serviceRoleKey: '' },
  }, { fetchImpl: async () => response({ type: 'FeatureCollection', features: [] }) });
  assert.deepEqual(service.providers.map((provider) => provider.name), ['naero', 'geoapify', 'google', 'osm']);
});
test('unconfigured Geoapify does not destabilize configured fallback', async () => {
  const providers = [
    { name: 'geoapify', sourceRole: 'LIVE', configured: false, supportsCategory: () => true, searchNearby: async () => { throw new Error('must not call'); } },
    { name: 'osm', sourceRole: 'LIVE', configured: true, searchNearby: async () => [{ provider: 'osm', providerId: 'node/1', name: 'One', latitude: 48.208, longitude: 16.374 }] },
  ];
  assert.equal((await createNearbyService(env, { providers }).searchNearby({ ...params, limit: 1 })).items.length, 1);
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`Geoapify provider tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
