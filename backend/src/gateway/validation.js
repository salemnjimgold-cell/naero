const { GatewayError } = require('./errors');
const { CATEGORY_REGISTRY } = require('./categories');

const LIMITS = Object.freeze({ radius: 50000, resultLimit: 50, timeoutMs: 15000 });
const CATEGORIES = new Set(Object.keys(CATEGORY_REGISTRY));
const LANGUAGES = new Set(['en', 'ar', 'fr', 'hu']);

function parseFinite(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function coordinates(params) {
  const latitude = parseFinite(params.latitude ?? params.lat);
  const longitude = parseFinite(params.longitude ?? params.lng ?? params.lon);
  if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new GatewayError('INVALID_COORDINATES', 'Latitude must be between -90 and 90 and longitude between -180 and 180.');
  }
  return { latitude, longitude };
}

function optionalNumber(value, { fallback, min, max, code, label, integer = false }) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = parseFinite(value);
  if (parsed === null || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    throw new GatewayError(code, `${label} must be between ${min} and ${max}.`);
  }
  return parsed;
}

function nearby(params) {
  const location = coordinates(params);
  const radius = optionalNumber(params.radius, { fallback: 5000, min: 1, max: LIMITS.radius, code: 'INVALID_RADIUS', label: 'Radius' });
  const limit = optionalNumber(params.limit, { fallback: 20, min: 1, max: LIMITS.resultLimit, code: 'INVALID_LIMIT', label: 'Limit', integer: true });
  const category = params.category || 'hospital';
  if (!CATEGORIES.has(category)) throw new GatewayError('INVALID_CATEGORY', 'Unsupported nearby category.');
  return { ...location, radius, limit, category, ...common(params) };
}

function common(params) {
  const language = params.language || 'en';
  if (!LANGUAGES.has(language)) throw new GatewayError('INVALID_LANGUAGE', 'Unsupported language.');
  const countryCode = params.countryCode;
  if (countryCode !== undefined && !/^[A-Za-z]{2}$/.test(countryCode)) {
    throw new GatewayError('INVALID_COUNTRY_CODE', 'Country code must contain two letters.');
  }
  const cursor = params.cursor;
  if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 256 || !/^[A-Za-z0-9._~-]+$/.test(cursor))) {
    throw new GatewayError('INVALID_CURSOR', 'Cursor is malformed.');
  }
  return { language, countryCode: countryCode?.toUpperCase(), cursor };
}

function reverseGeocode(params) {
  return { ...coordinates(params), ...common(params) };
}

module.exports = { LIMITS, CATEGORIES, LANGUAGES, coordinates, nearby, reverseGeocode };
