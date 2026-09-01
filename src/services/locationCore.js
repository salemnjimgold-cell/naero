const LOCATION_STATE_VERSION = 2;
const LOCATION_AUTHORITY_VERSION = 3;
const SIGNIFICANT_DISTANCE_METERS = 500;
const SIGNIFICANT_ACCURACY_IMPROVEMENT_METERS = 100;
const SIGNIFICANT_AGE_MS = 15 * 60 * 1000;

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function readOwn(object, key) {
  if (!object || (typeof object !== 'object' && typeof object !== 'function')) return undefined;
  try {
    if (!Object.prototype.hasOwnProperty.call(object, key)) return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return undefined;
    return descriptor.value;
  } catch {
    return undefined;
  }
}

function isValidCoordinates(latitude, longitude) {
  return isFiniteNumber(latitude)
    && isFiniteNumber(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

function normalizeText(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeCountryCode(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toUpperCase() : null;
}

function normalizeAddress(address = {}) {
  return {
    country: normalizeText(readOwn(address, 'country')),
    countryCode: normalizeCountryCode(readOwn(address, 'isoCountryCode') || readOwn(address, 'countryCode')),
    city: normalizeText(readOwn(address, 'city') || readOwn(address, 'town') || readOwn(address, 'village')),
    district: normalizeText(readOwn(address, 'district') || readOwn(address, 'cityDistrict')),
    region: normalizeText(readOwn(address, 'region') || readOwn(address, 'subregion')),
    postalCode: normalizeText(readOwn(address, 'postalCode') || readOwn(address, 'postcode')),
  };
}

function createDeviceSnapshot(position, address, capturedAt = Date.now()) {
  const latitude = position?.coords?.latitude ?? position?.latitude;
  const longitude = position?.coords?.longitude ?? position?.longitude;
  if (!isValidCoordinates(latitude, longitude)) return null;

  const accuracyValue = position?.coords?.accuracy ?? position?.accuracy;
  const timestampValue = position?.timestamp ?? capturedAt;
  const accuracy = isFiniteNumber(accuracyValue) && accuracyValue >= 0 ? accuracyValue : null;
  const timestamp = isFiniteNumber(timestampValue) ? timestampValue : capturedAt;

  return {
    version: LOCATION_STATE_VERSION,
    mode: 'device',
    latitude,
    longitude,
    accuracy,
    timestamp,
    address: normalizeAddress(address),
  };
}

function createManualSnapshot(city, details = {}, capturedAt = Date.now()) {
  const normalizedCity = normalizeText(city);
  if (!normalizedCity) return null;

  const latitude = readOwn(details, 'latitude');
  const longitude = readOwn(details, 'longitude');
  if (!isValidCoordinates(latitude, longitude)) return null;

  return {
    version: LOCATION_STATE_VERSION,
    mode: 'manual',
    latitude,
    longitude,
    accuracy: null,
    timestamp: capturedAt,
    address: {
      ...normalizeAddress(details),
      city: normalizedCity,
    },
  };
}

function normalizeStoredSnapshot(snapshot) {
  const mode = readOwn(snapshot, 'mode');
  const latitude = readOwn(snapshot, 'latitude');
  const longitude = readOwn(snapshot, 'longitude');
  const address = readOwn(snapshot, 'address');
  if (mode === 'manual') {
    const city = normalizeAddress(address).city;
    return createManualSnapshot(city, { ...normalizeAddress(address), latitude, longitude }, readOwn(snapshot, 'timestamp'));
  }
  if (mode === 'device') {
    return createDeviceSnapshot({ latitude, longitude, accuracy: readOwn(snapshot, 'accuracy'), timestamp: readOwn(snapshot, 'timestamp') }, address);
  }
  return null;
}

function normalizeLocationAuthority(authority) {
  if (readOwn(authority, 'version') !== LOCATION_AUTHORITY_VERSION) return null;
  const preference = readOwn(authority, 'preference');
  if (!['auto', 'manual', 'off'].includes(preference)) return null;
  const rawSnapshot = readOwn(authority, 'snapshot');
  if (rawSnapshot !== null && !isFiniteNumber(readOwn(rawSnapshot, 'timestamp'))) return null;
  const snapshot = rawSnapshot === null ? null : normalizeStoredSnapshot(rawSnapshot);
  if (rawSnapshot !== null && !snapshot) return null;
  if (preference === 'manual' && snapshot?.mode !== 'manual') return null;
  if (preference === 'auto' && snapshot && snapshot.mode !== 'device') return null;
  return {
    version: LOCATION_AUTHORITY_VERSION,
    preference,
    snapshot,
  };
}

function createLocationAuthority(preference, snapshot = null) {
  return normalizeLocationAuthority({
    version: LOCATION_AUTHORITY_VERSION,
    preference,
    snapshot,
  });
}

function migrateV2LocationAuthority(input = {}) {
  const preferencePresent = readOwn(input, 'preferencePresent') === true;
  const preference = readOwn(input, 'preference');
  const snapshotPresent = readOwn(input, 'snapshotPresent') === true;
  const snapshot = readOwn(input, 'snapshot');
  const validPreference = ['auto', 'manual', 'off'].includes(preference) ? preference : null;
  const normalizedSnapshot = snapshotPresent ? normalizeStoredSnapshot(snapshot) : null;
  if (validPreference === 'manual' && normalizedSnapshot?.mode === 'manual') {
    return createLocationAuthority('manual', normalizedSnapshot);
  }
  if (validPreference === 'auto' && (!snapshotPresent || normalizedSnapshot?.mode === 'device')) {
    return createLocationAuthority('auto', normalizedSnapshot);
  }
  if (validPreference === 'off') {
    return createLocationAuthority('off', normalizedSnapshot);
  }
  if (!preferencePresent && !snapshotPresent) return createLocationAuthority('auto', null);
  return createLocationAuthority('off', normalizedSnapshot);
}

function distanceMeters(first, second) {
  if (!first || !second) return Infinity;
  if (!isValidCoordinates(first.latitude, first.longitude)
    || !isValidCoordinates(second.latitude, second.longitude)) {
    return Infinity;
  }
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const earthRadiusMeters = 6371000;
  const deltaLatitude = toRadians(second.latitude - first.latitude);
  const deltaLongitude = toRadians(second.longitude - first.longitude);
  const latitude1 = toRadians(first.latitude);
  const latitude2 = toRadians(second.latitude);
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function isSignificantLocationChange(previous, next, now = Date.now()) {
  if (!previous || previous.mode !== 'device') return true;
  if (!next || next.mode !== 'device') return false;

  if (distanceMeters(previous, next) >= SIGNIFICANT_DISTANCE_METERS) return true;

  const previousAccuracy = isFiniteNumber(previous.accuracy) ? previous.accuracy : Infinity;
  const nextAccuracy = isFiniteNumber(next.accuracy) ? next.accuracy : Infinity;
  if (previousAccuracy - nextAccuracy >= SIGNIFICANT_ACCURACY_IMPROVEMENT_METERS) return true;

  return now - previous.timestamp >= SIGNIFICANT_AGE_MS;
}

function getDisplayCity(snapshot) {
  return normalizeText(snapshot?.address?.city);
}

module.exports = {
  LOCATION_STATE_VERSION,
  LOCATION_AUTHORITY_VERSION,
  SIGNIFICANT_DISTANCE_METERS,
  SIGNIFICANT_AGE_MS,
  isValidCoordinates,
  readOwn,
  normalizeAddress,
  createDeviceSnapshot,
  createManualSnapshot,
  normalizeStoredSnapshot,
  normalizeLocationAuthority,
  createLocationAuthority,
  migrateV2LocationAuthority,
  distanceMeters,
  isSignificantLocationChange,
  getDisplayCity,
};
