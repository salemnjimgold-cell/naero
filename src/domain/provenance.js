const { TRUST_CLASSES, normalizeTrustClass, normalizeFreshness, createJurisdiction } = require('./contextFoundation');

const DATE_FIELDS = Object.freeze(['publishedAt', 'effectiveAt', 'updatedAt', 'verifiedAt', 'retrievedAt']);

function normalizeOptionalDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function formatProvenanceDate(value, locale = 'en') {
  const normalized = normalizeOptionalDate(value);
  if (!normalized) return null;
  try { return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(normalized)); }
  catch { return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(normalized)); }
}

function normalizeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch { return null; }
}

function createSource(input = {}) {
  const trustClass = normalizeTrustClass(input.trustClass);
  if (!trustClass) return null;
  const dates = {};
  for (const field of DATE_FIELDS) dates[field] = normalizeOptionalDate(input[field]);
  return Object.freeze({
    id: typeof input.id === 'string' ? input.id : null,
    title: typeof input.title === 'string' ? input.title : null,
    trustClass,
    publisher: typeof input.publisher === 'string' ? input.publisher : null,
    authority: typeof input.authority === 'string' ? input.authority : null,
    jurisdiction: input.jurisdiction || null,
    sourceUrl: normalizeExternalUrl(input.sourceUrl),
    sourceLanguage: typeof input.sourceLanguage === 'string' ? input.sourceLanguage : null,
    freshness: normalizeFreshness(input.freshness),
    ...dates,
  });
}

function createProvenance(input = {}) {
  const trustClass = normalizeTrustClass(input.trustClass);
  if (!trustClass) return null;
  const supportingSources = Array.isArray(input.supportingSources) ? input.supportingSources.map(createSource).filter(Boolean) : [];
  return Object.freeze({
    ...createSource(input),
    aiInvolved: trustClass === 'ai_guidance' || input.aiInvolved === true,
    assumptions: Array.isArray(input.assumptions) ? input.assumptions.filter(v => typeof v === 'string' && v.trim()) : [],
    uncertainty: typeof input.uncertainty === 'string' && input.uncertainty.trim() ? input.uncertainty : null,
    supportingSources: Object.freeze(supportingSources),
    verificationScope: typeof input.verificationScope === 'string' ? input.verificationScope : null,
    verifierRole: typeof input.verifierRole === 'string' ? input.verifierRole : null,
  });
}

function createAIProvenance(input = {}) {
  return createProvenance({ ...input, trustClass: 'ai_guidance', aiInvolved: true });
}

module.exports = { TRUST_CLASSES, DATE_FIELDS, normalizeOptionalDate, formatProvenanceDate, normalizeExternalUrl, createSource, createProvenance, createAIProvenance, createJurisdiction };
