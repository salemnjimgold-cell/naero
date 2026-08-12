const VERSION = 1;
const STORAGE_KEY = '@naero_contextual_onboarding_v1';
const LANGUAGES = Object.freeze(['en', 'ar', 'fr', 'hu']);
const ORIGINS = Object.freeze(['user_selected', 'permission_derived', 'unknown']);
const LOCATION_MODES = Object.freeze(['manual', 'device', 'unknown']);
const INTENTS = Object.freeze([
  'oriented', 'services', 'healthcare', 'transport', 'housing', 'work',
  'documents', 'community', 'explore',
]);

function cleanText(value, max = 120) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function normalizeContext(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const language = LANGUAGES.includes(input.language) ? input.language : 'en';
  const origin = ORIGINS.includes(input.origin) ? input.origin : 'unknown';
  const locationMode = LOCATION_MODES.includes(input.locationMode) ? input.locationMode : 'unknown';
  const countryCode = cleanText(input.countryCode, 2)?.toUpperCase() || null;
  const country = cleanText(input.country);
  const region = cleanText(input.region);
  const municipality = cleanText(input.municipality || input.city);
  const hasPlace = Boolean(countryCode && /^[A-Z]{2}$/.test(countryCode) && country && municipality);
  const safeOrigin = hasPlace && origin !== 'unknown' ? origin : 'unknown';
  const intents = Array.isArray(input.intents)
    ? [...new Set(input.intents.filter((item) => INTENTS.includes(item)))].slice(0, 4)
    : [];
  return Object.freeze({
    version: VERSION,
    completed: input.completed === true,
    language,
    countryCode: hasPlace ? countryCode : null,
    country: hasPlace ? country : null,
    region: hasPlace ? region : null,
    municipality: hasPlace ? municipality : null,
    origin: safeOrigin,
    locationMode: safeOrigin === 'unknown' ? 'unknown' : locationMode,
    intents,
  });
}

function serializeContext(input) {
  const normalized = normalizeContext(input);
  if (!normalized) throw new Error('Invalid onboarding context');
  return JSON.stringify(normalized);
}

function parseStoredContext(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== VERSION) return null;
    return normalizeContext(parsed);
  } catch {
    return null;
  }
}

function resolveInitialRoute({ newOnboarding, hasLaunched, storedContext }) {
  if (!newOnboarding) return 'Welcome';
  if (storedContext?.completed === true || hasLaunched === true) return 'Main';
  return 'ContextualOnboarding';
}

module.exports = {
  VERSION, STORAGE_KEY, LANGUAGES, ORIGINS, LOCATION_MODES, INTENTS,
  normalizeContext, serializeContext, parseStoredContext, resolveInitialRoute,
};
