const { GatewayError } = require('../errors');
const { getCategory } = require('../categories');
const { safeErrorClass, classifyNetworkError } = require('../providerDiagnostics');

function escapeOverpass(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
function buildQuery(params) {
  const category = getCategory(params.category);
  if (!category?.osm?.length) throw new GatewayError('INVALID_CATEGORY', 'This category is not supported by OpenStreetMap.');
  const clauses = category.osm.flatMap(([key, value]) => ['node', 'way', 'relation'].map(
    (type) => `${type}["${escapeOverpass(key)}"="${escapeOverpass(value)}"](around:${Math.ceil(params.radius)},${params.latitude},${params.longitude});`
  ));
  return `[out:json][timeout:20];(${clauses.join('')});out center tags ${Math.min(params.limit * 3, 150)};`;
}
function addressFrom(tags) {
  return [tags['addr:housenumber'], tags['addr:street'], tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ') || null;
}
function normalizeOsmElement(element, params) {
  const tags = element?.tags || {};
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  return {
    provider: 'osm',
    providerId: element?.type && element?.id ? `${element.type}/${element.id}` : null,
    name: tags.name || tags['name:en'] || null,
    description: tags.description || null,
    latitude: Number(latitude),
    longitude: Number(longitude),
    address: addressFrom(tags),
    city: tags['addr:city'] || null,
    region: tags['addr:state'] || null,
    countryCode: tags['addr:country'] || null,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    openingHours: tags.opening_hours ? [tags.opening_hours] : null,
    isOpenNow: null,
    rating: null,
    reviewCount: null,
    confidence: getCategory(params.category)?.confidence || 'low',
    sourceAttribution: '© OpenStreetMap contributors',
    navigationUrl: Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}` : null,
  };
}
function createOverpassProvider(env, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  return {
    name: 'osm',
    configured: Boolean(env.providers.overpassApiUrl),
    mapCategory: getCategory,
    normalizeResult: normalizeOsmElement,
    async healthCheck() { return { configured: this.configured, healthy: this.configured }; },
    async getPlaceDetails() { throw new GatewayError('PROVIDER_UNAVAILABLE', 'OSM place details are deferred.'); },
    async searchNearby(params, context = {}) {
      if (!this.configured) throw new GatewayError('PROVIDER_NOT_CONFIGURED', 'OpenStreetMap Overpass is not configured.');
      const diagnostics = context.diagnostics || { emit() {} };
      const query = buildQuery(params);
      let lastError;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const attemptNumber = attempt + 1;
        const startedAt = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), env.gateway.providerTimeoutMs);
        try {
          diagnostics.emit({ provider: 'osm', stage: 'request', attempt: attemptNumber });
          const response = await fetchImpl(env.providers.overpassApiUrl, {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
              'user-agent': 'Naero/1.2 nearby-gateway contact=operations@naero.app',
            },
            body: new URLSearchParams({ data: query }).toString(),
            signal: controller.signal,
          });
          diagnostics.emit({ provider: 'osm', stage: 'http_response', attempt: attemptNumber, elapsedMs: Date.now() - startedAt, upstreamStatus: response.status });
          if (response.status === 429 || response.status >= 500) {
            lastError = new GatewayError('PROVIDER_UNAVAILABLE', 'OpenStreetMap Overpass is temporarily unavailable.');
            if (attempt === 0) { await sleep(100); continue; }
            throw lastError;
          }
          if (!response.ok) throw new GatewayError('PROVIDER_UNAVAILABLE', 'OpenStreetMap Overpass is unavailable.');
          let payload;
          try {
            payload = await response.json();
          } catch (error) {
            diagnostics.emit({ provider: 'osm', stage: 'parse', attempt: attemptNumber, elapsedMs: Date.now() - startedAt, errorCode: 'INVALID_JSON', errorClass: safeErrorClass(error) });
            throw new GatewayError('PROVIDER_UNAVAILABLE', 'OpenStreetMap returned invalid JSON.');
          }
          if (!Array.isArray(payload?.elements)) {
            diagnostics.emit({ provider: 'osm', stage: 'parse', attempt: attemptNumber, elapsedMs: Date.now() - startedAt, errorCode: 'INVALID_ENVELOPE' });
            throw new GatewayError('PROVIDER_UNAVAILABLE', 'OpenStreetMap returned an invalid response.');
          }
          diagnostics.emit({ provider: 'osm', stage: 'parse', attempt: attemptNumber, elapsedMs: Date.now() - startedAt, resultCount: payload.elements.length });
          const results = payload.elements.map((item) => normalizeOsmElement(item, params));
          diagnostics.emit({ provider: 'osm', stage: 'normalization', attempt: attemptNumber, elapsedMs: Date.now() - startedAt, resultCount: results.length });
          return results;
        } catch (error) {
          if (error instanceof GatewayError) throw error;
          if (error?.name === 'AbortError') {
            diagnostics.emit({ provider: 'osm', stage: 'provider_failure', attempt: attemptNumber, elapsedMs: Date.now() - startedAt, errorCode: 'PROVIDER_TIMEOUT', errorClass: 'AbortError' });
            throw new GatewayError('PROVIDER_TIMEOUT', 'OpenStreetMap Overpass timed out.');
          }
          diagnostics.emit({
            provider: 'osm', stage: 'provider_failure', attempt: attemptNumber,
            elapsedMs: Date.now() - startedAt, errorCode: 'PROVIDER_UNAVAILABLE',
            errorClass: safeErrorClass(error), networkClass: classifyNetworkError(error),
          });
          throw new GatewayError('PROVIDER_UNAVAILABLE', 'OpenStreetMap Overpass is unavailable.');
        } finally {
          clearTimeout(timer);
        }
      }
      throw lastError;
    },
  };
}
module.exports = { createOverpassProvider, buildQuery, normalizeOsmElement };
