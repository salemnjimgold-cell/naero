const assert = require('node:assert/strict');
const fs = require('node:fs');
const { CATEGORY_REGISTRY } = require('../backend/src/gateway/categories');
const core = require('../backend/src/gateway/nearbyCore');
const { createNearbyCache } = require('../backend/src/gateway/cache');
const { createOverpassProvider, buildQuery, normalizeOsmElement } = require('../backend/src/gateway/providers/overpass');
const { createGooglePlacesProvider, normalizeGooglePlace, FIELD_MASK } = require('../backend/src/gateway/providers/googlePlaces');
const { createNearbyService } = require('../backend/src/services/nearbyService');
const { gatewayCategory, createNearbyQuery } = require('../src/services/nearbyClientCore');

const env = {
  gateway: { providerTimeoutMs: 15, nearbyCache: { ttlMs: 1000, staleMs: 5000 } },
  providers: { googlePlacesApiKey: '', overpassApiUrl: '' },
};
const params = { latitude: 47.4979, longitude: 19.0402, radius: 5000, limit: 20, category: 'hospital', language: 'en', countryCode: 'HU' };
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function raw(overrides = {}) {
  return {
    provider: 'osm', providerId: 'node/1', name: 'Central Hospital',
    latitude: 47.5, longitude: 19.04, sourceAttribution: '© OpenStreetMap contributors',
    confidence: 'high', ...overrides,
  };
}

test('all 24 required categories are registered', () => assert.equal(Object.keys(CATEGORY_REGISTRY).length, 24));
test('Google unconfigured is safe', async () => {
  const provider = createGooglePlacesProvider(env);
  assert.equal((await provider.healthCheck()).configured, false);
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_NOT_CONFIGURED');
});
test('Google configured uses field mask and backend key', async () => {
  let request;
  const provider = createGooglePlacesProvider(
    { ...env, providers: { ...env.providers, googlePlacesApiKey: 'server-only' } },
    { fetchImpl: async (url, options) => { request = { url, options }; return { ok: true, status: 200, json: async () => ({ places: [] }) }; } },
  );
  await provider.searchNearby(params);
  assert.match(request.url, /places:searchNearby/);
  assert.equal(request.options.headers['x-goog-api-key'], 'server-only');
  assert.equal(request.options.headers['x-goog-fieldmask'], FIELD_MASK);
});
test('Overpass unconfigured is safe', async () => {
  const provider = createOverpassProvider(env);
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_NOT_CONFIGURED');
});
test('Overpass configured constructs bounded safe query', () => {
  const query = buildQuery(params);
  assert.match(query, /\[timeout:20\]/);
  assert.match(query, /around:5000,47\.4979,19\.0402/);
  assert.doesNotMatch(query, /undefined|\[out:csv\]/);
});
test('unsupported category cannot inject raw Overpass', () => {
  assert.throws(() => buildQuery({ ...params, category: 'hospital"];out;(' }), (error) => error.code === 'INVALID_CATEGORY');
});
test('OSM node normalization', () => assert.equal(normalizeOsmElement({ type: 'node', id: 1, lat: 47.5, lon: 19.04, tags: { name: 'Node' } }, params).providerId, 'node/1'));
test('OSM way normalization uses center', () => assert.equal(normalizeOsmElement({ type: 'way', id: 2, center: { lat: 47.5, lon: 19.04 }, tags: { name: 'Way' } }, params).providerId, 'way/2'));
test('OSM relation normalization uses center', () => assert.equal(normalizeOsmElement({ type: 'relation', id: 3, center: { lat: 47.5, lon: 19.04 }, tags: { name: 'Relation' } }, params).providerId, 'relation/3'));
test('Google result normalization', () => {
  const item = normalizeGooglePlace({ id: 'g1', displayName: { text: 'Clinic' }, location: { latitude: 47.5, longitude: 19.04 } }, params);
  assert.equal(item.provider, 'google');
  assert.equal(item.providerId, 'g1');
});
test('missing name is rejected', () => assert.equal(core.normalizeResult(raw({ name: null }), params), null));
test('missing address and optional fields remain null', () => {
  const item = core.normalizeResult(raw(), params);
  assert.equal(item.address, null);
  assert.equal(item.rating, null);
  assert.equal(item.openingHours, null);
});
test('permanently closed result is marked', () => {
  const item = normalizeGooglePlace({ businessStatus: 'CLOSED_PERMANENTLY', location: { latitude: 1, longitude: 2 } }, params);
  assert.equal(item.permanentlyClosed, true);
});
test('invalid provider coordinates are rejected', () => assert.equal(core.normalizeResult(raw({ latitude: NaN }), params), null));
test('known Haversine pair is plausible', () => {
  const distance = core.distanceMeters({ latitude: 47.4979, longitude: 19.0402 }, { latitude: 48.2082, longitude: 16.3738 });
  assert.ok(distance > 210000 && distance < 220000);
});
test('boundary radius is retained', () => {
  const candidate = raw({ latitude: 47.4979 + (4999 / 111320), longitude: 19.0402 });
  assert.ok(core.normalizeResult(candidate, params));
});
test('outside radius is rejected', () => assert.equal(core.normalizeResult(raw({ latitude: 48, longitude: 19.04 }), params), null));
test('zero-distance result is retained', () => assert.equal(core.normalizeResult(raw({ latitude: params.latitude, longitude: params.longitude }), params).distanceMeters, 0));
test('0,0 result is rejected', () => assert.equal(core.normalizeResult(raw({ latitude: 0, longitude: 0 }), { ...params, latitude: 0.01, longitude: 0.01 }), null));
test('same Google and OSM place deduplicates', () => {
  const a = core.normalizeResult(raw({ provider: 'google', providerId: 'g1', address: 'Main 1', phone: '123' }), params);
  const b = core.normalizeResult(raw({ providerId: 'node/2', address: 'Main 1', phone: '123' }), params);
  assert.equal(core.deduplicate([a, b]).length, 1);
});
test('similar name at different location is not merged', () => {
  const a = core.normalizeResult(raw(), params);
  const b = core.normalizeResult(raw({ providerId: 'node/2', latitude: 47.52 }), params);
  assert.equal(core.deduplicate([a, b]).length, 2);
});
test('same coordinates with unrelated categories are not merged', () => {
  const a = core.normalizeResult(raw(), params);
  const b = { ...a, id: 'osm:other', providerId: 'node/other', category: 'pharmacy' };
  assert.equal(core.deduplicate([a, b]).length, 2);
});
test('more complete duplicate is preferred', () => {
  const a = core.normalizeResult(raw(), params);
  const b = core.normalizeResult(raw({ provider: 'google', providerId: 'g1', phone: '123', website: 'https://example.test' }), params);
  assert.equal(core.deduplicate([a, b])[0].phone, '123');
});
test('nearer relevant result ranks first', () => {
  const near = core.normalizeResult(raw({ providerId: 'near' }), params);
  const far = core.normalizeResult(raw({ providerId: 'far', latitude: 47.52 }), params);
  assert.equal(core.rank([far, near])[0].providerId, 'near');
});
test('completeness breaks close-distance tie', () => {
  const a = core.normalizeResult(raw({ providerId: 'a' }), params);
  const b = core.normalizeResult(raw({ providerId: 'b', latitude: 47.5001, phone: '123', website: 'https://example.test' }), params);
  assert.equal(core.rank([a, b])[0].providerId, 'b');
});
test('open-now breaks an otherwise equal tie', () => {
  const a = core.normalizeResult(raw({ providerId: 'a', isOpenNow: null }), params);
  const b = core.normalizeResult(raw({ providerId: 'b', isOpenNow: true }), params);
  assert.equal(core.rank([a, b])[0].providerId, 'b');
});
test('missing rating does not penalize ranking', () => {
  const a = core.normalizeResult(raw({ providerId: 'a', rating: null }), params);
  const b = core.normalizeResult(raw({ providerId: 'b', rating: 5 }), params);
  assert.equal(core.rank([a, b])[0].providerId, 'a');
});
test('Google timeout falls back to Overpass', async () => {
  const providers = [
    { name: 'google', configured: true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_TIMEOUT' }); } },
    { name: 'osm', configured: true, searchNearby: async () => [raw()] },
  ];
  const result = await createNearbyService(env, { providers }).searchNearby(params);
  assert.equal(result.items.length, 1);
  assert.equal(result.partial, true);
});
test('sufficient verified results stop before live providers', async () => {
  let liveCalls = 0;
  const verified = Array.from({ length: 2 }, (_, index) => raw({ provider: 'naero', providerId: `verified-${index}`, name: `Verified ${index}`, verified: true }));
  const providers = [
    { name: 'naero', sourceRole: 'VERIFIED', configured: true, searchNearby: async () => verified },
    { name: 'google', sourceRole: 'LIVE', configured: true, searchNearby: async () => { liveCalls += 1; return []; } },
  ];
  const result = await createNearbyService(env, { providers }).searchNearby({ ...params, limit: 2 });
  assert.equal(result.items.length, 2); assert.equal(liveCalls, 0);
  assert.deepEqual(result.sourcesAttempted, ['naero']); assert.equal(result.coverageStatus, 'sufficient');
});
test('insufficient verified results call live provider only for remaining coverage', async () => {
  let googleCalls = 0; let osmCalls = 0;
  const providers = [
    { name: 'naero', sourceRole: 'VERIFIED', configured: true, searchNearby: async () => [raw({ provider: 'naero', providerId: 'v1', name: 'Verified', verified: true })] },
    { name: 'google', sourceRole: 'LIVE', configured: true, searchNearby: async () => { googleCalls += 1; return [raw({ provider: 'google', providerId: 'g1', name: 'Other Hospital', latitude: 47.501 })]; } },
    { name: 'osm', sourceRole: 'LIVE', configured: true, searchNearby: async () => { osmCalls += 1; return []; } },
  ];
  const result = await createNearbyService(env, { providers }).searchNearby({ ...params, limit: 2 });
  assert.equal(result.items.length, 2); assert.equal(googleCalls, 1); assert.equal(osmCalls, 0);
});
test('provider failure plus usable results returns truthful partial success', async () => {
  const providers = [
    { name: 'naero', sourceRole: 'VERIFIED', configured: true, searchNearby: async () => [raw({ provider: 'naero', providerId: 'v1', verified: true })] },
    { name: 'google', sourceRole: 'LIVE', configured: true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_UNAVAILABLE' }); } },
  ];
  const result = await createNearbyService(env, { providers }).searchNearby({ ...params, limit: 2 });
  assert.equal(result.items.length, 1); assert.equal(result.partial, true); assert.equal(result.coverageStatus, 'partial');
  assert.deepEqual(result.sourcesSucceeded, ['naero']);
});
test('genuine successful empty response differs from total provider failure', async () => {
  const empty = await createNearbyService(env, { providers: [{ name: 'osm', configured: true, searchNearby: async () => [] }] }).searchNearby(params);
  assert.deepEqual(empty.items, []); assert.equal(empty.coverageStatus, 'exhausted'); assert.equal(empty.partial, false);
  await assert.rejects(
    () => createNearbyService(env, { providers: [{ name: 'osm', configured: true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_UNAVAILABLE' }); } }] }).searchNearby(params),
    (error) => error.code === 'PROVIDER_UNAVAILABLE',
  );
});
test('Google quota error falls back to Overpass', async () => {
  const providers = [
    { name: 'google', configured: true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_UNAVAILABLE' }); } },
    { name: 'osm', configured: true, searchNearby: async () => [raw()] },
  ];
  assert.equal((await createNearbyService(env, { providers }).searchNearby(params)).items.length, 1);
});
test('all providers unavailable returns normalized failure', async () => {
  const providers = [{ name: 'osm', configured: true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_UNAVAILABLE' }); } }];
  await assert.rejects(() => createNearbyService(env, { providers }).searchNearby(params), (error) => error.code === 'PROVIDER_UNAVAILABLE');
});
test('malformed and partial provider response is filtered', async () => {
  const providers = [{ name: 'osm', configured: true, searchNearby: async () => [raw(), raw({ providerId: 'bad', name: null })] }];
  assert.equal((await createNearbyService(env, { providers }).searchNearby(params)).items.length, 1);
});
test('cache key rounds exact coordinates', () => {
  const cache = createNearbyCache({ ttlMs: 1000, staleMs: 5000 });
  assert.equal(cache.key(params), cache.key({ ...params, latitude: params.latitude + 0.00001 }));
});
test('cache key isolates country codes', () => {
  const cache = createNearbyCache({ ttlMs: 1000, staleMs: 5000 });
  assert.notEqual(cache.key({ ...params, countryCode: 'AT' }), cache.key({ ...params, countryCode: 'HU' }));
  cache.set({ ...params, countryCode: 'AT' }, { marker: 'austria' });
  assert.equal(cache.get({ ...params, countryCode: 'HU' }), null);
});
test('normalized lineage is structured, private, and preserved through deduplication', () => {
  const verified = core.normalizeResult(raw({ provider: 'naero', providerId: 'v1', sourceRole: 'VERIFIED', verified: true }), params);
  const live = core.normalizeResult(raw({ provider: 'osm', providerId: 'node/2', sourceRole: 'LIVE' }), params);
  const merged = core.deduplicate([verified, live])[0];
  assert.deepEqual(merged._lineage.map((item) => item.sourceRole).sort(), ['LIVE', 'VERIFIED']);
  assert.equal(JSON.stringify(merged).includes('_lineage'), false);
});
test('resolver diagnostics do not contain coordinates, query strings, or secrets', async () => {
  const events = [];
  const providers = [{ name: 'osm', sourceRole: 'LIVE', configured: true, searchNearby: async () => [raw()] }];
  await createNearbyService(env, { providers, providerDiagnosticsLogger: (_message, event) => events.push(event) }).searchNearby(params, { requestId: 'safe-request' });
  const serialized = JSON.stringify(events);
  assert.doesNotMatch(serialized, /47\.4979|19\.0402|latitude|longitude|apiKey|token|authorization|\?.*=/i);
  assert.match(serialized, /safe-request/);
});
test('stale cache fallback is returned after provider failure', async () => {
  const cache = createNearbyCache({ ttlMs: 0, staleMs: 5000 });
  cache.set(params, { items: [core.normalizeResult(raw(), params)], providers: ['osm'], attributions: ['OSM'], partial: false }, Date.now() - 5);
  const providers = [{ name: 'osm', configured: true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_TIMEOUT' }); } }];
  const result = await createNearbyService(env, { providers, cache }).searchNearby(params);
  assert.equal(result.stale, true); assert.equal(result.coverageStatus, 'stale'); assert.equal(result.partial, true);
});
test('request cancellation normalizes as provider timeout', async () => {
  const configuredEnv = { ...env, providers: { ...env.providers, overpassApiUrl: 'https://example.test' } };
  const provider = createOverpassProvider(configuredEnv, {
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' })))),
  });
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_TIMEOUT');
});
test('mobile active nearby path has no direct provider import or mock fallback', () => {
  const placeSource = fs.readFileSync(require.resolve('../src/services/placeService.js'), 'utf8');
  const realtimeSource = fs.readFileSync(require.resolve('../src/services/realTimeService.js'), 'utf8');
  assert.doesNotMatch(placeSource + realtimeSource, /overpassApi|googlePlacesApi|nominatimApi/);
  const getNearbyBody = placeSource.slice(placeSource.indexOf('async getNearby'), placeSource.indexOf('async getByCategory'));
  assert.doesNotMatch(getNearbyBody, /mock|local|overpass/i);
});
test('Discover exposes loading, error, stale and attribution states', () => {
  const source = fs.readFileSync(require.resolve('../src/screens/DiscoverScreen.js'), 'utf8');
  for (const token of ['loading', 'nearbyError', 'stale', 'attributions']) assert.match(source, new RegExp(token));
});
test('mobile category aliases map to backend registry keys', () => assert.equal(gatewayCategory('hospitals'), 'hospital'));
test('mobile nearby query includes bounded request fields', () => {
  const query = new URLSearchParams(createNearbyQuery({ latitude: 1, longitude: 2, radiusKm: 5, limit: 10, category: 'pharmacies', language: 'fr' }));
  assert.equal(query.get('radius'), '5000');
  assert.equal(query.get('category'), 'pharmacy');
  assert.equal(query.get('language'), 'fr');
});
test('shared place service has no static place dataset', () => {
  const source = fs.readFileSync(require.resolve('../src/services/placeService.js'), 'utf8');
  assert.match(source, /super\('places', \[\]/);
  assert.doesNotMatch(source, /mockPlaces/);
});
test('Home nearby state uses coordinate-backed gateway search', () => {
  const source = fs.readFileSync(require.resolve('../src/context/AppContext.js'), 'utf8');
  const body = source.slice(source.indexOf('const loadNearbyData'), source.indexOf('const triggerSync'));
  assert.match(body, /placeService\.getNearby/);
  assert.doesNotMatch(body, /placeService\.getByCity/);
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`Nearby provider tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
