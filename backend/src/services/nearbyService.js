const { GatewayError } = require('../gateway/errors');
const { createNearbyCache } = require('../gateway/cache');
const { normalizeResult, deduplicate, rank } = require('../gateway/nearbyCore');
const { createGooglePlacesProvider } = require('../gateway/providers/googlePlaces');
const { createOverpassProvider } = require('../gateway/providers/overpass');
const { createVerifiedServicesProvider } = require('../gateway/providers/verifiedServices');

function createNearbyService(env, options = {}) {
  const providers = options.providers || [
    createVerifiedServicesProvider(env, options.verifiedOptions || options),
    createGooglePlacesProvider(env, options.googleOptions || options),
    createOverpassProvider(env, options.overpassOptions || options),
  ];
  const cache = options.cache || createNearbyCache(env.gateway.nearbyCache || { ttlMs: 300000, staleMs: 1800000 });
  const circuit = new Map();

  function canCall(provider, now = Date.now()) {
    const state = circuit.get(provider.name);
    return !state || state.failures < 3 || now >= state.openUntil;
  }
  function record(provider, ok, now = Date.now()) {
    if (ok) { circuit.delete(provider.name); return; }
    const state = circuit.get(provider.name) || { failures: 0, openUntil: 0 };
    state.failures += 1;
    if (state.failures >= 3) state.openUntil = now + 30000;
    circuit.set(provider.name, state);
  }

  return {
    providers,
    cache,
    async searchNearby(params) {
      const fresh = cache.get(params);
      if (fresh) return { ...fresh.value, cached: true, stale: false };

      const configured = providers.filter((provider) => provider.configured && canCall(provider));
      if (!configured.length) throw new GatewayError('PROVIDER_NOT_CONFIGURED', 'No nearby provider is configured.');

      const raw = [];
      const failures = [];
      const used = [];
      for (const provider of configured) {
        try {
          const results = await provider.searchNearby(params);
          record(provider, true);
          used.push(provider.name);
          raw.push(...results);
          if (provider.name === 'google' && raw.length >= params.limit) break;
        } catch (error) {
          record(provider, false);
          failures.push(error);
        }
      }

      const normalized = raw
        .map((item) => normalizeResult(item, params))
        .filter((item) => item && !item.permanentlyClosed);
      const items = rank(deduplicate(normalized)).slice(0, params.limit);
      if (items.length || (used.length && failures.length === 0)) {
        const value = {
          items,
          providers: used,
          attributions: [...new Set(items.map((item) => item.sourceAttribution).filter(Boolean))],
          partial: failures.length > 0,
        };
        cache.set(params, value);
        return { ...value, cached: false, stale: false };
      }

      const stale = cache.get(params, { allowStale: true });
      if (stale) return { ...stale.value, cached: true, stale: true, partial: true };
      const timedOut = failures.length && failures.every((error) => error.code === 'PROVIDER_TIMEOUT');
      throw new GatewayError(timedOut ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
        timedOut ? 'All nearby providers timed out.' : 'All nearby providers are unavailable.');
    },
  };
}

module.exports = { createNearbyService };
