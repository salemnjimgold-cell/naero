const CONTEXT_ORIGINS = Object.freeze(['known', 'user_selected', 'permission_derived', 'fetched', 'unknown']);
const TRUST_CLASSES = Object.freeze(['official', 'naero_verified', 'external_provider', 'community', 'ai_guidance']);
const FRESHNESS_STATES = Object.freeze(['current', 'review_due', 'outdated', 'date_unknown']);
const JURISDICTION_LEVELS = Object.freeze(['country', 'region', 'municipality', 'service_area']);

function createContextValue(value, origin = 'unknown') {
  const safeOrigin = CONTEXT_ORIGINS.includes(origin) ? origin : 'unknown';
  if (safeOrigin === 'unknown' || value === undefined || value === null || value === '') {
    return Object.freeze({ value: null, origin: 'unknown', isKnown: false });
  }
  return Object.freeze({ value, origin: safeOrigin, isKnown: true });
}

function contextValueOrNull(contextValue) {
  return contextValue?.isKnown === true ? contextValue.value : null;
}

function createJurisdiction({ countryCode, region = null, municipality = null, serviceArea = null }) {
  if (typeof countryCode !== 'string' || !/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error('countryCode must be an ISO 3166-1 alpha-2 uppercase code');
  }
  const normalizeNode = (node, level) => {
    if (node === null) return null;
    if (!node || typeof node.id !== 'string' || typeof node.name !== 'string') throw new Error(`${level} requires id and name`);
    return Object.freeze({ level, id: node.id, name: node.name });
  };
  return Object.freeze({
    country: Object.freeze({ level: 'country', id: countryCode, name: countryCode }),
    region: normalizeNode(region, 'region'),
    municipality: normalizeNode(municipality, 'municipality'),
    serviceArea: normalizeNode(serviceArea, 'service_area'),
  });
}

function normalizeTrustClass(value) {
  return TRUST_CLASSES.includes(value) ? value : null;
}

function normalizeFreshness(value) {
  return FRESHNESS_STATES.includes(value) ? value : 'date_unknown';
}

function deriveFreshness({ updatedAt, reviewDueAt, now = Date.now() } = {}) {
  if (!updatedAt && !reviewDueAt) return 'date_unknown';
  const updated = updatedAt ? Date.parse(updatedAt) : NaN;
  const due = reviewDueAt ? Date.parse(reviewDueAt) : NaN;
  if ((updatedAt && Number.isNaN(updated)) || (reviewDueAt && Number.isNaN(due))) return 'date_unknown';
  if (!Number.isNaN(due) && now > due) return 'outdated';
  if (!Number.isNaN(due) && due - now <= 30 * 24 * 60 * 60 * 1000) return 'review_due';
  return 'current';
}

module.exports = {
  CONTEXT_ORIGINS, TRUST_CLASSES, FRESHNESS_STATES, JURISDICTION_LEVELS,
  createContextValue, contextValueOrNull, createJurisdiction, normalizeTrustClass, normalizeFreshness, deriveFreshness,
};
