const { logger } = require('../observability/logger');
const {
  classifyNetworkError,
  classifyAddressFamilyAttempts,
} = require('../gateway/providerDiagnostics');

const DIAGNOSTIC = 'overpass_same_runtime_probe';
const QUERY = '[out:json][timeout:3];\nout count;';
const TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 8;
const CANDIDATES = Object.freeze([
  Object.freeze({ id: 'fossgis_main', endpoint: 'https://overpass-api.de/api/interpreter' }),
  Object.freeze({ id: 'private_coffee', endpoint: 'https://overpass.private.coffee/api/interpreter' }),
  Object.freeze({ id: 'vk_maps', endpoint: 'https://maps.mail.ru/osm/tools/overpass/api/interpreter' }),
]);
const CANDIDATE_IDS = new Set(CANDIDATES.map(({ id }) => id));
const NETWORK_CLASSES = new Set([
  'dns_failure', 'connection_refused', 'connection_reset', 'connection_closed',
  'connect_timeout', 'tls_failure', 'network_unreachable', 'address_unreachable',
  'generic_network_failure',
]);
const ADDRESS_FAMILIES = new Set(['IPv4', 'IPv6']);
const ATTEMPT_OUTCOMES = new Set([
  'timeout', 'unreachable', 'refused', 'reset', 'closed', 'tls_failure',
  'other_network_failure',
]);

function safeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  return Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

function safeProperty(value, key) {
  try { return value != null ? value[key] : undefined; } catch { return undefined; }
}

function sanitizeProbeEventUnsafe(event = {}) {
  const candidateId = safeProperty(event, 'candidateId');
  const success = safeProperty(event, 'success');
  if (!CANDIDATE_IDS.has(candidateId) || typeof success !== 'boolean') return undefined;

  const meta = { diagnostic: DIAGNOSTIC, candidateId, success };
  const elapsedMs = safeInteger(safeProperty(event, 'elapsedMs'), { max: 60000 });
  const upstreamStatus = safeInteger(safeProperty(event, 'upstreamStatus'), { min: 100, max: 599 });
  const networkClass = safeProperty(event, 'networkClass');
  const probeTimeout = safeProperty(event, 'probeTimeout');
  const multiAddress = safeProperty(event, 'multiAddress');
  const attemptCount = safeInteger(safeProperty(event, 'attemptCount'), { min: 1, max: MAX_ATTEMPTS });
  const validOverpassEnvelope = safeProperty(event, 'validOverpassEnvelope');

  if (elapsedMs !== undefined) meta.elapsedMs = elapsedMs;
  if (upstreamStatus !== undefined) meta.upstreamStatus = upstreamStatus;
  if (NETWORK_CLASSES.has(networkClass)) meta.networkClass = networkClass;
  if (typeof probeTimeout === 'boolean') meta.probeTimeout = probeTimeout;
  if (typeof multiAddress === 'boolean') meta.multiAddress = multiAddress;
  if (attemptCount !== undefined) meta.attemptCount = attemptCount;
  if (typeof validOverpassEnvelope === 'boolean') meta.validOverpassEnvelope = validOverpassEnvelope;

  const families = safeProperty(event, 'addressFamilies');
  if (Array.isArray(families)) {
    const safeFamilies = [...new Set(families.slice(0, MAX_ATTEMPTS)
      .filter((family) => ADDRESS_FAMILIES.has(family)))];
    if (safeFamilies.length) meta.addressFamilies = safeFamilies;
  }

  const outcomes = safeProperty(event, 'attemptOutcomes');
  if (Array.isArray(outcomes)) {
    const safeOutcomes = outcomes.slice(0, MAX_ATTEMPTS).map((attempt) => {
      const family = safeProperty(attempt, 'family');
      const outcome = safeProperty(attempt, 'outcome');
      return ADDRESS_FAMILIES.has(family) && ATTEMPT_OUTCOMES.has(outcome)
        ? { family, outcome } : undefined;
    }).filter(Boolean);
    if (safeOutcomes.length) meta.attemptOutcomes = safeOutcomes;
  }

  return meta;
}

function sanitizeProbeEvent(event = {}) {
  try { return sanitizeProbeEventUnsafe(event); } catch { return undefined; }
}

function createProbeEmitter(write = (message, meta) => logger.info(message, meta)) {
  return (event) => {
    const meta = sanitizeProbeEvent(event);
    if (!meta) return undefined;
    write('Overpass same-runtime diagnostic', meta);
    return meta;
  };
}

function createOverpassConnectivityProbe(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const now = options.now || Date.now;
  const setTimer = options.setTimeoutImpl || setTimeout;
  const clearTimer = options.clearTimeoutImpl || clearTimeout;
  const emit = createProbeEmitter(options.write);
  let runPromise;

  async function probeCandidate(candidate) {
    const startedAt = now();
    const controller = new AbortController();
    const timer = setTimer(() => controller.abort(), TIMEOUT_MS);
    const base = {
      candidateId: candidate.id,
      success: false,
      probeTimeout: false,
      validOverpassEnvelope: false,
    };

    try {
      const response = await fetchImpl(candidate.endpoint, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'Naero/1.2 same-runtime-connectivity-diagnostic',
        },
        body: new URLSearchParams({ data: QUERY }).toString(),
        signal: controller.signal,
      });
      const upstreamStatus = response.status;
      if (!response.ok) return emit({ ...base, elapsedMs: now() - startedAt, upstreamStatus });

      let payload;
      try { payload = await response.json(); } catch { payload = undefined; }
      const validOverpassEnvelope = Array.isArray(payload?.elements);
      return emit({
        ...base,
        success: validOverpassEnvelope,
        elapsedMs: now() - startedAt,
        upstreamStatus,
        validOverpassEnvelope,
      });
    } catch (error) {
      const probeTimeout = safeProperty(error, 'name') === 'AbortError';
      const family = probeTimeout ? undefined : classifyAddressFamilyAttempts(error);
      return emit({
        ...base,
        elapsedMs: now() - startedAt,
        probeTimeout,
        networkClass: probeTimeout ? undefined : classifyNetworkError(error),
        ...family,
      });
    } finally {
      clearTimer(timer);
    }
  }

  return function runOverpassConnectivityProbe(env = {}) {
    if (env.nodeEnv !== 'production' || env.serviceEnv !== 'production') return Promise.resolve([]);
    if (runPromise) return runPromise;
    runPromise = (async () => {
      const results = [];
      for (const candidate of CANDIDATES) results.push(await probeCandidate(candidate));
      return results;
    })().catch(() => []);
    return runPromise;
  };
}

const runOverpassConnectivityProbe = createOverpassConnectivityProbe();

module.exports = {
  CANDIDATES,
  DIAGNOSTIC,
  QUERY,
  TIMEOUT_MS,
  createOverpassConnectivityProbe,
  createProbeEmitter,
  runOverpassConnectivityProbe,
  sanitizeProbeEvent,
};
