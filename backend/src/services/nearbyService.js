const { GatewayError } = require('../gateway/errors');
const { createNearbyCache } = require('../gateway/cache');
const { normalizeResult, deduplicate, rank } = require('../gateway/nearbyCore');
const { createGooglePlacesProvider } = require('../gateway/providers/googlePlaces');
const { createOverpassProvider } = require('../gateway/providers/overpass');
const { createVerifiedServicesProvider } = require('../gateway/providers/verifiedServices');
const { createProviderDiagnostics, safeErrorClass } = require('../gateway/providerDiagnostics');
const { orderProviders, sourceRole, isSufficient, coverageStatus } = require('../gateway/resolverPolicy');

function createNearbyService(env, options = {}) {
  const providers = orderProviders(options.providers || [
    createVerifiedServicesProvider(env, options.verifiedOptions || options),
    createGooglePlacesProvider(env, options.googleOptions || options),
    createOverpassProvider(env, options.overpassOptions || options),
  ]);
  const cache = options.cache || createNearbyCache(env.gateway.nearbyCache || { ttlMs: 300000, staleMs: 1800000 });
  const circuit = new Map();
  const now = options.now || Date.now;

  function callState(provider, currentTime = now()) {
    const state = circuit.get(provider.name);
    return {
      allowed: !state || state.failures < 3 || currentTime >= state.openUntil,
      probe: Boolean(state && state.failures >= 3 && currentTime >= state.openUntil),
    };
  }
  function record(provider, ok, diagnostics, currentTime = now()) {
    const previous = circuit.get(provider.name);
    const previousFailures = previous?.failures || 0;
    if (ok) {
      circuit.delete(provider.name);
      if (previous?.failures >= 3) diagnostics.emit({ provider: provider.name, stage: 'circuit_closed' });
      return;
    }
    const state = circuit.get(provider.name) || { failures: 0, openUntil: 0 };
    state.failures += 1;
    if (state.failures >= 3) {
      state.openUntil = currentTime + 30000;
      diagnostics.emit({ provider: provider.name, stage: 'circuit_open', errorCode: previousFailures >= 3 ? 'CIRCUIT_REOPENED' : 'CIRCUIT_THRESHOLD' });
    }
    circuit.set(provider.name, state);
  }

  return {
    providers,
    cache,
    async searchNearby(params, context = {}) {
      const diagnostics = createProviderDiagnostics(context.requestId, options.providerDiagnosticsLogger);
      const fresh = cache.get(params);
      if (fresh) return {
        ...fresh.value, cached: true, stale: false,
        coverageStatus: fresh.value.coverageStatus || 'sufficient',
        sourcesAttempted: [], sourcesSucceeded: [],
      };

      const configured = [];
      for (const provider of providers) {
        if (!provider.configured) {
          diagnostics.emit({ provider: provider.name, stage: 'provider_failure', errorCode: 'PROVIDER_NOT_CONFIGURED' });
          continue;
        }
        const state = callState(provider);
        if (!state.allowed) {
          diagnostics.emit({ provider: provider.name, stage: 'circuit_open', errorCode: 'CIRCUIT_OPEN' });
          continue;
        }
        if (state.probe) diagnostics.emit({ provider: provider.name, stage: 'circuit_probe' });
        configured.push(provider);
      }
      if (!configured.length) throw new GatewayError('PROVIDER_NOT_CONFIGURED', 'No nearby provider is configured.');

      const raw = [];
      const failures = [];
      const used = [];
      const attempted = [];
      let items = [];
      for (const provider of configured) {
        attempted.push(provider.name);
        const startedAt = now();
        diagnostics.emit({ provider: provider.name, stage: 'provider_start' });
        try {
          const results = await provider.searchNearby(params, { diagnostics });
          const elapsedMs = Math.max(0, now() - startedAt);
          diagnostics.emit({ provider: provider.name, stage: 'provider_success', elapsedMs, resultCount: Array.isArray(results) ? results.length : 0 });
          record(provider, true, diagnostics);
          used.push(provider.name);
          raw.push(...results.map((item) => ({ ...item, sourceRole: sourceRole(provider) })));
          const normalized = raw
            .map((item) => normalizeResult(item, params))
            .filter((item) => item && !item.permanentlyClosed);
          items = rank(deduplicate(normalized)).slice(0, params.limit);
          if (isSufficient(items, params)) break;
        } catch (error) {
          const elapsedMs = Math.max(0, now() - startedAt);
          diagnostics.emit({ provider: provider.name, stage: 'provider_failure', elapsedMs, errorCode: error?.code, errorClass: safeErrorClass(error) });
          record(provider, false, diagnostics);
          failures.push(error);
        }
      }

      if (!items.length && raw.length) {
        const normalized = raw.map((item) => normalizeResult(item, params)).filter((item) => item && !item.permanentlyClosed);
        items = rank(deduplicate(normalized)).slice(0, params.limit);
      }
      if (items.length || (used.length && failures.length === 0)) {
        const value = {
          items,
          providers: used,
          attributions: [...new Set(items.map((item) => item.sourceAttribution).filter(Boolean))],
          partial: failures.length > 0,
          coverageStatus: coverageStatus({ items, params, failures }),
          sourcesAttempted: attempted,
          sourcesSucceeded: used,
        };
        cache.set(params, value);
        return { ...value, cached: false, stale: false };
      }

      const stale = cache.get(params, { allowStale: true });
      if (stale) return {
        ...stale.value, cached: true, stale: true, partial: true, coverageStatus: 'stale',
        sourcesAttempted: attempted, sourcesSucceeded: used,
      };
      const timedOut = failures.length && failures.every((error) => error.code === 'PROVIDER_TIMEOUT');
      throw new GatewayError(timedOut ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
        timedOut ? 'All nearby providers timed out.' : 'All nearby providers are unavailable.');
    },
  };
}

module.exports = { createNearbyService };
