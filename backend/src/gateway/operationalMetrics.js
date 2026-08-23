const { canonicalCategory, getCategory } = require('./categories');
const { radiusBucket } = require('./cache');

const OPERATIONAL_REGION_METERS = 5000;
const METERS_PER_DEGREE_LATITUDE = 111320;
const MAX_KEYS = 500;
const FLUSH_BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 60000;
const MAX_INCREMENT = 1000000;
const LIVE_PROVIDERS = Object.freeze(['geoapify', 'google', 'osm']);

const BASE_COUNTERS = Object.freeze([
  'nearbyRequests', 'l1FreshHits', 'l1StaleRescues', 'l2SufficientResponses',
  'refreshClaimsAcquired', 'refreshClaimsContended', 'refreshCompletions', 'refreshFailures',
  'partialResponses', 'staleResponses', 'exhaustedResponses',
  'latencyLt10Ms', 'latencyLt50Ms', 'latencyLt250Ms', 'latencyLt1000Ms', 'latencyGte1000Ms',
]);
const PROVIDER_COUNTERS = Object.freeze(LIVE_PROVIDERS.flatMap((provider) => [
  `${provider}Calls`, `${provider}Successes`, `${provider}Empty`, `${provider}Failures`, `${provider}Yield`,
]));
const COUNTERS = Object.freeze([...BASE_COUNTERS, ...PROVIDER_COUNTERS]);

function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function normalizedLongitude(longitude) {
  if (longitude === 180) return 180 - Number.EPSILON;
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

function operationalRegion(latitude, longitude) {
  if (!finite(latitude) || !finite(longitude) || latitude < -90 || latitude > 90
    || longitude < -180 || longitude > 180) return null;
  const latitudeCellCount = Math.ceil(180 * METERS_PER_DEGREE_LATITUDE / OPERATIONAL_REGION_METERS);
  const latitudeIndex = Math.min(latitudeCellCount - 1,
    Math.floor((latitude + 90) * METERS_PER_DEGREE_LATITUDE / OPERATIONAL_REGION_METERS));
  const latitudeSouth = -90 + latitudeIndex * OPERATIONAL_REGION_METERS / METERS_PER_DEGREE_LATITUDE;
  const centerLatitude = Math.min(90, latitudeSouth + OPERATIONAL_REGION_METERS / (2 * METERS_PER_DEGREE_LATITUDE));
  const metersPerLongitudeDegree = METERS_PER_DEGREE_LATITUDE
    * Math.max(0, Math.cos(centerLatitude * Math.PI / 180));
  const longitudeCellCount = Math.max(1,
    Math.ceil(360 * metersPerLongitudeDegree / OPERATIONAL_REGION_METERS));
  const longitudeIndex = Math.min(longitudeCellCount - 1,
    Math.floor((normalizedLongitude(longitude) + 180) / 360 * longitudeCellCount));
  return `op5-v1:${latitudeIndex}:${longitudeCellCount}:${longitudeIndex}`;
}

function metricDimensions(params, now = Date.now()) {
  const region = operationalRegion(params?.latitude, params?.longitude);
  const category = canonicalCategory(params?.category);
  let bucket = null;
  try { bucket = radiusBucket(params?.radius); } catch { return null; }
  const countryCode = String(params?.countryCode || '').trim().toUpperCase();
  if (!region || !bucket || !getCategory(category) || !/^[A-Z]{2}$/.test(countryCode)) return null;
  return Object.freeze({
    metricDate: new Date(now).toISOString().slice(0, 10),
    operationalRegion: region,
    countryCode,
    category,
    radiusBucket: bucket,
  });
}

function emptyCounters() {
  return Object.fromEntries(COUNTERS.map((name) => [name, 0]));
}

function safeIncrement(value) {
  if (!Number.isInteger(value) || value < 0) return 0;
  return Math.min(value, MAX_INCREMENT);
}

function providerCounter(provider, outcome) {
  if (!LIVE_PROVIDERS.includes(provider)) return null;
  const suffix = { call: 'Calls', success: 'Successes', empty: 'Empty', failure: 'Failures', yield: 'Yield' }[outcome];
  return suffix ? `${provider}${suffix}` : null;
}

function metricKey(dimensions) {
  return [dimensions.metricDate, dimensions.operationalRegion, dimensions.countryCode,
    dimensions.category, dimensions.radiusBucket].join('|');
}

function rpcBody(entry) {
  const body = {
    p_metric_date: entry.metricDate,
    p_operational_region: entry.operationalRegion,
    p_country_code: entry.countryCode,
    p_category: entry.category,
    p_radius_bucket: entry.radiusBucket,
  };
  for (const counter of COUNTERS) {
    body[`p_${counter.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`] = safeIncrement(entry[counter]);
  }
  return body;
}

function createOperationalMetrics(env, options = {}) {
  const enabled = env.gateway?.operationalMetricsEnabled === true;
  const persistenceEnabled = enabled && env.gateway?.operationalMetricsPersistenceEnabled === true
    && Boolean(env.supabase?.url && env.supabase?.serviceRoleKey);
  const fetchImpl = options.fetchImpl || fetch;
  const maxKeys = Number.isInteger(options.maxKeys) && options.maxKeys > 0 ? Math.min(options.maxKeys, 5000) : MAX_KEYS;
  const flushBatchSize = Number.isInteger(options.flushBatchSize) && options.flushBatchSize > 0
    ? Math.min(options.flushBatchSize, maxKeys) : FLUSH_BATCH_SIZE;
  const entries = new Map();
  let flushPromise = null;
  let timer = null;
  let droppedKeys = 0;

  async function persistEntry(entry) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(env.gateway?.providerTimeoutMs || 8000, 8000));
    try {
      const response = await fetchImpl(`${env.supabase.url}/rest/v1/rpc/increment_discovery_operational_metrics`, {
        method: 'POST',
        headers: { apikey: env.supabase.serviceRoleKey,
          authorization: `Bearer ${env.supabase.serviceRoleKey}`, 'content-type': 'application/json' },
        body: JSON.stringify(rpcBody(entry)), signal: controller.signal,
      });
      return response.ok;
    } catch { return false; }
    finally { clearTimeout(timeout); }
  }

  async function flush() {
    if (!persistenceEnabled || flushPromise || entries.size === 0) return flushPromise || { flushed: 0, failed: 0 };
    const snapshot = [...entries.values()].slice(0, flushBatchSize);
    for (const entry of snapshot) entries.delete(metricKey(entry));
    flushPromise = (async () => {
      let flushed = 0;
      for (const entry of snapshot) {
        if (await persistEntry(entry)) flushed += 1;
      }
      return { flushed, failed: snapshot.length - flushed };
    })().finally(() => { flushPromise = null; });
    return flushPromise;
  }

  function scheduleFlush() {
    if (!persistenceEnabled || timer) return;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, options.flushIntervalMs || FLUSH_INTERVAL_MS);
    timer.unref?.();
  }

  function increment(params, counter, amount = 1, currentTime = Date.now()) {
    if (!enabled || !COUNTERS.includes(counter)) return false;
    const dimensions = metricDimensions(params, currentTime);
    if (!dimensions) return false;
    const key = metricKey(dimensions);
    let entry = entries.get(key);
    if (!entry) {
      if (entries.size >= maxKeys) { droppedKeys += 1; return false; }
      entry = { ...dimensions, ...emptyCounters() };
      entries.set(key, entry);
    }
    entry[counter] = Math.min(MAX_INCREMENT, entry[counter] + safeIncrement(amount));
    if (persistenceEnabled && entries.size >= flushBatchSize) void flush();
    else scheduleFlush();
    return true;
  }

  function observeProvider(params, provider, outcome, amount = 1, currentTime = Date.now()) {
    const counter = providerCounter(provider, outcome);
    return counter ? increment(params, counter, amount, currentTime) : false;
  }

  function observeResponse(params, response, elapsedMs, currentTime = Date.now()) {
    if (response?.partial) increment(params, 'partialResponses', 1, currentTime);
    if (response?.stale) increment(params, 'staleResponses', 1, currentTime);
    if (response?.coverageStatus === 'exhausted') increment(params, 'exhaustedResponses', 1, currentTime);
    const counter = elapsedMs < 10 ? 'latencyLt10Ms' : elapsedMs < 50 ? 'latencyLt50Ms'
      : elapsedMs < 250 ? 'latencyLt250Ms' : elapsedMs < 1000 ? 'latencyLt1000Ms' : 'latencyGte1000Ms';
    increment(params, counter, 1, currentTime);
  }

  return {
    enabled, persistenceEnabled, increment, observeProvider, observeResponse, flush,
    snapshot: () => [...entries.values()].map((entry) => ({ ...entry })),
    stats: () => ({ keys: entries.size, droppedKeys, flushing: Boolean(flushPromise) }),
    close: () => { if (timer) clearTimeout(timer); timer = null; },
  };
}

module.exports = {
  COUNTERS, LIVE_PROVIDERS, MAX_INCREMENT, MAX_KEYS, OPERATIONAL_REGION_METERS,
  createOperationalMetrics, metricDimensions, operationalRegion, providerCounter, rpcBody,
};
