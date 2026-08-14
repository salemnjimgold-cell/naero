const { GatewayError } = require('../errors');
const { getCategory } = require('../categories');
const { safeErrorClass, classifyNetworkError, classifyAddressFamilyAttempts } = require('../providerDiagnostics');
const { getGeoapifyCategory, supportsGeoapifyCategory } = require('./geoapifyCategories');
const { GEOAPIFY_LICENCE } = require('./geoapifyLicence');

const GEOAPIFY_PLACES_URL = 'https://api.geoapify.com/v2/places';
const GEOAPIFY_ATTRIBUTION = GEOAPIFY_LICENCE.attribution;

function clean(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function openingHours(properties) {
  const value = properties?.opening_hours;
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  return null;
}
function normalizeGeoapifyPlace(feature, params) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates : [];
  return {
    provider: 'geoapify',
    providerId: clean(properties.place_id),
    name: clean(properties.name),
    description: null,
    latitude: Number(properties.lat ?? coordinates[1]),
    longitude: Number(properties.lon ?? coordinates[0]),
    address: clean(properties.formatted),
    city: clean(properties.city),
    region: clean(properties.state),
    countryCode: clean(properties.country_code)?.toUpperCase() || null,
    phone: clean(properties.contact?.phone || properties.phone),
    website: clean(properties.website),
    openingHours: openingHours(properties),
    isOpenNow: null,
    rating: null,
    reviewCount: null,
    verified: false,
    permanentlyClosed: false,
    confidence: getCategory(params.category)?.confidence || 'low',
    fetchedAt: new Date().toISOString(),
    sourceAttribution: GEOAPIFY_ATTRIBUTION,
    sourceLicence: GEOAPIFY_LICENCE,
    navigationUrl: null,
  };
}
function buildGeoapifyUrl(params, apiKey) {
  const mapping = getGeoapifyCategory(params.category);
  if (!mapping?.categories.length) throw new GatewayError('INVALID_CATEGORY', 'This category is not supported by Geoapify discovery.');
  const url = new URL(GEOAPIFY_PLACES_URL);
  url.searchParams.set('categories', mapping.categories.join(','));
  if (mapping.conditions?.length) url.searchParams.set('conditions', mapping.conditions.join(','));
  url.searchParams.set('filter', `circle:${params.longitude},${params.latitude},${Math.ceil(params.radius)}`);
  url.searchParams.set('bias', `proximity:${params.longitude},${params.latitude}`);
  url.searchParams.set('limit', String(Math.min(params.limit, 20)));
  url.searchParams.set('lang', params.language);
  url.searchParams.set('apiKey', apiKey);
  return url;
}
function createGeoapifyProvider(env, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  return {
    name: 'geoapify',
    sourceRole: 'LIVE',
    configured: Boolean(env.providers.geoapifyApiKey),
    supportsCategory: supportsGeoapifyCategory,
    mapCategory: getGeoapifyCategory,
    normalizeResult: normalizeGeoapifyPlace,
    async healthCheck() { return { configured: this.configured, healthy: this.configured }; },
    async getPlaceDetails() { throw new GatewayError('PROVIDER_UNAVAILABLE', 'Geoapify place details are deferred.'); },
    async searchNearby(params, context = {}) {
      if (!this.configured) throw new GatewayError('PROVIDER_NOT_CONFIGURED', 'Geoapify is not configured.');
      if (!this.supportsCategory(params.category)) return [];
      const diagnostics = context.diagnostics || { emit() {} };
      const startedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.gateway.providerTimeoutMs);
      try {
        diagnostics.emit({ provider: 'geoapify', stage: 'request', attempt: 1 });
        const response = await fetchImpl(buildGeoapifyUrl(params, env.providers.geoapifyApiKey), {
          method: 'GET', headers: { accept: 'application/geo+json, application/json' }, signal: controller.signal,
        });
        diagnostics.emit({ provider: 'geoapify', stage: 'http_response', attempt: 1, elapsedMs: Date.now() - startedAt, upstreamStatus: response.status });
        if ([401, 403, 429].includes(response.status) || response.status >= 500) {
          throw new GatewayError('PROVIDER_UNAVAILABLE', 'Geoapify authentication, quota, or availability check failed.');
        }
        if (!response.ok) throw new GatewayError('PROVIDER_UNAVAILABLE', 'Geoapify rejected the discovery request.');
        let payload;
        try { payload = await response.json(); } catch (error) {
          diagnostics.emit({ provider: 'geoapify', stage: 'parse', attempt: 1, elapsedMs: Date.now() - startedAt, errorCode: 'INVALID_JSON', errorClass: safeErrorClass(error) });
          throw new GatewayError('PROVIDER_UNAVAILABLE', 'Geoapify returned invalid JSON.');
        }
        if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
          diagnostics.emit({ provider: 'geoapify', stage: 'parse', attempt: 1, elapsedMs: Date.now() - startedAt, errorCode: 'INVALID_ENVELOPE' });
          throw new GatewayError('PROVIDER_UNAVAILABLE', 'Geoapify returned an invalid response.');
        }
        diagnostics.emit({ provider: 'geoapify', stage: 'parse', attempt: 1, elapsedMs: Date.now() - startedAt, resultCount: payload.features.length });
        const expectedCountry = clean(params.countryCode)?.toUpperCase() || null;
        const results = payload.features.map((item) => normalizeGeoapifyPlace(item, params))
          .filter((item) => item.providerId && (!expectedCountry || item.countryCode === expectedCountry));
        diagnostics.emit({ provider: 'geoapify', stage: 'normalization', attempt: 1, elapsedMs: Date.now() - startedAt, resultCount: results.length });
        return results;
      } catch (error) {
        if (error instanceof GatewayError) throw error;
        if (error?.name === 'AbortError') {
          diagnostics.emit({ provider: 'geoapify', stage: 'provider_failure', attempt: 1, elapsedMs: Date.now() - startedAt, errorCode: 'PROVIDER_TIMEOUT', errorClass: 'AbortError' });
          throw new GatewayError('PROVIDER_TIMEOUT', 'Geoapify timed out.');
        }
        diagnostics.emit({
          provider: 'geoapify', stage: 'provider_failure', attempt: 1, elapsedMs: Date.now() - startedAt,
          errorCode: 'PROVIDER_UNAVAILABLE', errorClass: safeErrorClass(error), networkClass: classifyNetworkError(error),
          ...classifyAddressFamilyAttempts(error),
        });
        throw new GatewayError('PROVIDER_UNAVAILABLE', 'Geoapify is unavailable.');
      } finally { clearTimeout(timer); }
    },
  };
}

module.exports = { GEOAPIFY_PLACES_URL, GEOAPIFY_ATTRIBUTION, buildGeoapifyUrl, normalizeGeoapifyPlace, createGeoapifyProvider };
