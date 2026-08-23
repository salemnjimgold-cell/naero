const { getCategory } = require('./categories');

const POLICY_VERSION = 'lde-6-shadow-v1';
const LIVE_PROVIDERS = Object.freeze(['geoapify', 'google', 'osm']);
const MIN_TERMINAL_OUTCOMES = 50;
const MIN_COMPLETE_DATES = 3;
const MAX_EVIDENCE_DAYS = 14;
const MAX_EVIDENCE_AGE_DAYS = 2;
const SATURATED_COUNTER = 9000000000000000;
const THRESHOLDS = Object.freeze({
  degradedFailureRate: 0.30,
  degradedEmptyRate: 0.70,
  degradedRetryPressure: 0.25,
  healthyFailureRate: 0.10,
  healthyEmptyRate: 0.40,
  healthyYieldPerOutcome: 1,
  materialFailureImprovement: 0.20,
  materialEmptyImprovement: 0.30,
});

const PROVIDER_FIELDS = Object.freeze(Object.fromEntries(LIVE_PROVIDERS.map((provider) => [provider, {
  attempts: `${provider}_attempts`,
  successes: `${provider}_successes`,
  emptyResults: `${provider}_empty_results`,
  failures: `${provider}_failures`,
  yield: `${provider}_yield`,
}])));

function staticDecision(staticOrder, reasonCode, evidenceClass = 'unavailable', decisionAgeClass = 'unknown') {
  return Object.freeze({
    policyVersion: POLICY_VERSION,
    mode: 'shadow',
    eligible: false,
    reasonCode,
    staticOrder: Object.freeze([...staticOrder]),
    proposedOrder: Object.freeze([...staticOrder]),
    evidenceClass,
    decisionAgeClass,
    providerDecisions: Object.freeze([]),
  });
}

function safeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 && value < SATURATED_COUNTER;
}

function validOperationalRegion(value) {
  if (typeof value !== 'string' || !/^op5-v1:\d{1,5}:\d{1,5}:\d{1,5}$/.test(value)) return false;
  const [, latitudeText, longitudeCountText, longitudeText] = value.split(':');
  const latitudeIndex = Number(latitudeText);
  const longitudeCount = Number(longitudeCountText);
  const longitudeIndex = Number(longitudeText);
  if (![latitudeIndex, longitudeCount, longitudeIndex].every(Number.isInteger)
    || latitudeIndex < 0 || latitudeIndex > 4007 || longitudeCount < 1 || longitudeIndex < 0) return false;
  const centerLatitude = -90 + (latitudeIndex * 5000 + 2500) / 111320;
  const expectedLongitudeCount = Math.max(1,
    Math.ceil(360 * 111320 * Math.max(0, Math.cos(centerLatitude * Math.PI / 180)) / 5000));
  return longitudeCount === expectedLongitudeCount && longitudeIndex < longitudeCount;
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
}

function ageClass(ageDays) {
  if (!Number.isFinite(ageDays) || ageDays < 0) return 'invalid';
  if (ageDays <= 1) return 'fresh';
  if (ageDays <= MAX_EVIDENCE_AGE_DAYS) return 'recent';
  return 'stale';
}

function observationClass(outcomes) {
  if (outcomes >= 500) return 'high';
  if (outcomes >= 100) return 'medium';
  if (outcomes >= MIN_TERMINAL_OUTCOMES) return 'minimum';
  return outcomes > 0 ? 'sparse' : 'none';
}

function validateContext({ rows, liveProviders, staticOrder, category, dimensions, now = Date.now() }) {
  if (!Array.isArray(rows) || !Array.isArray(liveProviders) || !Array.isArray(staticOrder)) return { error: 'METRICS_INVALID' };
  if (!getCategory(category) || dimensions?.category !== category) return { error: 'CATEGORY_UNSUPPORTED' };
  if (!validOperationalRegion(dimensions?.operationalRegion)
    || !/^[A-Z]{2}$/.test(dimensions?.countryCode)
    || ![1000, 2000, 5000, 10000, 25000, 50000].includes(dimensions?.radiusBucket)) {
    return { error: 'METRICS_INVALID' };
  }
  if (!Number.isFinite(now)) return { error: 'METRICS_INVALID' };
  if (!staticOrder.length || staticOrder.some((name) => !LIVE_PROVIDERS.includes(name))
    || new Set(staticOrder).size !== staticOrder.length) return { error: 'STATIC_POLICY_INVALID' };
  if (liveProviders.some((name) => !LIVE_PROVIDERS.includes(name)) || new Set(liveProviders).size !== liveProviders.length
    || liveProviders.some((name) => !staticOrder.includes(name))) return { error: 'PROVIDER_UNSUPPORTED' };
  if (liveProviders.length < 2) return { error: 'ONE_PROVIDER_ONLY' };
  if (!rows.length || rows.length > 30) return { error: rows.length ? 'METRICS_INVALID' : 'NO_EVIDENCE' };
  return { now };
}

function validateRows(rows, now) {
  const today = Date.parse(`${new Date(now).toISOString().slice(0, 10)}T00:00:00.000Z`);
  const seenDates = new Set();
  let latest = -Infinity;
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { error: 'METRICS_INVALID' };
    const date = parseDate(row.metric_date);
    if (date === null || date >= today || date < today - MAX_EVIDENCE_DAYS * 86400000) return { error: 'METRICS_INVALID' };
    if (seenDates.has(row.metric_date)) return { error: 'DUPLICATE_EVIDENCE' };
    seenDates.add(row.metric_date);
    latest = Math.max(latest, date);
    for (const fields of Object.values(PROVIDER_FIELDS)) {
      for (const field of Object.values(fields)) if (!safeInteger(row[field])) return { error: 'METRICS_INVALID' };
      const terminal = row[fields.successes] + row[fields.emptyResults] + row[fields.failures];
      if (row[fields.attempts] < terminal || (row[fields.yield] > 0 && row[fields.successes] === 0)) {
        return { error: 'METRICS_CONTRADICTORY' };
      }
    }
  }
  const ageDays = Math.floor((today - latest) / 86400000);
  return { dates: seenDates.size, ageDays, decisionAgeClass: ageClass(ageDays) };
}

function aggregate(rows, provider) {
  const fields = PROVIDER_FIELDS[provider];
  const totals = { attempts: 0, successes: 0, emptyResults: 0, failures: 0, yield: 0, dates: 0 };
  for (const row of rows) {
    const terminal = row[fields.successes] + row[fields.emptyResults] + row[fields.failures];
    totals.attempts += row[fields.attempts];
    totals.successes += row[fields.successes];
    totals.emptyResults += row[fields.emptyResults];
    totals.failures += row[fields.failures];
    totals.yield += row[fields.yield];
    if (terminal > 0) totals.dates += 1;
  }
  totals.terminalOutcomes = totals.successes + totals.emptyResults + totals.failures;
  totals.valid = [totals.attempts, totals.successes, totals.emptyResults, totals.failures,
    totals.yield, totals.terminalOutcomes].every(safeInteger) && totals.attempts >= totals.terminalOutcomes;
  totals.failureRate = totals.terminalOutcomes ? totals.failures / totals.terminalOutcomes : 0;
  totals.emptyRate = totals.terminalOutcomes ? totals.emptyResults / totals.terminalOutcomes : 0;
  totals.yieldPerOutcome = totals.terminalOutcomes ? totals.yield / totals.terminalOutcomes : 0;
  totals.retryPressure = totals.attempts ? Math.max(0, totals.attempts - totals.terminalOutcomes) / totals.attempts : 0;
  totals.observationClass = observationClass(totals.terminalOutcomes);
  totals.sufficient = totals.terminalOutcomes >= MIN_TERMINAL_OUTCOMES && totals.dates >= MIN_COMPLETE_DATES;
  return totals;
}

function degraded(evidence) {
  return evidence.failureRate >= THRESHOLDS.degradedFailureRate
    || evidence.emptyRate >= THRESHOLDS.degradedEmptyRate
    || evidence.retryPressure >= THRESHOLDS.degradedRetryPressure;
}

function healthy(evidence) {
  return evidence.failureRate <= THRESHOLDS.healthyFailureRate
    && evidence.emptyRate <= THRESHOLDS.healthyEmptyRate
    && evidence.yieldPerOutcome >= THRESHOLDS.healthyYieldPerOutcome;
}

function materiallyBetter(alternative, current) {
  return current.failureRate - alternative.failureRate >= THRESHOLDS.materialFailureImprovement
    || current.emptyRate - alternative.emptyRate >= THRESHOLDS.materialEmptyImprovement;
}

function evaluateProviderPolicyUnsafe(input = {}) {
  const staticOrder = Array.isArray(input.staticOrder) ? input.staticOrder : LIVE_PROVIDERS;
  const context = validateContext({ ...input, staticOrder });
  if (context.error) return staticDecision(staticOrder, context.error);
  const validation = validateRows(input.rows, context.now);
  if (validation.error) return staticDecision(staticOrder, validation.error, 'invalid');
  if (validation.ageDays > MAX_EVIDENCE_AGE_DAYS) {
    return staticDecision(staticOrder, 'METRICS_STALE', 'stale', validation.decisionAgeClass);
  }
  const evidence = Object.fromEntries(input.liveProviders.map((provider) => [provider, aggregate(input.rows, provider)]));
  if (Object.values(evidence).some((value) => !value.valid)) {
    return staticDecision(staticOrder, 'METRICS_INVALID', 'invalid', validation.decisionAgeClass);
  }
  if (Object.values(evidence).filter((value) => value.sufficient).length < 2) {
    return staticDecision(staticOrder, 'INSUFFICIENT_EVIDENCE', 'sparse', validation.decisionAgeClass);
  }

  const proposed = [...staticOrder];
  const decisions = [];
  for (let index = 0; index < proposed.length - 1; index += 1) {
    const currentName = proposed[index];
    if (!input.liveProviders.includes(currentName)) continue;
    const current = evidence[currentName];
    if (!current?.sufficient || !degraded(current)) continue;
    const candidateIndex = proposed.findIndex((name, candidatePosition) => candidatePosition > index
      && input.liveProviders.includes(name) && evidence[name]?.sufficient
      && healthy(evidence[name]) && materiallyBetter(evidence[name], current));
    if (candidateIndex === -1) continue;
    const [candidate] = proposed.splice(candidateIndex, 1);
    proposed.splice(index, 0, candidate);
    decisions.push(Object.freeze({ provider: currentName, action: 'deprioritized', alternative: candidate,
      observationClass: current.observationClass }));
  }
  if (!decisions.length) {
    return Object.freeze({ ...staticDecision(staticOrder, 'STATIC_RETAINED', 'sufficient', validation.decisionAgeClass),
      eligible: true });
  }
  return Object.freeze({
    policyVersion: POLICY_VERSION,
    mode: 'shadow',
    eligible: true,
    reasonCode: 'ADAPTIVE_POLICY_ELIGIBLE',
    staticOrder: Object.freeze([...staticOrder]),
    proposedOrder: Object.freeze(proposed),
    evidenceClass: 'sufficient',
    decisionAgeClass: validation.decisionAgeClass,
    providerDecisions: Object.freeze(decisions),
  });
}

function evaluateProviderPolicy(input = {}) {
  let fallbackOrder = LIVE_PROVIDERS;
  try {
    if (Array.isArray(input?.staticOrder)) {
      const candidate = [...input.staticOrder].filter((provider, index, all) =>
        LIVE_PROVIDERS.includes(provider) && all.indexOf(provider) === index);
      if (candidate.length) fallbackOrder = candidate;
    }
    return evaluateProviderPolicyUnsafe(input);
  } catch {
    return staticDecision(fallbackOrder, 'METRICS_INVALID', 'invalid');
  }
}

module.exports = {
  LIVE_PROVIDERS, MAX_EVIDENCE_DAYS, MIN_COMPLETE_DATES, MIN_TERMINAL_OUTCOMES,
  POLICY_VERSION, PROVIDER_FIELDS, SATURATED_COUNTER, THRESHOLDS,
  evaluateProviderPolicy, validOperationalRegion,
};
