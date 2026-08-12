const LOCATION_STATE_VERSION = 2;
const SIGNIFICANT_DISTANCE_METERS = 500;
const SIGNIFICANT_ACCURACY_IMPROVEMENT_METERS = 100;
const SIGNIFICANT_AGE_MS = 15 * 60 * 1000;

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
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
    country: normalizeText(address.country),
    countryCode: normalizeCountryCode(address.isoCountryCode || address.countryCode),
    city: normalizeText(address.city || address.town || address.village),
    district: normalizeText(address.district || address.cityDistrict),
    region: normalizeText(address.region || address.subregion),
    postalCode: normalizeText(address.postalCode || address.postcode),
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

  const latitude = details.latitude;
  const longitude = details.longitude;
  const hasCoordinates = isValidCoordinates(latitude, longitude);

  return {
    version: LOCATION_STATE_VERSION,
    mode: 'manual',
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
    accuracy: null,
    timestamp: capturedAt,
    address: {
      ...normalizeAddress(details),
      city: normalizedCity,
    },
  };
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
  SIGNIFICANT_DISTANCE_METERS,
  SIGNIFICANT_AGE_MS,
  isValidCoordinates,
  normalizeAddress,
  createDeviceSnapshot,
  createManualSnapshot,
  distanceMeters,
  isSignificantLocationChange,
  getDisplayCity,
};
