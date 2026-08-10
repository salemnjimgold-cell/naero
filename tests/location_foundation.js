const assert = require('node:assert/strict');
const {
  LOCATION_STATE_VERSION,
  SIGNIFICANT_DISTANCE_METERS,
  createDeviceSnapshot,
  createManualSnapshot,
  distanceMeters,
  getDisplayCity,
  isSignificantLocationChange,
  isValidCoordinates,
  normalizeAddress,
} = require('../src/services/locationCore');

const cases = [];

function test(name, fn) {
  cases.push({ name, fn });
}

test('validates global coordinate boundaries', () => {
  assert.equal(isValidCoordinates(90, 180), true);
  assert.equal(isValidCoordinates(-90, -180), true);
  assert.equal(isValidCoordinates(90.0001, 0), false);
  assert.equal(isValidCoordinates(0, -180.0001), false);
  assert.equal(isValidCoordinates('47.5', 19), false);
  assert.equal(isValidCoordinates(Number.NaN, 19), false);
});

test('normalizes all required reverse-geocode fields without inventing values', () => {
  assert.deepEqual(normalizeAddress({
    country: ' Hungary ',
    isoCountryCode: 'hu',
    city: ' Győr ',
    district: ' Nádorváros ',
    region: ' Győr-Moson-Sopron ',
    postalCode: ' 9024 ',
  }), {
    country: 'Hungary',
    countryCode: 'HU',
    city: 'Győr',
    district: 'Nádorváros',
    region: 'Győr-Moson-Sopron',
    postalCode: '9024',
  });

  assert.deepEqual(normalizeAddress({}), {
    country: null,
    countryCode: null,
    city: null,
    district: null,
    region: null,
    postalCode: null,
  });
});

test('creates a device snapshot with accuracy and provider timestamp', () => {
  const snapshot = createDeviceSnapshot({
    coords: { latitude: 47.4979, longitude: 19.0402, accuracy: 18.5 },
    timestamp: 123456,
  }, { city: 'Budapest', isoCountryCode: 'HU' });

  assert.equal(snapshot.version, LOCATION_STATE_VERSION);
  assert.equal(snapshot.mode, 'device');
  assert.equal(snapshot.accuracy, 18.5);
  assert.equal(snapshot.timestamp, 123456);
  assert.equal(snapshot.address.city, 'Budapest');
  assert.equal(snapshot.address.countryCode, 'HU');
});

test('manual mode remains usable without coordinates or country assumptions', () => {
  const snapshot = createManualSnapshot('  Tunis  ');
  assert.equal(snapshot.mode, 'manual');
  assert.equal(snapshot.latitude, null);
  assert.equal(snapshot.longitude, null);
  assert.equal(snapshot.address.city, 'Tunis');
  assert.equal(snapshot.address.country, null);
  assert.equal(getDisplayCity(snapshot), 'Tunis');
  assert.equal(createManualSnapshot('   '), null);
});

test('calculates realistic great-circle distances', () => {
  const distance = distanceMeters(
    { latitude: 47.4979, longitude: 19.0402 },
    { latitude: 48.2082, longitude: 16.3738 }
  );
  assert.ok(distance > 210000 && distance < 230000, `distance was ${distance}`);
});

test('detects movement at the significant-distance threshold', () => {
  const previous = createDeviceSnapshot({
    latitude: 47.4979,
    longitude: 19.0402,
    accuracy: 20,
    timestamp: 1000,
  });
  const unchanged = createDeviceSnapshot({
    latitude: 47.4980,
    longitude: 19.0403,
    accuracy: 20,
    timestamp: 2000,
  });
  const moved = createDeviceSnapshot({
    latitude: 47.5040,
    longitude: 19.0402,
    accuracy: 20,
    timestamp: 2000,
  });

  assert.equal(isSignificantLocationChange(previous, unchanged, 2000), false);
  assert.ok(distanceMeters(previous, moved) >= SIGNIFICANT_DISTANCE_METERS);
  assert.equal(isSignificantLocationChange(previous, moved, 2000), true);
});

test('detects meaningful accuracy improvement and stale snapshots', () => {
  const previous = createDeviceSnapshot({
    latitude: 48.8566,
    longitude: 2.3522,
    accuracy: 180,
    timestamp: 1000,
  });
  const accurate = createDeviceSnapshot({
    latitude: 48.8566,
    longitude: 2.3522,
    accuracy: 20,
    timestamp: 2000,
  });
  const same = createDeviceSnapshot({
    latitude: 48.8566,
    longitude: 2.3522,
    accuracy: 180,
    timestamp: 2000,
  });

  assert.equal(isSignificantLocationChange(previous, accurate, 2000), true);
  assert.equal(isSignificantLocationChange(previous, same, 16 * 60 * 1000), true);
});

let failures = 0;
for (const { name, fn } of cases) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
  }
}

console.log(`\nLocation foundation: ${cases.length - failures}/${cases.length} passed`);
if (failures > 0) process.exit(1);
