const { logger } = require('../observability/logger');
const { getCategory } = require('./categories');
const { metricDimensions } = require('./operationalMetrics');
const { evaluateProviderPolicy, LIVE_PROVIDERS, POLICY_VERSION, PROVIDER_FIELDS,
  validOperationalRegion } = require('./providerPolicy');

const SNAPSHOT_MAX_KEYS = 500;
// Analytics is optional. Keep its database/timer pressure strictly below nearby traffic concurrency.
const MAX_IN_FLIGHT_LOADS = 16;
const SNAPSHOT_TTL_MS = 12 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;
const READER_TIMEOUT_MS = 2000;
const READER_MAX_ROWS = 30;
const READER_DAYS = 14;
const SELECTED_COLUMNS = Object.freeze([
  'metric_date',
  ...LIVE_PROVIDERS.flatMap((provider) => Object.values(PROVIDER_FIELDS[provider])),
]);
const POLICY_EVENTS = new Set([
  'static_policy_used', 'shadow_policy_evaluated', 'adaptive_policy_eligible',
  'insufficient_evidence', 'metrics_stale', 'metrics_unavailable', 'metrics_invalid',
  'provider_retained', 'provider_deprioritized', 'fallback_restored',
]);
const REASON_CODES = new Set([
  'CACHE_MISS', 'NO_EVIDENCE', 'INSUFFICIENT_EVIDENCE', 'ONE_PROVIDER_ONLY',
  'METRICS_STALE', 'METRICS_INVALID', 'METRICS_CONTRADICTORY', 'DUPLICATE_EVIDENCE',
  'CATEGORY_UNSUPPORTED', 'PROVIDER_UNSUPPORTED', 'STATIC_POLICY_INVALID',
  'STATIC_RETAINED', 'ADAPTIVE_POLICY_ELIGIBLE', 'READER_UNAVAILABLE', 'READER_TIMEOUT',
]);
const EVIDENCE_CLASSES = new Set(['unavailable', 'invalid', 'sparse', 'stale', 'sufficient']);
const AGE_CLASSES = new Set(['unknown', 'invalid', 'fresh', 'recent', 'stale']);
const OBSERVATION_CLASSES = new Set(['none', 'sparse', 'minimum', 'medium', 'high']);

function providerSignature(liveProviders) {
  if (!Array.isArray(liveProviders) || !liveProviders.length
    || liveProviders.some((provider) => !LIVE_PROVIDERS.includes(provider))
    || new Set(liveProviders).size !== liveProviders.length) return null;
  return JSON.stringify(liveProviders);
}

function policyKey(dimensions, liveProviders, policyVersion = POLICY_VERSION) {
  const signature = providerSignature(liveProviders);
  if (policyVersion !== POLICY_VERSION || !validDimensions(dimensions) || !signature) return null;
  return JSON.stringify([policyVersion, dimensions.operationalRegion, dimensions.countryCode,
    dimensions.category, dimensions.radiusBucket, liveProviders]);
}

function snapshotFor(key, staticOrder, decision) {
  return Object.freeze({ key, policyVersion: POLICY_VERSION,
    providerSignature: providerSignature(staticOrder), decision });
}

function validSnapshot(snapshot, key, staticOrder) {
  try {
    return Boolean(snapshot && snapshot.key === key && snapshot.policyVersion === POLICY_VERSION
      && snapshot.providerSignature === providerSignature(staticOrder)
      && snapshot.decision && Array.isArray(snapshot.decision.staticOrder)
      && snapshot.decision.staticOrder.length === staticOrder.length
      && snapshot.decision.staticOrder.every((provider, index) => provider === staticOrder[index]));
  } catch { return false; }
}

function createPolicySnapshotCache(options = {}) {
  const maxKeys = Number.isInteger(options.maxKeys) && options.maxKeys > 0
    ? Math.min(options.maxKeys, SNAPSHOT_MAX_KEYS) : SNAPSHOT_MAX_KEYS;
  const ttlMs = Number.isInteger(options.ttlMs) && options.ttlMs >= 10 * 60 * 1000
    && options.ttlMs <= 15 * 60 * 1000 ? options.ttlMs : SNAPSHOT_TTL_MS;
  const now = options.now || Date.now;
  const entries = new Map();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return null;
      if (now() >= entry.expiresAt) { entries.delete(key); return null; }
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key, value, customTtlMs = ttlMs) {
      entries.delete(key);
      entries.set(key, { value, expiresAt: now() + Math.min(customTtlMs, ttlMs) });
      while (entries.size > maxKeys) entries.delete(entries.keys().next().value);
    },
    clear() { entries.clear(); },
    size() { return entries.size; },
  };
}

function validDimensions(dimensions) {
  return Boolean(dimensions && validOperationalRegion(dimensions.operationalRegion)
    && /^[A-Z]{2}$/.test(dimensions.countryCode)
    && getCategory(dimensions.category)
    && [1000, 2000, 5000, 10000, 25000, 50000].includes(dimensions.radiusBucket));
}

function createMetricsReader(env, options = {}) {
  const configured = Boolean(env.supabase?.url && env.supabase?.serviceRoleKey);
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = Number.isInteger(options.timeoutMs) && options.timeoutMs > 0
    ? Math.min(options.timeoutMs, READER_TIMEOUT_MS) : READER_TIMEOUT_MS;
  return async function readMetrics(dimensions, now = Date.now()) {
    if (!configured || !validDimensions(dimensions)) return { ok: false, reasonCode: 'READER_UNAVAILABLE' };
    const today = new Date(now).toISOString().slice(0, 10);
    const start = new Date(Date.parse(`${today}T00:00:00.000Z`) - READER_DAYS * 86400000).toISOString().slice(0, 10);
    const query = new URLSearchParams({
      select: SELECTED_COLUMNS.join(','),
      metric_date: `gte.${start}`,
      and: `(metric_date.lt.${today})`,
      operational_region: `eq.${dimensions.operationalRegion}`,
      country_code: `eq.${dimensions.countryCode}`,
      category: `eq.${dimensions.category}`,
      radius_bucket: `eq.${dimensions.radiusBucket}`,
      order: 'metric_date.asc',
      limit: String(READER_MAX_ROWS),
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${env.supabase.url}/rest/v1/discovery_operational_metrics_daily?${query}`, {
        headers: { apikey: env.supabase.serviceRoleKey,
          authorization: `Bearer ${env.supabase.serviceRoleKey}`, accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) return { ok: false, reasonCode: 'READER_UNAVAILABLE' };
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length > READER_MAX_ROWS) return { ok: false, reasonCode: 'METRICS_INVALID' };
      return { ok: true, rows };
    } catch (error) {
      return { ok: false, reasonCode: error?.name === 'AbortError' ? 'READER_TIMEOUT' : 'READER_UNAVAILABLE' };
    } finally { clearTimeout(timer); }
  };
}

function createPolicyDiagnostics(write = (message, meta) => logger.info(message, meta)) {
  return {
    emit(event = {}) {
      try {
        if (!POLICY_EVENTS.has(event.event)) return;
        const meta = { event: event.event, policyVersion: POLICY_VERSION, mode: 'shadow' };
        if (LIVE_PROVIDERS.includes(event.provider)) meta.provider = event.provider;
        if (REASON_CODES.has(event.reasonCode)) meta.reasonCode = event.reasonCode;
        if (EVIDENCE_CLASSES.has(event.evidenceClass)) meta.evidenceClass = event.evidenceClass;
        if (AGE_CLASSES.has(event.decisionAgeClass)) meta.decisionAgeClass = event.decisionAgeClass;
        if (OBSERVATION_CLASSES.has(event.observationClass)) meta.observationClass = event.observationClass;
        write('Discovery provider policy diagnostic', meta);
      } catch { /* Shadow diagnostics are best effort only. */ }
    },
  };
}

function eventForDecision(decision) {
  if (decision.reasonCode === 'METRICS_STALE') return 'metrics_stale';
  if (['METRICS_INVALID', 'METRICS_CONTRADICTORY', 'DUPLICATE_EVIDENCE'].includes(decision.reasonCode)) return 'metrics_invalid';
  if (decision.reasonCode === 'ADAPTIVE_POLICY_ELIGIBLE') return 'adaptive_policy_eligible';
  if (decision.reasonCode === 'STATIC_RETAINED') return 'provider_retained';
  return 'insufficient_evidence';
}

function createProviderPolicyShadow(env, options = {}) {
  const enabled = env.gateway?.providerPolicyShadowEnabled === true;
  const adaptiveConfigured = env.gateway?.providerPolicyAdaptiveEnabled === true;
  const cache = options.cache || createPolicySnapshotCache(options.cacheOptions);
  const readMetrics = options.readMetrics || createMetricsReader(env, options.readerOptions);
  const diagnostics = createPolicyDiagnostics(options.logger);
  const pending = new Map();
  const now = options.now || Date.now;

  function load(key, dimensions, input) {
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= MAX_IN_FLIGHT_LOADS) return null;
    const promise = Promise.resolve().then(() => readMetrics(dimensions, now())).then((result) => {
      if (!result?.ok) {
        const reasonCode = REASON_CODES.has(result?.reasonCode) ? result.reasonCode : 'READER_UNAVAILABLE';
        diagnostics.emit({ event: reasonCode === 'METRICS_INVALID' ? 'metrics_invalid' : 'metrics_unavailable', reasonCode });
        const fallback = evaluateProviderPolicy({ ...input, rows: [], now: now() });
        cache.set(key, snapshotFor(key, input.staticOrder, fallback), FAILURE_TTL_MS);
        return fallback;
      }
      const decision = evaluateProviderPolicy({ ...input, rows: result.rows, now: now() });
      cache.set(key, snapshotFor(key, input.staticOrder, decision));
      diagnostics.emit({ event: eventForDecision(decision), reasonCode: decision.reasonCode,
        evidenceClass: decision.evidenceClass, decisionAgeClass: decision.decisionAgeClass });
      for (const item of decision.providerDecisions) diagnostics.emit({ event: 'provider_deprioritized',
        provider: item.provider, reasonCode: decision.reasonCode, observationClass: item.observationClass });
      return decision;
    }).catch(() => {
      diagnostics.emit({ event: 'fallback_restored', reasonCode: 'READER_UNAVAILABLE' });
      return null;
    }).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  }

  return {
    enabled,
    adaptiveConfigured,
    adaptiveEffective: false,
    cache,
    pendingCount: () => pending.size,
    evaluate(params, liveProviders) {
      if (!enabled) return null;
      const dimensions = metricDimensions(params, now());
      const staticOrder = liveProviders.map((provider) => provider.name);
      if (!validDimensions(dimensions)) {
        diagnostics.emit({ event: 'static_policy_used', reasonCode: 'METRICS_INVALID' });
        return evaluateProviderPolicy({ rows: [], liveProviders: staticOrder, staticOrder,
          category: params.category, now: now() });
      }
      const key = policyKey(dimensions, staticOrder);
      if (!key) {
        diagnostics.emit({ event: 'static_policy_used', reasonCode: 'METRICS_INVALID' });
        return evaluateProviderPolicy({ rows: [], liveProviders: staticOrder, staticOrder,
          category: params.category, dimensions, now: now() });
      }
      const cached = cache.get(key);
      if (validSnapshot(cached, key, staticOrder)) {
        const { decision } = cached;
        diagnostics.emit({ event: 'shadow_policy_evaluated', reasonCode: decision.reasonCode,
          evidenceClass: decision.evidenceClass, decisionAgeClass: decision.decisionAgeClass });
        return decision;
      }
      diagnostics.emit({ event: 'static_policy_used', reasonCode: 'CACHE_MISS' });
      void load(key, dimensions, { liveProviders: staticOrder, staticOrder, category: params.category, dimensions });
      return evaluateProviderPolicy({ rows: [], liveProviders: staticOrder, staticOrder,
        category: params.category, dimensions, now: now() });
    },
  };
}

module.exports = {
  FAILURE_TTL_MS, MAX_IN_FLIGHT_LOADS, POLICY_EVENTS, READER_DAYS, READER_MAX_ROWS, READER_TIMEOUT_MS,
  SELECTED_COLUMNS, SNAPSHOT_MAX_KEYS, SNAPSHOT_TTL_MS,
  createMetricsReader, createPolicyDiagnostics, createPolicySnapshotCache,
  createProviderPolicyShadow, policyKey, providerSignature, validDimensions, validSnapshot,
};
