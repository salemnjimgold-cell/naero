const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { readEnv } = require('../backend/src/config/env');
const { createNearbyService } = require('../backend/src/services/nearbyService');
const { createGeoapifyProvider } = require('../backend/src/gateway/providers/geoapify');
const { createGooglePlacesProvider } = require('../backend/src/gateway/providers/googlePlaces');
const { createOverpassProvider } = require('../backend/src/gateway/providers/overpass');
const {
  COUNTERS, MAX_INCREMENT, createOperationalMetrics, metricDimensions, operationalRegion, rpcBody,
} = require('../backend/src/gateway/operationalMetrics');

const migration = fs.readFileSync(path.resolve(__dirname,
  '../backend/db/migrations/008_discovery_operational_intelligence.sql'), 'utf8');
const rollback = fs.readFileSync(path.resolve(__dirname,
  '../backend/db/rollbacks/008_discovery_operational_intelligence.rollback.sql'), 'utf8');
const metricsSource = fs.readFileSync(path.resolve(__dirname,
  '../backend/src/gateway/operationalMetrics.js'), 'utf8');
const params = { latitude: 48.2082, longitude: 16.3738, radius: 15000,
  limit: 2, category: 'hospital', countryCode: 'AT', language: 'en' };
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function env(overrides = {}) {
  return { gateway: { providerTimeoutMs: 50, operationalMetricsEnabled: true,
    operationalMetricsPersistenceEnabled: false, nearbyCache: { ttlMs: 300000, staleMs: 1800000 }, ...overrides },
  supabase: { url: '', serviceRoleKey: '' } };
}
function result(id, latitude = 48.2083) {
  return { provider: 'geoapify', providerId: id, name: `Hospital ${id}`, latitude,
    longitude: 16.3738, countryCode: 'AT', sourceAttribution: 'Fixture' };
}

test('flags default off and persistence cannot enable collection', () => {
  const defaults = readEnv({ NAERO_ENV_FILE: 'missing-lde5-test-env' });
  assert.equal(defaults.gateway.operationalMetricsEnabled, false);
  assert.equal(defaults.gateway.operationalMetricsPersistenceEnabled, false);
  const persistenceOnly = readEnv({ NAERO_ENV_FILE: 'missing-lde5-test-env',
    DISCOVERY_OPERATIONAL_METRICS_PERSISTENCE_ENABLED: 'true' });
  assert.equal(persistenceOnly.gateway.operationalMetricsEnabled, false);
  assert.equal(persistenceOnly.gateway.operationalMetricsPersistenceEnabled, false);
});

test('coarse region aggregates nearby coordinates and differs from fine discovery identity', () => {
  const first = operationalRegion(48.2082, 16.3738);
  const nearby = operationalRegion(48.2090, 16.3745);
  assert.equal(first, nearby);
  assert.match(first, /^op5-v1:\d+:\d+:\d+$/);
  assert.doesNotMatch(first, /48|16\.37/);
  assert.ok(!first.startsWith('nearby-v2'));
});

test('coarse region safely handles hemispheres, wrap, poles and invalid coordinates', () => {
  for (const [latitude, longitude] of [[45, 45], [-45, -45], [0, 179.999], [0, -180], [89.999, 10], [-89.999, -10]]) {
    assert.match(operationalRegion(latitude, longitude), /^op5-v1:\d+:\d+:\d+$/);
  }
  assert.match(operationalRegion(0, 180), /^op5-v1:\d+:\d+:\d+$/);
  assert.match(operationalRegion(0, -180), /^op5-v1:\d+:\d+:\d+$/);
  for (const pair of [[Infinity, 0], [NaN, 0], [91, 0], [0, 181], [0, -181]]) {
    assert.equal(operationalRegion(...pair), null);
  }
});

test('persisted dimensions contain only bounded aggregate identity', () => {
  const dimensions = metricDimensions({ ...params, userId: 'user-private', requestId: 'request-private',
    deviceId: 'device-private', ipAddress: '192.0.2.1', providerUrl: 'https://secret.invalid' },
  Date.parse('2026-08-23T12:00:00Z'));
  assert.deepEqual(Object.keys(dimensions).sort(),
    ['category', 'countryCode', 'metricDate', 'operationalRegion', 'radiusBucket'].sort());
  const serialized = JSON.stringify(dimensions);
  assert.doesNotMatch(serialized, /latitude|longitude|user|request|device|session|ipAddress|https|48\.2082|16\.3738/i);
});

test('invalid dimensions and unknown counters fail closed without side effects', () => {
  const metrics = createOperationalMetrics(env());
  assert.equal(metrics.increment({ ...params, countryCode: 'INVALID' }, 'nearbyRequests'), false);
  assert.equal(metrics.increment(params, 'arbitraryUnsafeCounter'), false);
  assert.equal(metrics.snapshot().length, 0);
  metrics.close();
});

test('aggregation is immediate, bounded, saturating and contains no events', () => {
  const metrics = createOperationalMetrics(env(), { maxKeys: 1 });
  metrics.increment(params, 'nearbyRequests', MAX_INCREMENT);
  metrics.increment(params, 'nearbyRequests', MAX_INCREMENT);
  assert.equal(metrics.snapshot()[0].nearbyRequests, MAX_INCREMENT);
  assert.equal(metrics.increment({ ...params, countryCode: 'HU' }, 'nearbyRequests'), false);
  assert.deepEqual(metrics.stats(), { keys: 1, droppedKeys: 1, flushing: false });
  assert.equal(metrics.snapshot().length, 1);
  metrics.close();
});

test('RPC body is an explicit allowlist and hostile properties cannot leak', () => {
  const metrics = createOperationalMetrics(env());
  metrics.increment(params, 'nearbyRequests');
  const entry = { ...metrics.snapshot()[0], latitude: 48.2, longitude: 16.3,
    userId: 'user-private', token: 'token-private', url: 'https://secret.invalid', body: 'raw-private' };
  const body = rpcBody(entry);
  assert.equal(Object.keys(body).length, COUNTERS.length + 5);
  assert.doesNotMatch(JSON.stringify(body), /latitude|longitude|user|token|url|body|private|48\.2|16\.3/i);
  metrics.close();
});

test('collection-only mode performs zero database writes', async () => {
  let calls = 0;
  const metrics = createOperationalMetrics(env(), { fetchImpl: async () => { calls += 1; return { ok: true }; } });
  metrics.increment(params, 'nearbyRequests');
  assert.deepEqual(await metrics.flush(), { flushed: 0, failed: 0 });
  assert.equal(calls, 0);
  metrics.close();
});

test('persistence failure drops telemetry and never throws into nearby flow', async () => {
  const persistentEnv = env({ operationalMetricsPersistenceEnabled: true });
  persistentEnv.supabase = { url: 'https://project.invalid', serviceRoleKey: 'runtime-secret' };
  const metrics = createOperationalMetrics(persistentEnv, { fetchImpl: async () => { throw new TypeError('network'); } });
  metrics.increment(params, 'nearbyRequests');
  assert.deepEqual(await metrics.flush(), { flushed: 0, failed: 1 });
  assert.equal(metrics.snapshot().length, 0);
  metrics.close();
});

test('nearby observation records existing provider decisions without changing response', async () => {
  const metrics = createOperationalMetrics(env());
  let calls = 0;
  const geoapify = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async (_params, context) => { calls += 1; context.onUpstreamAttempt('geoapify');
      return [result('one'), result('two', 48.2084)]; } };
  const service = createNearbyService(env(), { providers: [geoapify], operationalMetrics: metrics });
  const first = await service.searchNearby(params);
  const second = await service.searchNearby(params);
  assert.equal(first.items.length, 2);
  assert.deepEqual(second.items.map((item) => item.providerId), first.items.map((item) => item.providerId));
  assert.equal(calls, 1);
  const aggregate = metrics.snapshot()[0];
  assert.equal(aggregate.nearbyRequests, 2);
  assert.equal(aggregate.geoapifyAttempts, 1);
  assert.equal(aggregate.geoapifySuccesses, 1);
  assert.equal(aggregate.geoapifyYield, 2);
  assert.equal(aggregate.l1FreshHits, 1);
  metrics.close();
});

test('persistent discovered sufficiency is measured and live provider stays suppressed', async () => {
  const metrics = createOperationalMetrics(env());
  let liveCalls = 0;
  const discovered = { name: 'discovered', sourceRole: 'DISCOVERED', configured: true,
    coverageEnabled: false, searchNearby: async () => [
      { ...result('d1'), provider: 'geoapify', sourceRole: 'DISCOVERED' },
      { ...result('d2', 48.2084), provider: 'geoapify', sourceRole: 'DISCOVERED' },
    ] };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async (_params, context) => { liveCalls += 1; context.onUpstreamAttempt('geoapify'); return []; } };
  const response = await createNearbyService(env(), { providers: [discovered, live],
    operationalMetrics: metrics }).searchNearby(params);
  assert.equal(response.items.length, 2);
  assert.equal(liveCalls, 0);
  assert.equal(metrics.snapshot()[0].l2SufficientResponses, 1);
  metrics.close();
});

test('LDE-4 claim acquisition, completion, contention and live empty outcomes are observed', async () => {
  const metrics = createOperationalMetrics(env());
  let claimed = true;
  const discovered = { name: 'discovered', sourceRole: 'DISCOVERED', configured: true,
    coverageEnabled: true, demandRefreshEnabled: true,
    readCoverage: async () => ({ state: 'UNSEEN' }),
    claimRefresh: async () => ({ claimed, claimToken: claimed ? '00000000-0000-4000-8000-000000000001' : null }),
    completeRefresh: async () => ({ state: 'EXHAUSTED' }), failRefresh: async () => ({ state: 'REFRESH_FAILED' }),
    searchNearby: async () => [] };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async (_params, context) => { context.onUpstreamAttempt('geoapify'); return []; } };
  const service = createNearbyService(env(), { providers: [discovered, live], operationalMetrics: metrics });
  const first = await service.searchNearby(params);
  assert.equal(first.coverageStatus, 'exhausted');
  service.cache.clear();
  claimed = false;
  const second = await service.searchNearby(params);
  assert.equal(second.partial, true);
  const aggregate = metrics.snapshot()[0];
  assert.equal(aggregate.refreshClaimsAcquired, 1);
  assert.equal(aggregate.refreshCompletions, 1);
  assert.equal(aggregate.refreshClaimsContended, 1);
  assert.equal(aggregate.geoapifyAttempts, 1);
  assert.equal(aggregate.geoapifyEmptyResults, 1);
  assert.equal(aggregate.exhaustedResponses, 1);
  assert.equal(aggregate.partialResponses, 1);
  metrics.close();
});

test('await-existing, backoff and valid-coverage suppression remain distinct', async () => {
  const cases = [
    [{ state: 'REFRESHING' }, 'refreshAwaitExistingSuppressions'],
    [{ state: 'REFRESH_FAILED' }, 'refreshBackoffSuppressions'],
    [{ state: 'EXHAUSTED', coverageComplete: true, resultCount: 0 }, 'coverageLiveSuppressions'],
  ];
  for (const [coverageState, intendedCounter] of cases) {
    const metrics = createOperationalMetrics(env());
    let liveCalls = 0;
    const discovered = { name: 'discovered', sourceRole: 'DISCOVERED', configured: true,
      coverageEnabled: true, demandRefreshEnabled: true, readCoverage: async () => coverageState,
      searchNearby: async () => [] };
    const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
      searchNearby: async () => { liveCalls += 1; return []; } };
    const response = await createNearbyService(env(), { providers: [discovered, live],
      operationalMetrics: metrics }).searchNearby(params);
    assert.equal(liveCalls, 0);
    assert.equal(response.liveSuppressed, true);
    const aggregate = metrics.snapshot()[0];
    for (const counter of ['refreshAwaitExistingSuppressions', 'refreshBackoffSuppressions', 'coverageLiveSuppressions']) {
      assert.equal(aggregate[counter], counter === intendedCounter ? 1 : 0);
    }
    assert.equal(aggregate.refreshClaimsContended, 0);
    metrics.close();
  }
});

test('live provider and refresh failure counters observe existing failure handling', async () => {
  const metrics = createOperationalMetrics(env());
  const discovered = { name: 'discovered', sourceRole: 'DISCOVERED', configured: true,
    coverageEnabled: true, demandRefreshEnabled: true,
    readCoverage: async () => ({ state: 'UNSEEN' }),
    claimRefresh: async () => ({ claimed: true, claimToken: '00000000-0000-4000-8000-000000000002' }),
    failRefresh: async () => ({ state: 'REFRESH_FAILED' }), searchNearby: async () => [] };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async (_params, context) => { context.onUpstreamAttempt('geoapify');
      throw Object.assign(new Error('fixture'), { code: 'PROVIDER_UNAVAILABLE' }); } };
  await assert.rejects(() => createNearbyService(env(), { providers: [discovered, live],
    operationalMetrics: metrics }).searchNearby(params));
  const aggregate = metrics.snapshot()[0];
  assert.equal(aggregate.geoapifyAttempts, 1);
  assert.equal(aggregate.geoapifyFailures, 1);
  assert.equal(aggregate.refreshFailures, 1);
  metrics.close();
});

function osmPayload() {
  return { elements: [{ type: 'node', id: 1, lat: 48.2083, lon: 16.3738,
    tags: { name: 'OSM Hospital', amenity: 'hospital', 'addr:country': 'AT' } }] };
}
function response(status, payload = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}
function providerEnv(provider, metricsEnabled = true) {
  return { gateway: { providerTimeoutMs: 100, operationalMetricsEnabled: metricsEnabled,
    operationalMetricsPersistenceEnabled: false, nearbyCache: { ttlMs: 300000, staleMs: 1800000 } },
  providers: { geoapifyApiKey: provider === 'geoapify' ? 'test-placeholder' : '',
    googlePlacesApiKey: provider === 'google' ? 'test-placeholder' : '',
    overpassApiUrl: provider === 'osm' ? 'https://overpass.test.invalid/api/interpreter' : '' },
  supabase: { url: '', serviceRoleKey: '' } };
}
async function runOsmSequence(statuses) {
  const metricsEnv = providerEnv('osm');
  const metrics = createOperationalMetrics(metricsEnv);
  let fetches = 0;
  const provider = createOverpassProvider(metricsEnv, { sleep: async () => {}, fetchImpl: async () => {
    const status = statuses[fetches++]; return response(status, status === 200 ? osmPayload() : {});
  } });
  const service = createNearbyService(metricsEnv, { providers: [provider], operationalMetrics: metrics });
  let outcome;
  try { outcome = await service.searchNearby(params); } catch (error) { outcome = error; }
  return { metrics, aggregate: metrics.snapshot()[0], fetches, outcome };
}

test('OSM no-retry request counts one attempt and one final success', async () => {
  const run = await runOsmSequence([200]);
  assert.equal(run.fetches, 1); assert.equal(run.aggregate.osmAttempts, 1);
  assert.equal(run.aggregate.osmSuccesses, 1); assert.equal(run.aggregate.osmFailures, 0);
  assert.equal(run.aggregate.osmYield, 1); run.metrics.close();
});
for (const retryStatus of [500, 429]) {
  test(`OSM ${retryStatus} retry counts two attempts and one final success`, async () => {
    const run = await runOsmSequence([retryStatus, 200]);
    assert.equal(run.fetches, 2); assert.equal(run.aggregate.osmAttempts, 2);
    assert.equal(run.aggregate.osmSuccesses, 1); assert.equal(run.aggregate.osmFailures, 0);
    assert.equal(run.aggregate.osmYield, 1); run.metrics.close();
  });
}
test('OSM final failure after retry counts two attempts and one final failure', async () => {
  const run = await runOsmSequence([500, 503]);
  assert.equal(run.fetches, 2); assert.equal(run.aggregate.osmAttempts, 2);
  assert.equal(run.aggregate.osmSuccesses, 0); assert.equal(run.aggregate.osmFailures, 1);
  assert.equal(run.aggregate.osmYield, 0); assert.equal(run.outcome.code, 'PROVIDER_UNAVAILABLE'); run.metrics.close();
});

test('Geoapify and Google each count exactly one actual fetch attempt', async () => {
  const cases = [
    ['geoapify', createGeoapifyProvider, { type: 'FeatureCollection', features: [] }],
    ['google', createGooglePlacesProvider, { places: [] }],
  ];
  for (const [name, factory, payload] of cases) {
    const metricsEnv = providerEnv(name);
    const metrics = createOperationalMetrics(metricsEnv);
    let fetches = 0;
    const provider = factory(metricsEnv, { fetchImpl: async () => { fetches += 1; return response(200, payload); } });
    const resultValue = await createNearbyService(metricsEnv, { providers: [provider], operationalMetrics: metrics }).searchNearby(params);
    assert.equal(fetches, 1); assert.equal(metrics.snapshot()[0][`${name}Attempts`], 1);
    assert.equal(metrics.snapshot()[0][`${name}EmptyResults`], 1); assert.equal(resultValue.items.length, 0);
    metrics.close();
  }
});

async function runOutcomeCase(resultOrError) {
  const metricsEnv = providerEnv('geoapify');
  const metrics = createOperationalMetrics(metricsEnv);
  const provider = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async (_params, context) => {
      context.onUpstreamAttempt('geoapify');
      if (resultOrError instanceof Error) throw resultOrError;
      return resultOrError;
    } };
  let outcome;
  try {
    outcome = await createNearbyService(metricsEnv, { providers: [provider], operationalMetrics: metrics,
      providerDiagnosticsLogger: () => {} }).searchNearby(params);
  } catch (error) { outcome = error; }
  const aggregate = metrics.snapshot()[0];
  const finalOutcomes = aggregate.geoapifySuccesses + aggregate.geoapifyEmptyResults + aggregate.geoapifyFailures;
  return { metrics, aggregate, finalOutcomes, outcome };
}

test('provider final outcomes are mutually exclusive for valid, malformed and failed results', async () => {
  const processingFailure = {};
  Object.defineProperty(processingFailure, 'name', { enumerable: true, get() { throw new Error('processing fixture'); } });
  const cases = [
    [[result('valid')], 'success', 1],
    [[], 'empty', 0],
    [null, 'failure', 0],
    [undefined, 'failure', 0],
    [{}, 'failure', 0],
    [{ length: 0 }, 'failure', 0],
    ['not-an-array', 'failure', 0],
    [42, 'failure', 0],
    [new Set(), 'failure', 0],
    [[processingFailure], 'failure', 0],
    [new Error('provider fixture'), 'failure', 0],
  ];
  for (const [providerResult, expected, expectedYield] of cases) {
    const run = await runOutcomeCase(providerResult);
    assert.equal(run.aggregate.geoapifyAttempts, 1);
    assert.equal(run.finalOutcomes, 1);
    assert.equal(run.aggregate.geoapifySuccesses, expected === 'success' ? 1 : 0);
    assert.equal(run.aggregate.geoapifyEmptyResults, expected === 'empty' ? 1 : 0);
    assert.equal(run.aggregate.geoapifyFailures, expected === 'failure' ? 1 : 0);
    assert.equal(run.aggregate.geoapifyYield, expectedYield);
    run.metrics.close();
  }
});

test('metrics instrumentation does not amplify provider traffic and callback failure is isolated', async () => {
  async function execute(metricsEnabled, injectedMetrics = null) {
    const metricsEnv = providerEnv('geoapify', metricsEnabled);
    let fetches = 0;
    const provider = createGeoapifyProvider(metricsEnv, { fetchImpl: async () => {
      fetches += 1; return response(200, { type: 'FeatureCollection', features: [] });
    } });
    const service = createNearbyService(metricsEnv, { providers: [provider],
      ...(injectedMetrics ? { operationalMetrics: injectedMetrics } : {}) });
    const resultValue = await service.searchNearby(params);
    service.operationalMetrics.close?.();
    return { fetches, resultValue };
  }
  const disabled = await execute(false);
  const enabled = await execute(true);
  assert.equal(disabled.fetches, 1); assert.equal(enabled.fetches, 1);
  assert.deepEqual(enabled.resultValue.items, disabled.resultValue.items);
  const safeNoop = { enabled: true, increment() {}, observeResponse() {}, close() {},
    observeProvider() { throw new Error('telemetry fixture failure'); } };
  assert.equal((await execute(true, safeNoop)).fetches, 1);
});

test('migration is additive, bounded, atomic, RLS-forced and service-role-only', () => {
  assert.match(migration, /create table if not exists public\.discovery_operational_metrics_daily/i);
  assert.match(migration, /primary key\(metric_date,operational_region,country_code,category,radius_bucket\)/i);
  assert.match(migration, /on conflict\(metric_date,operational_region,country_code,category,radius_bucket\) do update/i);
  assert.match(migration, /least\(v_max,/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /force row level security/i);
  assert.match(migration, /auth\.role\(\)<>'service_role'/i);
  assert.match(migration, /security definer set search_path=public,extensions/i);
  assert.match(migration, /is_valid_operational_region/);
  assert.match(migration, /revoke all on table public\.discovery_operational_metrics_daily from public,anon,authenticated/i);
  assert.doesNotMatch(migration, /jsonb|dynamic|execute format/i);
});

test('retention is service-role-only, metrics-only, bounded and retry-safe', () => {
  const retention = migration.slice(migration.indexOf('create or replace function public.prune'));
  assert.match(retention, /p_limit not between 1 and 1000/);
  assert.match(retention, /metric_date<p_before_date[\s\S]+limit p_limit/);
  assert.doesNotMatch(retention, /discovered_places|discovery_cells|verified_services|service_provider_links|service_verification_log/);
});

test('schema and diagnostics prohibit identity, exact location and provider payload storage', () => {
  for (const source of [migration, rollback]) {
    assert.doesNotMatch(source, /\b(latitude|longitude|user_id|device_id|session_id|request_id|ip_address|authorization|provider_url|request_body|response_body)\b/i);
  }
  assert.doesNotMatch(metricsSource, /console\.|logger\.|diagnostics\.emit|JSON\.stringify\(entry\)/);
  assert.doesNotMatch(migration, /verified_services|service_provider_links|service_verification_log/i);
});

test('rollback removes only LDE-5 objects and preserves migrations 005 through 007', () => {
  assert.match(rollback, /drop function if exists public\.prune_discovery_operational_metrics/);
  assert.match(rollback, /drop function if exists public\.increment_discovery_operational_metrics/);
  assert.match(rollback, /drop table if exists public\.discovery_operational_metrics_daily/);
  assert.doesNotMatch(rollback, /discovered_places|discovery_cells|verified_services|005|006|007/i);
});

test('collection-only benchmark remains bounded and reports local overhead', () => {
  const iterations = 10000;
  const disabled = createOperationalMetrics(env({ operationalMetricsEnabled: false }));
  const enabled = createOperationalMetrics(env());
  const samples = [];
  let start = performance.now();
  for (let index = 0; index < iterations; index += 1) disabled.increment(params, 'nearbyRequests');
  const disabledMs = performance.now() - start;
  for (let index = 0; index < iterations; index += 1) {
    start = performance.now(); enabled.increment(params, 'nearbyRequests'); samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length * 0.5)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  console.log(`LDE-5 local microbenchmark disabled-total=${disabledMs.toFixed(3)}ms collection median=${median.toFixed(4)}ms p95=${p95.toFixed(4)}ms keys=${enabled.stats().keys}`);
  assert.equal(enabled.stats().keys, 1);
  assert.ok(p95 < 5);
  disabled.close(); enabled.close();
});

test('representative nearby benchmark covers disabled, collection and mocked persistence modes', async () => {
  const iterations = 500;
  async function benchmark(metricsEnv, metricsOptions = {}) {
    const operationalMetrics = createOperationalMetrics(metricsEnv, metricsOptions);
  const provider = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
      searchNearby: async (_params, context) => { context.onUpstreamAttempt('geoapify'); return [result('benchmark')]; } };
    const service = createNearbyService(metricsEnv, { providers: [provider], operationalMetrics });
    const benchmarkParams = { ...params, limit: 1 };
    const samples = [];
    for (let index = 0; index < iterations; index += 1) {
      const started = performance.now();
      await service.searchNearby(benchmarkParams);
      samples.push(performance.now() - started);
    }
    samples.sort((a, b) => a - b);
    const resultSummary = { median: samples[Math.floor(iterations * 0.5)], p95: samples[Math.floor(iterations * 0.95)],
      keys: operationalMetrics.stats().keys };
    await operationalMetrics.flush();
    operationalMetrics.close();
    return resultSummary;
  }
  const disabled = await benchmark(env({ operationalMetricsEnabled: false }));
  const collection = await benchmark(env());
  const persistentEnv = env({ operationalMetricsPersistenceEnabled: true });
  persistentEnv.supabase = { url: 'https://local-mock.invalid', serviceRoleKey: 'test-only-placeholder' };
  const persistence = await benchmark(persistentEnv, { fetchImpl: async () => ({ ok: true }) });
  const p95Overhead = collection.p95 - disabled.p95;
  console.log(`LDE-5 resolver benchmark disabled median=${disabled.median.toFixed(4)}ms p95=${disabled.p95.toFixed(4)}ms; collection median=${collection.median.toFixed(4)}ms p95=${collection.p95.toFixed(4)}ms overhead-p95=${p95Overhead.toFixed(4)}ms; mocked-persistence median=${persistence.median.toFixed(4)}ms p95=${persistence.p95.toFixed(4)}ms`);
  assert.equal(collection.keys, 1);
  assert.equal(persistence.keys, 1);
  assert.ok(p95Overhead < 5);
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`LDE-5 operational intelligence tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
