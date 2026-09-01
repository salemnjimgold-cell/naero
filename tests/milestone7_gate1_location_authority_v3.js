const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');
const core = require('../src/services/locationCore');

const root = path.resolve(__dirname, '..');
const AUTHORITY_KEY = '@naero_location_authority_v3';
const V2_STATE = '@naero_location_state_v2';
const V2_PREFERENCE = '@naero_location_preference_v2';
let passed = 0;

async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

const manual = (city = 'Budapest', latitude = 47.5, longitude = 19.04) =>
  core.createManualSnapshot(city, { latitude, longitude }, 1000);
const device = (latitude = 47.5, longitude = 19.04) =>
  core.createDeviceSnapshot({ latitude, longitude, accuracy: 10, timestamp: 1000 }, { city: 'Budapest' });
const authority = (preference, snapshot) => core.createLocationAuthority(preference, snapshot);

function loadService({ stored = {}, geocode, currentPosition, writeHook, watchHook } = {}) {
  const values = new Map(Object.entries(stored));
  const writes = [];
  const storage = {
    async getItem(key) { return values.has(key) ? values.get(key) : null; },
    async setItem(key, value) {
      if (writeHook) await writeHook(key, value);
      values.set(key, value);
      writes.push({ key, value });
    },
    async removeItem(key) { values.delete(key); },
    async multiRemove(keys) { keys.forEach((key) => values.delete(key)); },
  };
  const location = {
    Accuracy: { Balanced: 1 },
    geocodeAsync: geocode || (async () => []),
    reverseGeocodeAsync: async () => [],
    getForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    hasServicesEnabledAsync: async () => true,
    getCurrentPositionAsync: currentPosition || (async () => ({ coords: { latitude: 47.5, longitude: 19.04, accuracy: 10 }, timestamp: 1000 })),
    watchPositionAsync: watchHook || (async () => ({ remove() {} })),
  };
  const filename = path.join(root, 'src/services/locationService.js');
  const compiled = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (parent === instance && request === 'expo-location') return location;
    if (parent === instance && request === '@react-native-async-storage/async-storage') return storage;
    if (parent === instance && request === './apiClient') return { apiClient: { get: async () => ({ error: true }) } };
    return originalLoad.call(this, request, parent, isMain);
  };
  try { instance._compile(compiled, filename); } finally { Module._load = originalLoad; }
  return { service: instance.exports, values, writes };
}

const serialized = (value) => JSON.stringify(value);
const storedAuthority = (value) => ({ [AUTHORITY_KEY]: serialized(value) });

async function main() {
  await test('valid manual V3', () => assert.equal(core.normalizeLocationAuthority(authority('manual', manual())).preference, 'manual'));
  await test('valid auto null V3', () => assert.deepEqual(core.normalizeLocationAuthority(authority('auto', null)), authority('auto', null)));
  await test('valid auto device V3', () => assert.equal(core.normalizeLocationAuthority(authority('auto', device())).snapshot.mode, 'device'));
  await test('valid off null V3', () => assert.equal(core.normalizeLocationAuthority(authority('off', null)).snapshot, null));
  await test('valid off retained device V3', () => assert.equal(core.normalizeLocationAuthority(authority('off', device())).snapshot.mode, 'device'));
  await test('valid off retained manual V3', () => assert.equal(core.normalizeLocationAuthority(authority('off', manual())).snapshot.mode, 'manual'));
  for (const [name, value] of [
    ['unknown version', { version: 4, preference: 'off', snapshot: null }],
    ['wrong preference', { version: 3, preference: 'gps', snapshot: null }],
    ['manual null', { version: 3, preference: 'manual', snapshot: null }],
    ['manual device', { version: 3, preference: 'manual', snapshot: device() }],
    ['auto manual', { version: 3, preference: 'auto', snapshot: manual() }],
    ['missing timestamp', { version: 3, preference: 'manual', snapshot: { ...manual(), timestamp: undefined } }],
    ['numeric strings', { version: 3, preference: 'manual', snapshot: { ...manual(), latitude: '47.5' } }],
    ['NaN', { version: 3, preference: 'manual', snapshot: { ...manual(), latitude: NaN } }],
    ['Infinity', { version: 3, preference: 'manual', snapshot: { ...manual(), longitude: Infinity } }],
    ['latitude bound', { version: 3, preference: 'manual', snapshot: { ...manual(), latitude: 91 } }],
    ['longitude bound', { version: 3, preference: 'manual', snapshot: { ...manual(), longitude: -181 } }],
  ]) await test(`rejects ${name}`, () => assert.equal(core.normalizeLocationAuthority(value), null));
  await test('rejects inherited V3 authority fields', () => {
    const inherited = Object.create({ version: 3, preference: 'manual', snapshot: manual() });
    assert.equal(core.normalizeLocationAuthority(inherited), null);
  });
  await test('rejects throwing V3 ownership traps', () => {
    const hostile = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error('trap'); } });
    assert.equal(core.normalizeLocationAuthority(hostile), null);
  });

  const migrationCases = [
    ['1 no keys', {}, 'auto', null],
    ['2 auto device', { preferencePresent: true, preference: 'auto', snapshotPresent: true, snapshot: device() }, 'auto', 'device'],
    ['3 manual valid', { preferencePresent: true, preference: 'manual', snapshotPresent: true, snapshot: manual() }, 'manual', 'manual'],
    ['4 off device', { preferencePresent: true, preference: 'off', snapshotPresent: true, snapshot: device() }, 'off', 'device'],
    ['5 off manual', { preferencePresent: true, preference: 'off', snapshotPresent: true, snapshot: manual() }, 'off', 'manual'],
    ['6 manual null latitude', { preferencePresent: true, preference: 'manual', snapshotPresent: true, snapshot: { ...manual(), latitude: null } }, 'off', null],
    ['7 manual missing longitude', { preferencePresent: true, preference: 'manual', snapshotPresent: true, snapshot: { ...manual(), longitude: undefined } }, 'off', null],
    ['8 manual out of range', { preferencePresent: true, preference: 'manual', snapshotPresent: true, snapshot: { ...manual(), latitude: 100 } }, 'off', null],
    ['9 raw city only', { preferencePresent: true, preference: 'manual', snapshotPresent: true, snapshot: { mode: 'manual', address: { city: 'Invalid' } } }, 'off', null],
    ['10 auto no snapshot', { preferencePresent: true, preference: 'auto' }, 'auto', null],
    ['11 preference only manual', { preferencePresent: true, preference: 'manual' }, 'off', null],
    ['12 snapshot only', { snapshotPresent: true, snapshot: device() }, 'off', 'device'],
    ['13 corrupt preference', { preferencePresent: true, preference: 'broken', snapshotPresent: true, snapshot: device() }, 'off', 'device'],
    ['14 corrupt snapshot', { preferencePresent: true, preference: 'manual', snapshotPresent: true, snapshot: 'broken' }, 'off', null],
    ['15 contradictory', { preferencePresent: true, preference: 'manual', snapshotPresent: true, snapshot: device() }, 'off', 'device'],
    ['16 partial-looking', { preferencePresent: true, preference: 'auto', snapshotPresent: true, snapshot: manual() }, 'off', 'manual'],
    ['17 unknown fields', { preferencePresent: true, preference: 'auto', snapshotPresent: true, snapshot: { ...device(), unknown: 'ignored' } }, 'auto', 'device'],
  ];
  for (const [name, input, pref, mode] of migrationCases) await test(`migration ${name}`, () => {
    const result = core.migrateV2LocationAuthority(input);
    assert.equal(result.preference, pref);
    assert.equal(result.snapshot?.mode || null, mode);
  });
  await test('18 valid V3 wins over V2', async () => {
    const v3 = authority('manual', manual('Vienna', 48.2, 16.37));
    const { service } = loadService({ stored: { ...storedAuthority(v3), [V2_PREFERENCE]: 'off' } });
    assert.equal((await service.initializeLocation()).snapshot.address.city, 'Vienna');
  });
  await test('19 malformed V3 falls back conservatively to V2', async () => {
    const { service } = loadService({ stored: { [AUTHORITY_KEY]: '{bad', [V2_PREFERENCE]: 'manual', [V2_STATE]: serialized(manual()) } });
    assert.equal((await service.initializeLocation()).preference, 'manual');
  });
  await test('20 unknown V3 falls back conservatively to V2', async () => {
    const { service } = loadService({ stored: { [AUTHORITY_KEY]: serialized({ version: 99 }), [V2_PREFERENCE]: 'off', [V2_STATE]: serialized(device()) } });
    assert.equal((await service.initializeLocation()).preference, 'off');
  });
  await test('concurrent cold-start callers share one migration write', async () => {
    let active = 0; let maximum = 0; let migrationWrites = 0;
    const { service } = loadService({
      stored: { [V2_PREFERENCE]: 'manual', [V2_STATE]: serialized(manual()) },
      writeHook: async (key) => {
        if (key !== AUTHORITY_KEY) return;
        migrationWrites += 1; active += 1; maximum = Math.max(maximum, active);
        await new Promise((resolve) => setImmediate(resolve)); active -= 1;
      },
    });
    const [first, second] = await Promise.all([service.initializeLocation(), service.initializeLocation()]);
    assert.equal(first.preference, 'manual'); assert.equal(second.preference, 'manual');
    assert.equal(migrationWrites, 1); assert.equal(maximum, 1);
  });

  await test('V3 rejection preserves prior Budapest cache and durable authority', async () => {
    const prior = authority('manual', manual());
    const { service, values } = loadService({ stored: storedAuthority(prior), geocode: async () => [{ latitude: 48.2, longitude: 16.37 }], writeHook: async (key) => { if (key === AUTHORITY_KEY) throw new Error('disk'); } });
    const result = await service.setManualLocation('Vienna');
    assert.equal(result.error.code, 'LOCATION_PERSISTENCE_FAILED');
    assert.equal(result.snapshot.address.city, 'Budapest');
    assert.deepEqual(JSON.parse(values.get(AUTHORITY_KEY)), prior);
    assert.equal((await service.initializeLocation()).snapshot.address.city, 'Budapest');
  });
  await test('first-time V3 rejection remains unresolved', async () => {
    let writes = 0;
    const { service } = loadService({ geocode: async () => [{ latitude: 48.2, longitude: 16.37 }], writeHook: async (key) => { if (key === AUTHORITY_KEY && ++writes > 1) throw new Error('disk'); } });
    const result = await service.setManualLocation('Vienna');
    assert.equal(result.snapshot, null);
    assert.equal(result.error.code, 'LOCATION_PERSISTENCE_FAILED');
  });
  await test('guard releases after rejected write and retry succeeds', async () => {
    let reject = true;
    const { service } = loadService({ stored: storedAuthority(authority('off', null)), geocode: async () => [{ latitude: 48.2, longitude: 16.37 }], writeHook: async (key) => { if (key === AUTHORITY_KEY && reject) throw new Error('disk'); } });
    assert((await service.setManualLocation('Vienna')).error);
    reject = false;
    assert.equal((await service.setManualLocation('Vienna')).error, null);
  });
  await test('slow older valid cannot overwrite fast newer valid', async () => {
    const pending = new Map();
    const { service, values } = loadService({ stored: storedAuthority(authority('off', null)), geocode: (city) => new Promise((resolve) => pending.set(city, resolve)) });
    const a = service.setManualLocation('Vienna');
    const b = service.setManualLocation('Budapest');
    pending.get('Budapest')([{ latitude: 47.5, longitude: 19.04 }]); await b;
    pending.get('Vienna')([{ latitude: 48.2, longitude: 16.37 }]); assert((await a).error);
    assert.equal(JSON.parse(values.get(AUTHORITY_KEY)).snapshot.address.city, 'Budapest');
  });
  await test('latest invalid supersedes older slow valid before commit', async () => {
    let release;
    const prior = authority('manual', manual('Prior'));
    const { service, values } = loadService({ stored: storedAuthority(prior), geocode: (city) => city === 'Vienna' ? new Promise((resolve) => { release = resolve; }) : Promise.resolve([]) });
    const a = service.setManualLocation('Vienna');
    assert((await service.setManualLocation('Invalid')).error);
    release([{ latitude: 48.2, longitude: 16.37 }]); assert((await a).error);
    assert.deepEqual(JSON.parse(values.get(AUTHORITY_KEY)), prior);
  });
  await test('older invalid cannot disturb newer valid authority', async () => {
    let release;
    const { service, values } = loadService({ stored: storedAuthority(authority('off', null)), geocode: (city) => city === 'Invalid' ? new Promise((resolve) => { release = resolve; }) : Promise.resolve([{ latitude: 47.5, longitude: 19.04 }]) });
    const a = service.setManualLocation('Invalid');
    assert.equal((await service.setManualLocation('Budapest')).error, null);
    release([]); assert((await a).error);
    assert.equal(JSON.parse(values.get(AUTHORITY_KEY)).snapshot.address.city, 'Budapest');
  });
  await test('older late throw cannot disturb newer valid authority', async () => {
    let reject;
    const { service, values } = loadService({ stored: storedAuthority(authority('off', null)), geocode: (city) => city === 'Vienna' ? new Promise((_resolve, fail) => { reject = fail; }) : Promise.resolve([{ latitude: 47.5, longitude: 19.04 }]) });
    const a = service.setManualLocation('Vienna');
    assert.equal((await service.setManualLocation('Budapest')).error, null);
    reject(new Error('late')); assert((await a).error);
    assert.equal(JSON.parse(values.get(AUTHORITY_KEY)).snapshot.address.city, 'Budapest');
  });
  await test('during-commit duplicate is rejected busy and writes never overlap', async () => {
    let release; let active = 0; let maximum = 0;
    const { service } = loadService({ stored: storedAuthority(authority('off', null)), geocode: async () => [{ latitude: 48.2, longitude: 16.37 }], writeHook: (key) => {
      if (key !== AUTHORITY_KEY) return undefined;
      active += 1; maximum = Math.max(maximum, active);
      if (active > 1) { active -= 1; return undefined; }
      return new Promise((resolve) => { release = () => { active -= 1; resolve(); }; });
    } });
    const a = service.setManualLocation('Vienna');
    await new Promise((resolve) => setImmediate(resolve));
    const b = await service.setManualLocation('Budapest');
    assert.equal(b.accepted, false); assert.equal(b.error.code, 'LOCATION_BUSY');
    release(); await a; assert.equal(maximum, 1);
  });
  await test('post-commit newer valid replaces completed authority', async () => {
    const coordinates = { Vienna: [48.2, 16.37], Budapest: [47.5, 19.04] };
    const { service, values } = loadService({ stored: storedAuthority(authority('off', null)), geocode: async (city) => [{ latitude: coordinates[city][0], longitude: coordinates[city][1] }] });
    assert.equal((await service.setManualLocation('Vienna')).error, null);
    assert.equal((await service.setManualLocation('Budapest')).error, null);
    assert.equal(JSON.parse(values.get(AUTHORITY_KEY)).snapshot.address.city, 'Budapest');
  });
  await test('post-commit newer failure preserves completed authority', async () => {
    const { service, values } = loadService({ stored: storedAuthority(authority('off', null)), geocode: async (city) => city === 'Vienna' ? [{ latitude: 48.2, longitude: 16.37 }] : [] });
    assert.equal((await service.setManualLocation('Vienna')).error, null);
    assert((await service.setManualLocation('Invalid')).error);
    assert.equal(JSON.parse(values.get(AUTHORITY_KEY)).snapshot.address.city, 'Vienna');
  });
  await test('off retains snapshot but consumers receive no active snapshot', async () => {
    const { service } = loadService({ stored: storedAuthority(authority('manual', manual())) });
    const result = await service.disableLocationUse();
    assert.equal(result.preference, 'off'); assert.equal(result.snapshot, null); assert.equal(result.authority.snapshot.address.city, 'Budapest');
  });
  await test('off supersedes a pre-commit manual resolution', async () => {
    let release;
    const { service } = loadService({ stored: storedAuthority(authority('auto', device())), geocode: () => new Promise((resolve) => { release = resolve; }) });
    const manualAttempt = service.setManualLocation('Vienna');
    assert.equal((await service.disableLocationUse()).preference, 'off');
    release([{ latitude: 48.2, longitude: 16.37 }]); assert((await manualAttempt).error);
  });
  await test('manual can be selected after a completed off commit', async () => {
    const { service } = loadService({ stored: storedAuthority(authority('auto', device())), geocode: async () => [{ latitude: 48.2, longitude: 16.37 }] });
    assert.equal((await service.disableLocationUse()).preference, 'off');
    const result = await service.setManualLocation('Vienna');
    assert.equal(result.preference, 'manual'); assert.equal(result.snapshot.address.city, 'Vienna');
  });
  await test('late significant GPS update cannot overwrite manual authority', async () => {
    let callback;
    const { service, values } = loadService({ stored: storedAuthority(authority('auto', device())), watchHook: async (_options, cb) => { callback = cb; return { remove() {} }; }, geocode: async () => [{ latitude: 48.2, longitude: 16.37 }] });
    await service.startSignificantLocationUpdates(() => {});
    await service.setManualLocation('Vienna');
    await callback({ coords: { latitude: 46, longitude: 15, accuracy: 10 }, timestamp: 2000 });
    assert.equal(JSON.parse(values.get(AUTHORITY_KEY)).preference, 'manual');
  });
  await test('concurrent significant GPS update cannot overwrite off authority', async () => {
    let callback;
    const { service, values } = loadService({ stored: storedAuthority(authority('auto', device())), watchHook: async (_options, cb) => { callback = cb; return { remove() {} }; } });
    await service.startSignificantLocationUpdates(() => {});
    const gps = callback({ coords: { latitude: 46, longitude: 15, accuracy: 10 }, timestamp: 2000 });
    const off = service.disableLocationUse();
    await Promise.all([gps, off]);
    assert.equal(JSON.parse(values.get(AUTHORITY_KEY)).preference, 'off');
  });
  await test('restart agrees after manual, auto, and off commits', async () => {
    for (const value of [authority('manual', manual()), authority('auto', device()), authority('off', manual())]) {
      const { service } = loadService({ stored: storedAuthority(value) });
      const result = await service.initializeLocation();
      assert.equal(result.preference, value.preference);
      assert.equal(Boolean(result.snapshot), value.preference !== 'off' && Boolean(value.snapshot));
    }
  });
  await test('AppContext contains accepted-result and latest-request guards', () => {
    const source = fs.readFileSync(path.join(root, 'src/context/AppContext.js'), 'utf8');
    assert(source.includes('result.accepted === false'));
    assert(source.includes('latestManualRequestRef.current !== requestId'));
  });

  console.log(`Milestone 7 Gate 1 location authority V3: ${passed} tests passed.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
