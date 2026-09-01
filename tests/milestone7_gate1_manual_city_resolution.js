const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');
const core = require('../src/services/locationCore');
let passed = 0;

async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

function loadLocationService({ geocode, reverse, stored = {} } = {}) {
  const values = new Map(Object.entries(stored));
  const writes = [];
  const storage = {
    async getItem(key) { return values.has(key) ? values.get(key) : null; },
    async setItem(key, value) { values.set(key, value); writes.push({ type: 'set', key, value }); },
    async removeItem(key) { values.delete(key); writes.push({ type: 'remove', key }); },
    async multiRemove(keys) { keys.forEach((key) => values.delete(key)); writes.push({ type: 'multiRemove', keys: [...keys] }); },
  };
  const location = {
    Accuracy: { Balanced: 1 },
    geocodeAsync: geocode || (async () => []),
    reverseGeocodeAsync: reverse || (async () => []),
    getForegroundPermissionsAsync: async () => ({ status: 'denied' }),
    hasServicesEnabledAsync: async () => true,
  };
  const filename = path.join(root, 'src/services/locationService.js');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalLoad = Module._load;
  Module._load = function mockedLoad(request, parent, isMain) {
    if (parent === instance && request === 'expo-location') return location;
    if (parent === instance && request === '@react-native-async-storage/async-storage') return storage;
    if (parent === instance && request === './apiClient') {
      return { apiClient: { get: async () => ({ error: { code: 'OFFLINE' }, data: null }) } };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    instance._compile(compiled, filename);
  } finally {
    Module._load = originalLoad;
  }
  return { service: instance.exports, values, writes };
}

function successfulGeocode(latitude = 48.2, longitude = 16.37) {
  return async () => [{ latitude, longitude }];
}

async function main() {
  await test('valid city resolves to finite coordinates and canonical city', async () => {
    const { service } = loadLocationService({ geocode: successfulGeocode(), reverse: async () => [{ city: 'Wien', country: 'Austria' }] });
    const result = await service.setManualLocation(' Vienna ');
    assert.equal(result.error, null);
    assert.equal(result.snapshot.address.city, 'Wien');
    assert.equal(result.snapshot.latitude, 48.2);
    assert.equal(result.snapshot.longitude, 16.37);
  });
  await test('valid city is persisted only after resolution', async () => {
    let release;
    const { service, writes } = loadLocationService({ geocode: () => new Promise((resolve) => { release = resolve; }) });
    const pending = service.setManualLocation('Vienna');
    await Promise.resolve();
    assert.equal(writes.length, 0);
    release([{ latitude: 48.2, longitude: 16.37 }]);
    await pending;
    assert(writes.some((entry) => entry.key === service.LOCATION_STORAGE_KEYS.state));
  });
  await test('empty resolver result fails closed', async () => {
    const { service, writes } = loadLocationService();
    const result = await service.setManualLocation('NaeroInvalidCityZZQX987');
    assert.equal(result.error.code, 'CITY_NOT_FOUND');
    assert.equal(writes.length, 0);
  });
  await test('empty query fails without persistence', async () => {
    const { service, writes } = loadLocationService();
    assert.equal((await service.setManualLocation('   ')).error.code, 'INVALID_CITY');
    assert.equal(writes.length, 0);
  });

  const malformed = [
    ['missing latitude', { longitude: 1 }], ['missing longitude', { latitude: 1 }],
    ['NaN latitude', { latitude: NaN, longitude: 1 }], ['Infinity longitude', { latitude: 1, longitude: Infinity }],
    ['latitude above bound', { latitude: 91, longitude: 1 }], ['latitude below bound', { latitude: -91, longitude: 1 }],
    ['longitude above bound', { latitude: 1, longitude: 181 }], ['longitude below bound', { latitude: 1, longitude: -181 }],
    ['coordinate strings', { latitude: '48.2', longitude: '16.37' }], ['malformed primitive', 'bad'],
  ];
  for (const [name, value] of malformed) {
    await test(`${name} is rejected without persistence`, async () => {
      const { service, writes } = loadLocationService({ geocode: async () => [value] });
      assert.equal((await service.setManualLocation('Vienna')).error.code, 'CITY_NOT_FOUND');
      assert.equal(writes.length, 0);
    });
  }
  await test('inherited coordinates are rejected', async () => {
    const inherited = Object.create({ latitude: 48.2, longitude: 16.37 });
    const { service, writes } = loadLocationService({ geocode: async () => [inherited] });
    assert.equal((await service.setManualLocation('Vienna')).error.code, 'CITY_NOT_FOUND');
    assert.equal(writes.length, 0);
  });
  await test('throwing coordinate getter is rejected', async () => {
    const hostile = {};
    Object.defineProperty(hostile, 'latitude', { enumerable: true, get() { throw new Error('hostile'); } });
    Object.defineProperty(hostile, 'longitude', { value: 1 });
    const { service } = loadLocationService({ geocode: async () => [hostile] });
    assert.equal((await service.setManualLocation('Vienna')).error.code, 'CITY_NOT_FOUND');
  });
  await test('revoked coordinate proxy is rejected', async () => {
    const pair = Proxy.revocable({ latitude: 48.2, longitude: 16.37 }, {});
    pair.revoke();
    const { service } = loadLocationService({ geocode: async () => [pair.proxy] });
    assert.equal((await service.setManualLocation('Vienna')).error.code, 'CITY_NOT_FOUND');
  });
  await test('resolver throw returns bounded error', async () => {
    const { service, writes } = loadLocationService({ geocode: async () => { throw new Error('secret provider detail'); } });
    const result = await service.setManualLocation('Vienna');
    assert.equal(result.error.code, 'CITY_RESOLUTION_FAILED');
    assert(!result.error.message.includes('secret'));
    assert.equal(writes.length, 0);
  });
  await test('network failure equivalent returns bounded error', async () => {
    const { service } = loadLocationService({ geocode: async () => { throw new TypeError('Network request failed'); } });
    assert.equal((await service.setManualLocation('Vienna')).error.code, 'CITY_RESOLUTION_FAILED');
  });
  await test('null resolver envelope fails closed', async () => {
    const { service } = loadLocationService({ geocode: async () => null });
    assert.equal((await service.setManualLocation('Vienna')).error.code, 'CITY_NOT_FOUND');
  });
  await test('throwing result collection access fails closed', async () => {
    const hostile = new Proxy([], { get(target, key, receiver) { if (key === '0') throw new Error('hostile'); return Reflect.get(target, key, receiver); } });
    const { service } = loadLocationService({ geocode: async () => hostile });
    assert.equal((await service.setManualLocation('Vienna')).error.code, 'CITY_RESOLUTION_FAILED');
  });
  await test('hostile reverse-geocode address cannot invalidate resolved coordinates', async () => {
    const address = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error('hostile'); } });
    const { service } = loadLocationService({ geocode: successfulGeocode(), reverse: async () => [address] });
    const result = await service.setManualLocation('Vienna');
    assert.equal(result.error, null);
    assert.equal(result.snapshot.address.city, 'Vienna');
  });

  await test('previous valid state survives unresolved query', async () => {
    let valid = true;
    const { service, values } = loadLocationService({ geocode: async () => valid ? [{ latitude: 48.2, longitude: 16.37 }] : [] });
    const first = await service.setManualLocation('Vienna');
    const stored = values.get(service.LOCATION_STORAGE_KEYS.state);
    valid = false;
    const failed = await service.setManualLocation('Invalid');
    assert.equal(failed.snapshot.address.city, first.snapshot.address.city);
    assert.equal(values.get(service.LOCATION_STORAGE_KEYS.state), stored);
  });
  await test('previous valid state survives thrown resolver', async () => {
    let fail = false;
    const { service, values } = loadLocationService({ geocode: async () => { if (fail) throw new Error('offline'); return [{ latitude: 48.2, longitude: 16.37 }]; } });
    await service.setManualLocation('Vienna');
    const stored = values.get(service.LOCATION_STORAGE_KEYS.state);
    fail = true;
    await service.setManualLocation('Budapest');
    assert.equal(values.get(service.LOCATION_STORAGE_KEYS.state), stored);
  });
  await test('first-time failure remains unresolved', async () => {
    const { service } = loadLocationService();
    const result = await service.setManualLocation('Invalid');
    assert.equal(result.snapshot, null);
    assert.equal(result.preference, 'auto');
  });
  await test('legacy city-only storage is rejected without destructive clearing', async () => {
    const legacy = '@naero_manual_city';
    const { service, values, writes } = loadLocationService({ stored: { [legacy]: 'NaeroInvalidCityZZQX987' } });
    const result = await service.initializeLocation();
    assert.equal(result.snapshot, null);
    assert.equal(values.get(legacy), 'NaeroInvalidCityZZQX987');
    assert.equal(writes.length, 0);
  });
  await test('legacy unresolved v2 manual snapshot is rejected', async () => {
    const stateKey = '@naero_location_state_v2';
    const { service } = loadLocationService({ stored: { [stateKey]: JSON.stringify({ version: 2, mode: 'manual', latitude: null, longitude: null, address: { city: 'Invalid' } }) } });
    assert.equal((await service.initializeLocation()).snapshot, null);
  });
  await test('valid persisted manual snapshot is restored', async () => {
    const stateKey = '@naero_location_state_v2';
    const stored = JSON.stringify({ version: 2, mode: 'manual', latitude: 48.2, longitude: 16.37, timestamp: 1, address: { city: 'Vienna', country: 'Austria' } });
    const { service } = loadLocationService({ stored: { [stateKey]: stored, '@naero_location_preference_v2': 'manual' } });
    const result = await service.initializeLocation();
    assert.equal(result.snapshot.address.city, 'Vienna');
    assert.equal(result.snapshot.latitude, 48.2);
  });
  await test('malformed persisted JSON is rejected without throwing', async () => {
    const { service } = loadLocationService({ stored: { '@naero_location_state_v2': '{broken' } });
    assert.equal((await service.initializeLocation()).snapshot, null);
  });
  await test('older completion cannot overwrite newer successful selection', async () => {
    const pending = new Map();
    const { service, values } = loadLocationService({ geocode: (city) => new Promise((resolve) => pending.set(city, resolve)) });
    const older = service.setManualLocation('Vienna');
    const newer = service.setManualLocation('Budapest');
    pending.get('Budapest')([{ latitude: 47.5, longitude: 19.04 }]);
    const newerResult = await newer;
    pending.get('Vienna')([{ latitude: 48.2, longitude: 16.37 }]);
    const olderResult = await older;
    assert.equal(newerResult.error, null);
    assert.equal(olderResult.error.code, 'STALE_CITY_SELECTION');
    assert.equal(JSON.parse(values.get(service.LOCATION_STORAGE_KEYS.state)).address.city, 'Budapest');
  });
  await test('duplicate pending submissions commit only the latest result', async () => {
    const releases = [];
    const { service, writes } = loadLocationService({ geocode: () => new Promise((resolve) => releases.push(resolve)) });
    const first = service.setManualLocation('Vienna');
    const second = service.setManualLocation('Vienna');
    releases[1]([{ latitude: 48.2, longitude: 16.37 }]);
    await second;
    releases[0]([{ latitude: 48.2, longitude: 16.37 }]);
    assert.equal((await first).error.code, 'STALE_CITY_SELECTION');
    assert.equal(writes.filter((entry) => entry.key === service.LOCATION_STORAGE_KEYS.state).length, 1);
  });

  await test('manual snapshot requires own finite bounded coordinates', async () => {
    assert.equal(core.createManualSnapshot('Vienna'), null);
    assert.equal(core.createManualSnapshot('Vienna', { latitude: 48.2, longitude: 16.37 }).mode, 'manual');
  });
  await test('Home consumes resolved manual coordinates truthfully', async () => {
    const { getHomeState } = require('../src/domain/coreShell');
    const snapshot = core.createManualSnapshot('Vienna', { latitude: 48.2, longitude: 16.37 });
    const view = getHomeState({ userCity: snapshot.address.city, userLocation: snapshot, nearbyPlaces: [] });
    assert.equal(view.hasResolvedLocation, true);
    assert.equal(view.locationLabel, 'Vienna');
  });
  await test('Discover consumes resolved manual coordinates truthfully', async () => {
    const { resolveDiscoverContext } = require('../src/domain/discoverCore');
    const snapshot = core.createManualSnapshot('Vienna', { latitude: 48.2, longitude: 16.37 });
    const context = resolveDiscoverContext({ locationState: snapshot, userLocation: snapshot });
    assert.deepStrictEqual({ ...context.coordinates }, { latitude: 48.2, longitude: 16.37 });
  });
  await test('invalid city cannot fabricate Home or Discover location', async () => {
    const { getHomeState } = require('../src/domain/coreShell');
    const { resolveDiscoverContext } = require('../src/domain/discoverCore');
    assert.equal(getHomeState({ userCity: 'Invalid', userLocation: null, nearbyPlaces: [{ id: 'fake' }] }).places.length, 0);
    assert.equal(resolveDiscoverContext({ locationState: null, userLocation: null }).coordinates, null);
  });
  await test('localized error contract exists in EN AR FR HU without raw keys', async () => {
    for (const locale of ['en', 'ar', 'fr', 'hu']) {
      const value = require(`../src/i18n/${locale}.json`).gate1.manualCity.notFound;
      assert.equal(typeof value, 'string');
      assert(value.length > 10);
      assert(!value.includes('gate1.manualCity'));
    }
  });
  await test('retry after failure can commit a later valid resolution', async () => {
    let valid = false;
    const { service } = loadLocationService({ geocode: async () => valid ? [{ latitude: 48.2, longitude: 16.37 }] : [] });
    assert((await service.setManualLocation('Invalid')).error);
    valid = true;
    assert.equal((await service.setManualLocation('Vienna')).error, null);
  });
  await test('UI never renders raw service error details', async () => {
    const source = fs.readFileSync(path.join(root, 'src/components/ManualCityModal.js'), 'utf8');
    assert(!source.includes('result.error.message'));
    assert(source.includes("t('gate1.manualCity.notFound')"));
  });
  await test('modal exposes loading, input, action and error accessibility', async () => {
    const source = fs.readFileSync(path.join(root, 'src/components/ManualCityModal.js'), 'utf8');
    assert(source.includes('accessibilityLiveRegion="polite"'));
    assert(source.includes('accessibilityRole="alert"'));
    assert(source.includes('accessibilityState={{ disabled: loading, busy: loading }}'));
    assert(source.includes("t('gate1.manualCity.inputLabel')"));
  });

  console.log(`Milestone 7 Gate 1 manual-city resolution: ${passed} tests passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
