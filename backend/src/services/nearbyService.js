const { GatewayError } = require('../gateway/errors');
const { createNearbyCache, cacheDimensions } = require('../gateway/cache');
const { normalizeResult, deduplicate, rank } = require('../gateway/nearbyCore');
const { createGooglePlacesProvider } = require('../gateway/providers/googlePlaces');
const { createGeoapifyProvider } = require('../gateway/providers/geoapify');
const { createOverpassProvider } = require('../gateway/providers/overpass');
const { createVerifiedServicesProvider } = require('../gateway/providers/verifiedServices');
const { createDiscoveredPlacesProvider } = require('../gateway/providers/discoveredPlaces');
const { createProviderDiagnostics, safeErrorClass } = require('../gateway/providerDiagnostics');
const { orderProviders, sourceRole, isSufficient, coverageStatus } = require('../gateway/resolverPolicy');
const { COVERAGE_STATES, coverageDecision, refreshOutcome } = require('../gateway/coverageLifecycle');

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
    createDiscoveredPlacesProvider(env, options.discoveredOptions || options),
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

      const discoveredProvider = providers.find((provider) => sourceRole(provider) === 'DISCOVERED');
      let lifecycleState = { state: COVERAGE_STATES.UNSEEN };
      if (discoveredProvider?.coverageEnabled) {
        try {
          lifecycleState = await discoveredProvider.readCoverage(plan.providerParams);
          diagnostics.emit({ provider: 'discovered', stage: 'coverage_read', coverageState: lifecycleState.state });
        } catch (error) {
          diagnostics.emit({ provider: 'discovered', stage: 'coverage_failure',
            errorCode: 'COVERAGE_READ_FAILED', errorClass: safeErrorClass(error) });
          lifecycleState = { state: COVERAGE_STATES.UNSEEN };
        }
      }

      const configured = [];
      let liveCoverageBlocked = false;
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
          if (sourceRole(provider) === 'LIVE') liveCoverageBlocked = true;
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
      const liveAttempted = [];
      const liveSucceeded = [];
      let liveFailures = 0;
      let refreshClaimed = false;
      let refreshClaimToken = null;
      let lifecycleDecisionMade = false;
      let liveSuppressed = false;
      let lifecycleResponseStatus = null;
      let items = [];
      let completedProviders = 0;
      for (const provider of configured) {
        if (sourceRole(provider) === 'LIVE' && !lifecycleDecisionMade) {
          lifecycleDecisionMade = true;
          if (discoveredProvider?.coverageEnabled) {
            const decision = coverageDecision(lifecycleState, {
              demandRefreshEnabled: discoveredProvider.demandRefreshEnabled === true,
              availableCount: items.length,
            });
            diagnostics.emit({ provider: 'discovered', stage: 'coverage_decision',
              coverageState: decision.state, liveSuppressed: decision.action !== 'continue' && decision.action !== 'claim_refresh' });
            if (!failures.length && ['suppress_live', 'await_existing', 'backoff'].includes(decision.action)) {
              liveSuppressed = true;
              lifecycleResponseStatus = decision.action === 'suppress_live' ? 'exhausted' : 'partial';
              break;
            }
            if (decision.action === 'claim_refresh') {
              try {
                const claim = await discoveredProvider.claimRefresh(plan.providerParams);
                refreshClaimed = claim.claimed === true;
                refreshClaimToken = refreshClaimed && typeof claim.claimToken === 'string' ? claim.claimToken : null;
                if (refreshClaimed && !refreshClaimToken) {
                  throw new GatewayError('PERSISTENCE_FAILED', 'Coverage refresh claim was invalid.');
                }
                diagnostics.emit({ provider: 'discovered', stage: 'refresh_claim',
                  coverageState: refreshClaimed ? COVERAGE_STATES.REFRESHING : lifecycleState.state,
                  claimOutcome: refreshClaimed ? 'acquired' : 'contended' });
                if (!refreshClaimed) {
                  liveSuppressed = true;
                  lifecycleResponseStatus = 'partial';
                  break;
                }
              } catch (error) {
                diagnostics.emit({ provider: 'discovered', stage: 'coverage_failure',
                  errorCode: 'REFRESH_CLAIM_FAILED', errorClass: safeErrorClass(error) });
                // Coverage intelligence must fail toward the existing live path.
              }
            }
          }
        }
        attempted.push(provider.name);
        if (sourceRole(provider) === 'LIVE') liveAttempted.push(provider.name);
        const startedAt = now();
        diagnostics.emit({ provider: provider.name, stage: 'provider_start' });
        try {
          const results = await provider.searchNearby(plan.providerParams, { diagnostics });
          const elapsedMs = Math.max(0, now() - startedAt);
          diagnostics.emit({ provider: provider.name, stage: 'provider_success', elapsedMs, resultCount: Array.isArray(results) ? results.length : 0 });
          record(provider, true, diagnostics);
          used.push(provider.name);
          if (sourceRole(provider) === 'LIVE') liveSucceeded.push(provider.name);
          const fetchedAt = new Date(startedAt).toISOString();
          raw.push(...results.map((item) => ({
            ...item,
            fetchedAt: item.fetchedAt || fetchedAt,
            sourceRole: sourceRole(provider),
          })));
          if (sourceRole(provider) === 'LIVE') {
            const discovered = providers.find((candidate) => sourceRole(candidate) === 'DISCOVERED');
            if (discovered?.persistenceEnabled) {
              try { await discovered.persist(results, plan.providerParams); }
              catch (error) {
                diagnostics.emit({ provider: 'discovered', stage: 'provider_failure',
                  errorCode: 'PERSISTENCE_FAILED', errorClass: safeErrorClass(error) });
              }
            }
          }
          items = usableResults(raw, params, CACHE_RESULT_CAPACITY);
          completedProviders += 1;
          if (isSufficient(items.slice(0, params.limit), params)) break;
        } catch (error) {
          const elapsedMs = Math.max(0, now() - startedAt);
          diagnostics.emit({ provider: provider.name, stage: 'provider_failure', elapsedMs, errorCode: error?.code, errorClass: safeErrorClass(error) });
          record(provider, false, diagnostics);
          failures.push(error);
          if (sourceRole(provider) === 'LIVE') liveFailures += 1;
          completedProviders += 1;
        }
      }

      if (refreshClaimed) {
        const applicableLiveCount = configured.filter((provider) => sourceRole(provider) === 'LIVE').length;
        const outcome = refreshOutcome({ items, limit: params.limit, liveAttempted, liveSucceeded, liveFailures: failures.length,
          chainComplete: !liveCoverageBlocked && failures.length === liveFailures
            && liveAttempted.length === applicableLiveCount });
        try {
          if (liveFailures > 0 && liveSucceeded.length === 0) {
            await discoveredProvider.failRefresh(plan.providerParams, {
              claimToken: refreshClaimToken, failureCode: 'LIVE_PROVIDER_FAILURE', providersAttempted: liveAttempted,
              providersSucceeded: liveSucceeded,
            });
            diagnostics.emit({ provider: 'discovered', stage: 'coverage_failure',
              coverageState: COVERAGE_STATES.REFRESH_FAILED, errorCode: 'LIVE_PROVIDER_FAILURE' });
          } else {
            await discoveredProvider.completeRefresh(plan.providerParams, { ...outcome, claimToken: refreshClaimToken });
            diagnostics.emit({ provider: 'discovered', stage: 'coverage_complete',
              coverageState: outcome.status, resultCount: outcome.resultCount,
              coverageComplete: outcome.coverageComplete });
          }
        } catch (error) {
          diagnostics.emit({ provider: 'discovered', stage: 'coverage_failure',
            errorCode: 'COVERAGE_WRITE_FAILED', errorClass: safeErrorClass(error) });
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
          partial: failures.length > 0 || lifecycleResponseStatus === 'partial',
        };
        if (plan.cacheable) cache.set(params, value);
        return {
          items: responseItems,
          providers: used,
          attributions: [...new Set(responseItems.map((item) => item.sourceAttribution).filter(Boolean))],
          partial: failures.length > 0 || lifecycleResponseStatus === 'partial',
          coverageStatus: lifecycleResponseStatus || coverageStatus({ items: responseItems, params, failures }),
          sourcesAttempted: attempted,
          sourcesSucceeded: used,
          cached: false,
          stale: false,
          liveSuppressed,
        };
      }

      const stale = plan.cacheable ? cache.get(params, { allowStale: true }) : null;
      const staleResponse = stale && cachedResponse(stale, params, { stale: true, attempted, succeeded: used });
      if (staleResponse?.items.length) return staleResponse;
      const discovered = providers.find((provider) => sourceRole(provider) === 'DISCOVERED'
        && provider.configured && typeof provider.searchStale === 'function');
      if (discovered) {
        try {
          const staleItems = usableResults(await discovered.searchStale(plan.providerParams), params,
            CACHE_RESULT_CAPACITY).slice(0, params.limit);
          if (staleItems.length) return { items: staleItems, providers: ['discovered'],
            attributions: [...new Set(staleItems.map((item) => item.sourceAttribution).filter(Boolean))],
            cached: false, stale: true, partial: true, coverageStatus: 'stale',
            sourcesAttempted: attempted, sourcesSucceeded: used };
        } catch { /* Preserve the primary safe provider failure. */ }
      }
      const timedOut = failures.length && failures.every((error) => error.code === 'PROVIDER_TIMEOUT');
      throw new GatewayError(timedOut ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
        timedOut ? 'All nearby providers timed out.' : 'All nearby providers are unavailable.');
    },
  };
}

module.exports = { CACHE_RESULT_CAPACITY, cachePlan, createNearbyService, usableResults };
