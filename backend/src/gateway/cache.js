const { canonicalCategory } = require('./categories');

const CELL_SIZE_METERS = 500;
const CELL_COVERAGE_MARGIN_METERS = 400;
const METERS_PER_DEGREE_LATITUDE = 111320;
const RADIUS_BUCKETS_METERS = Object.freeze([1000, 2000, 5000, 10000, 25000, 50000]);
const CACHE_SCHEMA_VERSION = 'nearby-v2';
const SOURCE_POLICY_VERSION = 'lde-2';
const DEFAULT_MAX_ENTRIES = 250;

function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function normalizedLongitude(longitude) {
  if (longitude === 180) return 180 - Number.EPSILON;
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

function geographicCell(latitude, longitude) {
  if (!finite(latitude) || !finite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new TypeError('Valid coordinates are required for nearby cache identity.');
  }
  const latitudeCellCount = Math.ceil(180 * METERS_PER_DEGREE_LATITUDE / CELL_SIZE_METERS);
  const latitudeIndex = Math.min(latitudeCellCount - 1,
    Math.floor((latitude + 90) * METERS_PER_DEGREE_LATITUDE / CELL_SIZE_METERS));
  const latitudeSouth = -90 + latitudeIndex * CELL_SIZE_METERS / METERS_PER_DEGREE_LATITUDE;
  const centerLatitude = Math.min(90, latitudeSouth + CELL_SIZE_METERS / (2 * METERS_PER_DEGREE_LATITUDE));
  const parallelMetersPerDegree = METERS_PER_DEGREE_LATITUDE * Math.max(0, Math.cos(centerLatitude * Math.PI / 180));
  const longitudeCellCount = Math.max(1, Math.ceil(360 * parallelMetersPerDegree / CELL_SIZE_METERS));
  const longitudeIndex = Math.min(longitudeCellCount - 1,
    Math.floor((normalizedLongitude(longitude) + 180) / 360 * longitudeCellCount));
  const longitudeWidth = 360 / longitudeCellCount;
  const centerLongitude = -180 + (longitudeIndex + 0.5) * longitudeWidth;
  return Object.freeze({
    id: `${latitudeIndex}:${longitudeCellCount}:${longitudeIndex}`,
    centerLatitude,
    centerLongitude,
    latitudeIndex,
    longitudeIndex,
    longitudeCellCount,
  });
}

function radiusBucket(radius) {
  if (!finite(radius) || radius <= 0 || radius > 50000) throw new TypeError('A supported radius is required.');
  return RADIUS_BUCKETS_METERS.find((candidate) => candidate >= radius + CELL_COVERAGE_MARGIN_METERS) || null;
}

function cacheDimensions(params) {
  const cell = geographicCell(params.latitude, params.longitude);
  const bucket = radiusBucket(params.radius);
  return {
    cell,
    radiusBucket: bucket,
    category: canonicalCategory(params.category),
    countryCode: String(params.countryCode || '').trim().toUpperCase(),
    language: String(params.language || 'en').trim().toLowerCase(),
    schemaVersion: CACHE_SCHEMA_VERSION,
    sourcePolicyVersion: SOURCE_POLICY_VERSION,
  };
}

function createNearbyCache({ ttlMs, staleMs, maxEntries = DEFAULT_MAX_ENTRIES }) {
  const entries = new Map();
  const capacity = Number.isInteger(maxEntries) && maxEntries > 0 ? maxEntries : DEFAULT_MAX_ENTRIES;
  function key(params) {
    const dimensions = cacheDimensions(params);
    return [
      dimensions.schemaVersion,
      dimensions.sourcePolicyVersion,
      dimensions.cell.id,
      dimensions.category,
      dimensions.radiusBucket || 'uncacheable',
      dimensions.countryCode,
      dimensions.language,
    ].join('|');
  }
  function removeExpired(now) {
    for (const [entryKey, entry] of entries) {
      if (now - entry.createdAt > ttlMs + staleMs) entries.delete(entryKey);
    }
  }
  function touch(entryKey, entry) {
    entries.delete(entryKey);
    entries.set(entryKey, entry);
  }
  function evict(now) {
    removeExpired(now);
    while (entries.size > capacity) entries.delete(entries.keys().next().value);
  }
  return {
    key,
    dimensions: cacheDimensions,
    get(params, { allowStale = false, now = Date.now() } = {}) {
      const entryKey = key(params);
      const entry = entries.get(entryKey);
      if (!entry) return null;
      const ageMs = now - entry.createdAt;
      if (ageMs > ttlMs + staleMs) {
        entries.delete(entryKey);
        return null;
      }
      if (ageMs <= ttlMs) {
        touch(entryKey, entry);
        return { ...entry, stale: false, ageMs };
      }
      if (allowStale) {
        touch(entryKey, entry);
        return { ...entry, stale: true, ageMs };
      }
      return null;
    },
    set(params, value, now = Date.now()) {
      const entryKey = key(params);
      entries.delete(entryKey);
      entries.set(entryKey, { value, createdAt: now });
      evict(now);
    },
    clear() { entries.clear(); },
    size() { return entries.size; },
  };
}

module.exports = {
  CACHE_SCHEMA_VERSION,
  CELL_COVERAGE_MARGIN_METERS,
  CELL_SIZE_METERS,
  DEFAULT_MAX_ENTRIES,
  RADIUS_BUCKETS_METERS,
  SOURCE_POLICY_VERSION,
  cacheDimensions,
  createNearbyCache,
  geographicCell,
  radiusBucket,
};
