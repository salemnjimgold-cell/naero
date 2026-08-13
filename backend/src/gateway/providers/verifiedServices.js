const { GatewayError } = require('../errors');
const { getCategory } = require('../categories');
const { createNearbyCache } = require('../cache');

function normalizeVerifiedService(row) {
  if (!row || row.active === false || row.status && row.status !== 'active'
    || row.verification_status && row.verification_status !== 'approved') return null;
  if (row.verification_expires_at && new Date(row.verification_expires_at).getTime() <= Date.now()) return null;
  return {
    provider: 'naero',
    providerId: row.provider_id || row.id || null,
    name: row.name || null,
    description: row.description || null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: row.address || null,
    city: row.city || null,
    district: row.district || null,
    region: row.region || null,
    postalCode: row.postal_code || null,
    countryCode: row.country_code || null,
    phone: row.phone || null,
    website: row.website || null,
    openingHours: Array.isArray(row.opening_hours) ? row.opening_hours
      : row.opening_hours ? [JSON.stringify(row.opening_hours)] : null,
    isOpenNow: null,
    rating: null,
    reviewCount: null,
    verified: row.verified === true,
    confidence: row.confidence || 'medium',
    lastVerifiedAt: row.last_verified_at || null,
    sourceAttribution: row.source_attribution || 'Naero verified service',
    navigationUrl: row.navigation_url || null,
    providerLinks: Array.isArray(row.provider_links) ? row.provider_links : [],
  };
}

function createVerifiedServicesProvider(env, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const configured = Boolean(env.supabase.url && env.supabase.anonKey);
  const cache = options.cache || createNearbyCache({
    ttlMs: env.gateway.verifiedCacheTtlMs || 21600000,
    staleMs: 0,
  });
  async function attachProviderLinks(rows) {
    if (!env.supabase.serviceRoleKey || !rows.length) return rows;
    const ids = rows.map((row) => row.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (!ids.length) return rows;
    try {
      const response = await fetchImpl(
        `${env.supabase.url}/rest/v1/service_provider_links?service_id=in.(${ids.join(',')})&select=service_id,provider,provider_id`,
        {
          headers: {
            apikey: env.supabase.serviceRoleKey,
            authorization: `Bearer ${env.supabase.serviceRoleKey}`,
            accept: 'application/json',
          },
        },
      );
      if (!response.ok) return rows;
      const links = await response.json();
      if (!Array.isArray(links)) return rows;
      return rows.map((row) => ({
        ...row,
        provider_links: links
          .filter((link) => link.service_id === row.id)
          .map((link) => ({ provider: link.provider, providerId: link.provider_id })),
      }));
    } catch {
      return rows;
    }
  }
  return {
    name: 'naero',
    sourceRole: 'VERIFIED',
    configured,
    mapCategory: getCategory,
    normalizeResult: normalizeVerifiedService,
    clearCache: () => cache.clear(),
    async healthCheck() { return { configured, healthy: configured }; },
    async getPlaceDetails() { throw new GatewayError('PROVIDER_UNAVAILABLE', 'Verified service details are deferred.'); },
    async searchNearby(params) {
      if (!configured) throw new GatewayError('PROVIDER_NOT_CONFIGURED', 'Naero verified services are not configured.');
      const cached = cache.get(params);
      if (cached) return cached.value;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.gateway.providerTimeoutMs);
      try {
        const response = await fetchImpl(`${env.supabase.url}/rest/v1/rpc/nearby_verified_services`, {
          method: 'POST',
          headers: {
            apikey: env.supabase.anonKey,
            authorization: `Bearer ${env.supabase.anonKey}`,
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            p_latitude: params.latitude,
            p_longitude: params.longitude,
            p_radius_meters: params.radius,
            p_category_key: params.category || null,
            p_filter_country_code: params.countryCode || null,
            p_result_limit: params.limit,
            p_language: params.language,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new GatewayError('PROVIDER_UNAVAILABLE', 'Naero verified services are unavailable.');
        const payload = await response.json();
        if (!Array.isArray(payload)) throw new GatewayError('PROVIDER_UNAVAILABLE', 'Naero verified services returned an invalid response.');
        const linkedPayload = await attachProviderLinks(payload);
        const results = linkedPayload.map(normalizeVerifiedService).filter(Boolean);
        cache.set(params, results);
        return results;
      } catch (error) {
        if (error instanceof GatewayError) throw error;
        if (error?.name === 'AbortError') throw new GatewayError('PROVIDER_TIMEOUT', 'Naero verified services timed out.');
        throw new GatewayError('PROVIDER_UNAVAILABLE', 'Naero verified services are unavailable.');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

module.exports = { createVerifiedServicesProvider, normalizeVerifiedService };
