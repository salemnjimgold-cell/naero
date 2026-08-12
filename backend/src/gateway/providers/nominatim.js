const { GatewayError } = require('../errors');

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeNominatim(payload, input, now = new Date()) {
  const address = payload?.address || {};
  return {
    latitude: input.latitude,
    longitude: input.longitude,
    country: text(address.country),
    countryCode: text(address.country_code)?.toUpperCase() || null,
    region: text(address.state || address.region || address.county),
    city: text(address.city || address.town || address.village || address.municipality),
    district: text(address.city_district || address.suburb || address.district),
    postalCode: text(address.postcode),
    provider: 'nominatim',
    fetchedAt: now.toISOString(),
  };
}

function createNominatimProvider(env, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  return {
    name: 'nominatim',
    configured: Boolean(env.providers.nominatimBaseUrl),
    async reverseGeocode(input) {
      if (!this.configured) throw new GatewayError('PROVIDER_NOT_CONFIGURED', 'Reverse-geocoding provider is not configured.');
      const url = new URL('/reverse', env.providers.nominatimBaseUrl);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('lat', String(input.latitude));
      url.searchParams.set('lon', String(input.longitude));
      url.searchParams.set('accept-language', input.language);
      if (input.countryCode) url.searchParams.set('countrycodes', input.countryCode.toLowerCase());

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.gateway.providerTimeoutMs);
      try {
        const response = await fetchImpl(url, {
          headers: { accept: 'application/json', 'user-agent': 'Naero/1.2 backend-gateway' },
          signal: controller.signal,
        });
        if (response.status === 404) throw new GatewayError('LOCATION_NOT_FOUND', 'No address was found for these coordinates.');
        if (!response.ok) throw new GatewayError('PROVIDER_UNAVAILABLE', 'The reverse-geocoding provider is unavailable.');
        return normalizeNominatim(await response.json(), input);
      } catch (error) {
        if (error instanceof GatewayError) throw error;
        if (error?.name === 'AbortError') throw new GatewayError('PROVIDER_TIMEOUT', 'The reverse-geocoding provider timed out.');
        throw new GatewayError('PROVIDER_UNAVAILABLE', 'The reverse-geocoding provider is unavailable.');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

module.exports = { createNominatimProvider, normalizeNominatim };
