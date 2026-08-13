const { GatewayError } = require('../errors');
const { getCategory } = require('../categories');

const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.location',
  'places.addressComponents', 'places.nationalPhoneNumber', 'places.websiteUri',
  'places.regularOpeningHours.weekdayDescriptions', 'places.currentOpeningHours.openNow',
  'places.rating', 'places.userRatingCount', 'places.businessStatus', 'places.googleMapsUri',
].join(',');
function component(place, type) {
  return place?.addressComponents?.find((item) => item.types?.includes(type))?.shortText || null;
}
function normalizeGooglePlace(place, params) {
  return {
    provider: 'google',
    providerId: place?.id || null,
    name: place?.displayName?.text || null,
    description: null,
    latitude: Number(place?.location?.latitude),
    longitude: Number(place?.location?.longitude),
    address: place?.formattedAddress || null,
    city: component(place, 'locality'),
    region: component(place, 'administrative_area_level_1'),
    countryCode: component(place, 'country'),
    phone: place?.nationalPhoneNumber || null,
    website: place?.websiteUri || null,
    openingHours: place?.regularOpeningHours?.weekdayDescriptions || null,
    isOpenNow: typeof place?.currentOpeningHours?.openNow === 'boolean' ? place.currentOpeningHours.openNow : null,
    rating: typeof place?.rating === 'number' ? place.rating : null,
    reviewCount: Number.isInteger(place?.userRatingCount) ? place.userRatingCount : null,
    permanentlyClosed: place?.businessStatus === 'CLOSED_PERMANENTLY',
    confidence: getCategory(params.category)?.confidence || 'low',
    sourceAttribution: 'Google Maps',
    navigationUrl: place?.googleMapsUri || null,
  };
}
function createGooglePlacesProvider(env, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  return {
    name: 'google',
    sourceRole: 'LIVE',
    configured: Boolean(env.providers.googlePlacesApiKey),
    mapCategory: getCategory,
    normalizeResult: normalizeGooglePlace,
    async healthCheck() { return { configured: this.configured, healthy: this.configured }; },
    async getPlaceDetails() { throw new GatewayError('PROVIDER_UNAVAILABLE', 'Google place details are deferred.'); },
    async searchNearby(params) {
      if (!this.configured) throw new GatewayError('PROVIDER_NOT_CONFIGURED', 'Google Places is not configured.');
      const types = getCategory(params.category)?.google || [];
      if (!types.length) throw new GatewayError('INVALID_CATEGORY', 'This category is not supported by Google Places.');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.gateway.providerTimeoutMs);
      try {
        const response = await fetchImpl('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-goog-api-key': env.providers.googlePlacesApiKey,
            'x-goog-fieldmask': FIELD_MASK,
          },
          body: JSON.stringify({
            includedTypes: types,
            maxResultCount: Math.min(params.limit, 20),
            languageCode: params.language,
            locationRestriction: { circle: { center: { latitude: params.latitude, longitude: params.longitude }, radius: params.radius } },
          }),
          signal: controller.signal,
        });
        if (response.status === 429 || response.status === 403) {
          throw new GatewayError('PROVIDER_UNAVAILABLE', 'Google Places quota or billing is unavailable.');
        }
        if (!response.ok) throw new GatewayError('PROVIDER_UNAVAILABLE', 'Google Places is unavailable.');
        const payload = await response.json();
        if (payload?.places !== undefined && !Array.isArray(payload.places)) throw new GatewayError('PROVIDER_UNAVAILABLE', 'Google Places returned an invalid response.');
        return (payload?.places || []).map((item) => normalizeGooglePlace(item, params));
      } catch (error) {
        if (error instanceof GatewayError) throw error;
        if (error?.name === 'AbortError') throw new GatewayError('PROVIDER_TIMEOUT', 'Google Places timed out.');
        throw new GatewayError('PROVIDER_UNAVAILABLE', 'Google Places is unavailable.');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
module.exports = { FIELD_MASK, createGooglePlacesProvider, normalizeGooglePlace };
