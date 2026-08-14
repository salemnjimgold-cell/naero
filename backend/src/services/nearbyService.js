const { GatewayError } = require('../gateway/errors');
const { createNearbyCache, cacheDimensions } = require('../gateway/cache');
const { normalizeResult, deduplicate, rank } = require('../gateway/nearbyCore');
const { createGooglePlacesProvider } = require('../gateway/providers/googlePlaces');
const { createGeoapifyProvider } = require('../gateway/providers/geoapify');
const { createOverpassProvider } = require('../gateway/providers/overpass');
const { createVerifiedServicesProvider } = require('../gateway/providers/verifiedServices');
const { createProviderDiagnostics, safeErrorClass } = require('../gateway/providerDiagnostics');
const { orderProviders, sourceRole, isSufficient, coverageStatus } = require('../gateway/resolverPolicy');

const CACHE_RESULT_CAPACITY = 50;

function usableResults(raw, params, capacity = params.limit) {
  const normalized = raw
    .map((item) => normalizeResult(item, params))
    .filter((item) => item && !item.permanentlyClosed);
  return rank(deduplicate(normalized)).slice(0, capacity);
}

function cachePlan(params) {
  const dimensions = cacheDimensions(params);
  if (!dimensions.radiusBucket) return { cacheable: false, providerParams: { ...params, limit: CACHE_RESULT_CAPACITY } };
  return {
    cacheable: true,
    providerParams: {
      ...params,
      latitude: dimensions.cell.centerLatitude,
      longitude: dimensions.cell.centerLongitude,
      radius: dimensions.radiusBucket,
      limit: CACHE_RESULT_CAPACITY,
    },
  };
}

function cachedResponse(entry, params, { stale = false, attempted = [], succeeded = [] } = {}) {
  const raw = entry.value.raw || entry.value.items || [];
  const allUsable = usableResults(raw, params, CACHE_RESULT_CAPACITY);
  const items = allUsable.slice(0, params.limit);
  if (!stale && !entry.value.coverageComplete && items.length < params.limit) return null;
  return {
    items,
    providers: entry.value.providers || [],
    attributions: [...new Set(items.map((item) => item.sourceAttribution).filter(Boolean))],
    cached: true,
    stale,
    partial: stale ? true : Boolean(entry.value.partial),
    coverageStatus: stale ? 'stale' : coverageStatus({ items, params, failures: entry.value.partial ? [{}] : [] }),
    sourcesAttempted: attempted,
    sourcesSucceeded: succeeded,
  };
}

function createNearbyService(env, options = {}) {
  const providers = orderProviders(options.providers || [
    createVerifiedServicesProvider(env, options.verifiedOptions || options),
    createGeoapifyProvider(env, options.geoapifyOptions || options),
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
      const plan = cachePlan(params);
      const fresh = plan.cacheable ? cache.get(params) : null;
      const freshResponse = fresh && cachedResponse(fresh, params);
      if (freshResponse) return freshResponse;

      const configured = [];
      for (const provider of providers) {
        if (!provider.configured) {
          diagnostics.emit({ provider: provider.name, stage: 'provider_failure', errorCode: 'PROVIDER_NOT_CONFIGURED' });
          continue;
        }
        if (typeof provider.supportsCategory === 'function' && !provider.supportsCategory(params.category)) {
          diagnostics.emit({ provider: provider.name, stage: 'provider_failure', errorCode: 'PROVIDER_CATEGORY_UNSUPPORTED' });
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
      let completedProviders = 0;
      for (const provider of configured) {
        attempted.push(provider.name);
        const startedAt = now();
        diagnostics.emit({ provider: provider.name, stage: 'provider_start' });
        try {
          const results = await provider.searchNearby(plan.providerParams, { diagnostics });
          const elapsedMs = Math.max(0, now() - startedAt);
          diagnostics.emit({ provider: provider.name, stage: 'provider_success', elapsedMs, resultCount: Array.isArray(results) ? results.length : 0 });
          record(provider, true, diagnostics);
          used.push(provider.name);
          const fetchedAt = new Date(startedAt).toISOString();
          raw.push(...results.map((item) => ({
            ...item,
            fetchedAt: item.fetchedAt || fetchedAt,
            sourceRole: sourceRole(provider),
          })));
          items = usableResults(raw, params, CACHE_RESULT_CAPACITY);
          completedProviders += 1;
          if (isSufficient(items.slice(0, params.limit), params)) break;
        } catch (error) {
          const elapsedMs = Math.max(0, now() - startedAt);
          diagnostics.emit({ provider: provider.name, stage: 'provider_failure', elapsedMs, errorCode: error?.code, errorClass: safeErrorClass(error) });
          record(provider, false, diagnostics);
          failures.push(error);
          completedProviders += 1;
        }
      }

      if (!items.length && raw.length) {
        items = usableResults(raw, params, CACHE_RESULT_CAPACITY);
      }
      if (items.length || (used.length && failures.length === 0)) {
        const responseItems = items.slice(0, params.limit);
        const value = {
          raw,
          coverageComplete: completedProviders === configured.length || items.length >= CACHE_RESULT_CAPACITY,
          storedCapacity: CACHE_RESULT_CAPACITY,
          providers: used,
          partial: failures.length > 0,
        };
        if (plan.cacheable) cache.set(params, value);
        return {
          items: responseItems,
          providers: used,
          attributions: [...new Set(responseItems.map((item) => item.sourceAttribution).filter(Boolean))],
          partial: failures.length > 0,
          coverageStatus: coverageStatus({ items: responseItems, params, failures }),
          sourcesAttempted: attempted,
          sourcesSucceeded: used,
          cached: false,
          stale: false,
        };
      }

      const stale = plan.cacheable ? cache.get(params, { allowStale: true }) : null;
      const staleResponse = stale && cachedResponse(stale, params, { stale: true, attempted, succeeded: used });
      if (staleResponse?.items.length) return staleResponse;
      const timedOut = failures.length && failures.every((error) => error.code === 'PROVIDER_TIMEOUT');
      throw new GatewayError(timedOut ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
        timedOut ? 'All nearby providers timed out.' : 'All nearby providers are unavailable.');
    },
  };
}

module.exports = { CACHE_RESULT_CAPACITY, cachePlan, createNearbyService, usableResults };
