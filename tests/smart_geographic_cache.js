const assert = require('assert');
const {
  CELL_SIZE_METERS,
  RADIUS_BUCKETS_METERS,
  cacheDimensions,
  createNearbyCache,
  geographicCell,
  radiusBucket,
} = require('../backend/src/gateway/cache');
const { createNearbyService } = require('../backend/src/services/nearbyService');

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}

const env = { gateway: { nearbyCache: { ttlMs: 1000, staleMs: 5000, maxEntries: 25 } } };
const base = { latitude: 47.6874, longitude: 17.6504, radius: 1000, limit: 5, category: 'hospital', countryCode: 'HU', language: 'hu' };
function place(providerParams, index = 0, category = 'hospital') {
  return {
    provider: 'geoapify', providerId: `place-${category}-${index}`, name: `${category} ${index}`,
    latitude: providerParams.latitude + index * 0.00005,
    longitude: providerParams.longitude + index * 0.00005,
    countryCode: providerParams.countryCode,
    sourceAttribution: '© OpenStreetMap contributors; Powered by Geoapify',
  };
}
function providerWith(count, counter) {
  return {
    name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async (params) => {
      counter.calls += 1;
      counter.params.push(params);
      return Array.from({ length: count }, (_, index) => place(params, index, params.category));
    },
  };
}

(async () => {
  await test('500m meter-aware cells are deterministic', () => {
    assert.equal(CELL_SIZE_METERS, 500);
    assert.deepEqual(geographicCell(base.latitude, base.longitude), geographicCell(base.latitude, base.longitude));
  });
  await test('small movement within a cell retains identity', () => {
    const cell = geographicCell(base.latitude, base.longitude);
    assert.equal(geographicCell(cell.centerLatitude + 0.0001, cell.centerLongitude + 0.0001).id, cell.id);
  });
  await test('latitude cell boundary changes identity', () => {
    const cell = geographicCell(base.latitude, base.longitude);
    assert.notEqual(geographicCell(cell.centerLatitude + 0.005, cell.centerLongitude).id, cell.id);
  });
  await test('longitude cell boundary changes identity', () => {
    const cell = geographicCell(base.latitude, base.longitude);
    const longitudeWidth = 360 / cell.longitudeCellCount;
    assert.notEqual(geographicCell(cell.centerLatitude, cell.centerLongitude + longitudeWidth * 0.51).id, cell.id);
  });
  await test('negative and antimeridian coordinates are stable', () => {
    assert.equal(geographicCell(-33.8688, -151.2093).id, geographicCell(-33.8688, -151.2093).id);
    assert.notEqual(geographicCell(0, -180).id, geographicCell(0, 180).id);
  });
  await test('high latitudes use bounded longitude cells', () => {
    const north = geographicCell(89.999, 45);
    const pole = geographicCell(90, 180);
    assert.ok(north.longitudeCellCount >= 1);
    assert.equal(pole.longitudeCellCount, 1);
  });
  await test('radius buckets conservatively include cell traversal margin', () => {
    assert.deepEqual(RADIUS_BUCKETS_METERS, [1000, 2000, 5000, 10000, 25000, 50000]);
    assert.equal(radiusBucket(500), 1000);
    assert.equal(radiusBucket(1000), 2000);
    assert.equal(radiusBucket(2000), 5000);
    assert.equal(radiusBucket(49600), 50000);
    assert.equal(radiusBucket(50000), null);
  });
  await test('key canonicalizes aliases and omits exact coordinates and limit', () => {
    const cache = createNearbyCache({ ttlMs: 1000, staleMs: 1000 });
    const alias = cache.key({ ...base, category: 'hospitals', limit: 5 });
    const canonical = cache.key({ ...base, category: 'hospital', limit: 20 });
    assert.equal(alias, canonical);
    assert.ok(!alias.includes(String(base.latitude)) && !alias.includes(String(base.longitude)));
  });
  await test('country and language remain isolated', () => {
    const cache = createNearbyCache({ ttlMs: 1000, staleMs: 1000 });
    assert.notEqual(cache.key(base), cache.key({ ...base, countryCode: 'AT' }));
    assert.notEqual(cache.key(base), cache.key({ ...base, language: 'en' }));
  });
  await test('user device session request and limit do not affect identity', () => {
    const cache = createNearbyCache({ ttlMs: 1000, staleMs: 1000 });
    const key = cache.key(base);
    assert.equal(key, cache.key({ ...base, limit: 50, userId: 'user', deviceId: 'device', sessionId: 'session', requestId: 'request' }));
    for (const privateValue of ['user', 'device', 'session', 'request']) assert.ok(!key.includes(privateValue));
  });
  await test('LRU is bounded and successful access refreshes recency', () => {
    const cache = createNearbyCache({ ttlMs: 10000, staleMs: 1000, maxEntries: 2 });
    const a = base; const b = { ...base, category: 'pharmacy' }; const c = { ...base, category: 'supermarket' };
    cache.set(a, 'a', 1); cache.set(b, 'b', 2); assert.equal(cache.get(a, { now: 3 }).value, 'a'); cache.set(c, 'c', 4);
    assert.equal(cache.size(), 2); assert.equal(cache.get(b, { now: 4 }), null); assert.equal(cache.get(a, { now: 4 }).value, 'a');
  });
  await test('fresh stale and expired windows remain distinct', () => {
    const cache = createNearbyCache({ ttlMs: 10, staleMs: 20 });
    cache.set(base, 'value', 100);
    assert.equal(cache.get(base, { now: 110 }).stale, false);
    assert.equal(cache.get(base, { now: 111 }), null);
    assert.equal(cache.get(base, { allowStale: true, now: 111 }).stale, true);
    assert.equal(cache.get(base, { allowStale: true, now: 131 }), null);
  });
  await test('same cell and different limit reuse one provider acquisition', async () => {
    const counter = { calls: 0, params: [] };
    const service = createNearbyService(env, { providers: [providerWith(20, counter)] });
    assert.equal((await service.searchNearby(base)).items.length, 5);
    assert.equal((await service.searchNearby({ ...base, limit: 20 })).items.length, 20);
    assert.equal(counter.calls, 1); assert.equal(counter.params[0].limit, 50);
  });
  await test('small same-cell movement suppresses provider traffic', async () => {
    const counter = { calls: 0, params: [] }; const service = createNearbyService(env, { providers: [providerWith(20, counter)] });
    await service.searchNearby(base);
    const cell = geographicCell(base.latitude, base.longitude);
    const moved = await service.searchNearby({ ...base, latitude: cell.centerLatitude + 0.0001, longitude: cell.centerLongitude + 0.0001 });
    assert.equal(moved.cached, true); assert.equal(counter.calls, 1);
  });
  await test('cell boundary category country and language changes trigger separate discovery', async () => {
    const counter = { calls: 0, params: [] }; const service = createNearbyService(env, { providers: [providerWith(20, counter)] });
    await service.searchNearby(base);
    const cell = geographicCell(base.latitude, base.longitude);
    await service.searchNearby({ ...base, latitude: cell.centerLatitude + 0.005 });
    await service.searchNearby({ ...base, category: 'pharmacy' });
    await service.searchNearby({ ...base, countryCode: 'AT' });
    await service.searchNearby({ ...base, language: 'en' });
    assert.equal(counter.calls, 5);
  });
  await test('larger incompatible radius does not reuse smaller coverage', async () => {
    const counter = { calls: 0, params: [] }; const service = createNearbyService(env, { providers: [providerWith(20, counter)] });
    await service.searchNearby({ ...base, radius: 500 });
    await service.searchNearby({ ...base, radius: 1000 });
    assert.equal(counter.calls, 2);
    assert.deepEqual(counter.params.map((params) => params.radius), [1000, 2000]);
  });
  await test('same radius bucket reuses larger fetched coverage with exact-radius filtering', async () => {
    const counter = { calls: 0, params: [] }; const service = createNearbyService(env, { providers: [providerWith(20, counter)] });
    const first = await service.searchNearby({ ...base, radius: 1200 });
    const second = await service.searchNearby({ ...base, radius: 1500 });
    assert.equal(first.cached, false); assert.equal(second.cached, true); assert.equal(counter.calls, 1);
    assert.ok(second.items.every((item) => item.distanceMeters <= 1500));
  });
  await test('stale compatible data rescues live failure truthfully', async () => {
    const cache = createNearbyCache({ ttlMs: 1, staleMs: 1000 });
    const dimensions = cacheDimensions(base);
    const raw = [place({ ...base, latitude: dimensions.cell.centerLatitude, longitude: dimensions.cell.centerLongitude }, 0)];
    cache.set(base, { raw, providers: ['geoapify'], partial: false, coverageComplete: true }, Date.now() - 10);
    const service = createNearbyService(env, { cache, providers: [{ name: 'geoapify', configured: true, searchNearby: async () => { throw Object.assign(new Error(), { code: 'PROVIDER_UNAVAILABLE' }); } }] });
    const result = await service.searchNearby(base);
    assert.equal(result.cached, true); assert.equal(result.stale, true); assert.equal(result.partial, true); assert.equal(result.coverageStatus, 'stale');
  });
  await test('cache is process-memory only and dimensions retain no identity fields', () => {
    const dimensions = cacheDimensions({ ...base, userId: 'private', deviceId: 'private', sessionId: 'private' });
    assert.deepEqual(Object.keys(dimensions).sort(), ['category', 'cell', 'countryCode', 'language', 'radiusBucket', 'schemaVersion', 'sourcePolicyVersion'].sort());
    assert.ok(!JSON.stringify(dimensions).includes('private'));
  });
  console.log(`Smart geographic cache tests: ${passed}/${passed} passed`);
})().catch(() => { process.exitCode = 1; });
