const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { readEnv } = require('../backend/src/config/env');
const { createNearbyService } = require('../backend/src/services/nearbyService');
const { operationalRegion } = require('../backend/src/gateway/operationalMetrics');
const { evaluateProviderPolicy, POLICY_VERSION, PROVIDER_FIELDS, SATURATED_COUNTER,
  validOperationalRegion } = require('../backend/src/gateway/providerPolicy');
const { createMetricsReader, createPolicyDiagnostics, createPolicySnapshotCache,
  createProviderPolicyShadow, policyKey, providerSignature, SELECTED_COLUMNS, SNAPSHOT_MAX_KEYS,
  MAX_IN_FLIGHT_LOADS } = require('../backend/src/gateway/providerPolicyShadow');

const NOW = Date.parse('2026-08-23T12:00:00.000Z');
const params = { latitude: 48.2, longitude: 16.3, radius: 5000, limit: 2,
  category: 'hospital', countryCode: 'AT', language: 'en' };
const STATIC = ['geoapify', 'google', 'osm'];
const DIMENSIONS = { operationalRegion: operationalRegion(params.latitude, params.longitude),
  countryCode: 'AT', category: 'hospital', radiusBucket: 10000 };
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function providerValues(overrides = {}) {
  return { attempts: 20, successes: 18, emptyResults: 1, failures: 1, yield: 36, ...overrides };
}
function evidenceRow(metricDate, providers = {}) {
  const row = { metric_date: metricDate };
  for (const provider of STATIC) {
    const values = providerValues(providers[provider] || { attempts: 0, successes: 0, emptyResults: 0, failures: 0, yield: 0 });
    const fields = PROVIDER_FIELDS[provider];
    for (const [key, field] of Object.entries(fields)) row[field] = values[key];
  }
  return row;
}
function eligibleRows() {
  const degraded = { attempts: 25, successes: 10, emptyResults: 3, failures: 7, yield: 20 };
  const healthy = { attempts: 20, successes: 18, emptyResults: 1, failures: 1, yield: 36 };
  return ['2026-08-20', '2026-08-21', '2026-08-22'].map((date) => evidenceRow(date,
    { geoapify: degraded, google: healthy }));
}
function evaluate(rows = eligibleRows(), overrides = {}) {
  return evaluateProviderPolicy({ rows, liveProviders: ['geoapify', 'google'], staticOrder: STATIC,
    category: 'hospital', dimensions: DIMENSIONS, now: NOW, ...overrides });
}
function policyEnv(overrides = {}) {
  return { gateway: { providerTimeoutMs: 50, nearbyCache: { ttlMs: 0, staleMs: 0 },
    providerPolicyShadowEnabled: false, providerPolicyAdaptiveEnabled: false, ...overrides },
  providers: {}, supabase: { url: 'https://project.example', serviceRoleKey: 'test-service-role' } };
}
function place(provider, id) {
  return { provider, providerId: id, name: `Hospital ${id}`, latitude: params.latitude,
    longitude: params.longitude, countryCode: 'AT', sourceAttribution: 'Fixture', verified: false };
}

test('feature flags are strict and default off', () => {
  const defaults = readEnv({ NAERO_ENV_FILE: 'missing-lde6-env' });
  assert.equal(defaults.gateway.providerPolicyShadowEnabled, false);
  assert.equal(defaults.gateway.providerPolicyAdaptiveEnabled, false);
  assert.equal(readEnv({ NAERO_ENV_FILE: 'missing-lde6-env', DISCOVERY_PROVIDER_POLICY_SHADOW_ENABLED: 'TRUE' })
    .gateway.providerPolicyShadowEnabled, false);
  const enabled = readEnv({ NAERO_ENV_FILE: 'missing-lde6-env',
    DISCOVERY_PROVIDER_POLICY_SHADOW_ENABLED: 'true', DISCOVERY_PROVIDER_POLICY_ADAPTIVE_ENABLED: 'true' });
  assert.equal(enabled.gateway.providerPolicyShadowEnabled, true);
  assert.equal(enabled.gateway.providerPolicyAdaptiveEnabled, true);
});

test('deterministic degraded-provider recommendation uses static tie-breaking', () => {
  const first = evaluate(); const second = evaluate();
  assert.deepEqual(first, second);
  assert.equal(first.policyVersion, POLICY_VERSION);
  assert.equal(first.eligible, true);
  assert.equal(first.reasonCode, 'ADAPTIVE_POLICY_ELIGIBLE');
  assert.deepEqual(first.staticOrder, STATIC);
  assert.deepEqual(first.proposedOrder, ['google', 'geoapify', 'osm']);
});

test('healthy comparable evidence retains static order', () => {
  const rows = ['2026-08-20', '2026-08-21', '2026-08-22'].map((date) => evidenceRow(date,
    { geoapify: providerValues(), google: providerValues() }));
  const decision = evaluate(rows);
  assert.equal(decision.eligible, true);
  assert.equal(decision.reasonCode, 'STATIC_RETAINED');
  assert.deepEqual(decision.proposedOrder, STATIC);
});

test('null, missing, fractional, NaN, Infinity and negative evidence fail static', () => {
  assert.equal(evaluateProviderPolicy({ rows: null, liveProviders: ['geoapify', 'google'], staticOrder: STATIC,
    category: 'hospital', dimensions: DIMENSIONS, now: NOW }).eligible, false);
  for (const value of [undefined, -1, 0.5, NaN, Infinity]) {
    const rows = eligibleRows(); rows[0].geoapify_attempts = value;
    assert.equal(evaluate(rows).eligible, false);
    assert.deepEqual(evaluate(rows).proposedOrder, STATIC);
  }
  const hostile = evidenceRow('2026-08-22', { geoapify: providerValues(), google: providerValues() });
  Object.defineProperty(hostile, 'geoapify_attempts', { get() { throw new Error('private credential'); } });
  assert.equal(evaluate([hostile]).reasonCode, 'METRICS_INVALID');
});

test('saturated and contradictory counters fail static', () => {
  const saturated = eligibleRows(); saturated[0].geoapify_attempts = SATURATED_COUNTER;
  assert.equal(evaluate(saturated).reasonCode, 'METRICS_INVALID');
  const contradictory = eligibleRows(); contradictory[0].geoapify_attempts = 1;
  assert.equal(evaluate(contradictory).reasonCode, 'METRICS_CONTRADICTORY');
  const impossibleYield = eligibleRows(); impossibleYield[0].geoapify_successes = 0;
  impossibleYield[0].geoapify_attempts = impossibleYield[0].geoapify_empty_results + impossibleYield[0].geoapify_failures;
  assert.equal(evaluate(impossibleYield).reasonCode, 'METRICS_CONTRADICTORY');
  const aggregateOverflow = eligibleRows();
  for (const row of aggregateOverflow) {
    row.geoapify_attempts = SATURATED_COUNTER - 1;
    row.geoapify_successes = SATURATED_COUNTER - 1;
    row.geoapify_empty_results = 0; row.geoapify_failures = 0; row.geoapify_yield = 0;
  }
  assert.equal(evaluate(aggregateOverflow).reasonCode, 'METRICS_INVALID');
});

test('duplicate dates and unsupported context fail static', () => {
  const duplicate = eligibleRows(); duplicate[2].metric_date = duplicate[1].metric_date;
  assert.equal(evaluate(duplicate).reasonCode, 'DUPLICATE_EVIDENCE');
  assert.equal(evaluate(eligibleRows(), { category: 'unknown' }).reasonCode, 'CATEGORY_UNSUPPORTED');
  assert.equal(evaluate(eligibleRows(), { liveProviders: ['geoapify', 'hostile'] }).reasonCode, 'PROVIDER_UNSUPPORTED');
});

test('sparse, stale, one-provider and newly configured evidence remain safe', () => {
  const sparse = eligibleRows();
  for (const row of sparse) row.geoapify_successes = 1;
  assert.equal(evaluate(sparse).reasonCode, 'INSUFFICIENT_EVIDENCE');
  const twoDates = [
    evidenceRow('2026-08-20', { geoapify: providerValues({ attempts: 30, successes: 25, emptyResults: 3, failures: 2, yield: 50 }),
      google: providerValues({ attempts: 30, successes: 25, emptyResults: 3, failures: 2, yield: 50 }) }),
    evidenceRow('2026-08-21', { geoapify: providerValues({ attempts: 30, successes: 25, emptyResults: 3, failures: 2, yield: 50 }),
      google: providerValues({ attempts: 30, successes: 25, emptyResults: 3, failures: 2, yield: 50 }) }),
    evidenceRow('2026-08-22'),
  ];
  assert.equal(evaluate(twoDates).reasonCode, 'INSUFFICIENT_EVIDENCE');
  const stale = eligibleRows().map((row, index) => ({ ...row, metric_date: `2026-08-${17 + index}` }));
  assert.equal(evaluate(stale).reasonCode, 'METRICS_STALE');
  const one = eligibleRows();
  for (const row of one) for (const field of Object.values(PROVIDER_FIELDS.google)) row[field] = 0;
  assert.equal(evaluate(one).reasonCode, 'INSUFFICIENT_EVIDENCE');
  const newlyConfigured = evaluate(eligibleRows(), { liveProviders: STATIC });
  assert.deepEqual(newlyConfigured.proposedOrder, ['google', 'geoapify', 'osm']);
  assert.equal(newlyConfigured.providerDecisions.some((item) => item.provider === 'osm'), false);
});

test('coarse operational-region validation is strict', () => {
  const region = operationalRegion(params.latitude, params.longitude);
  assert.equal(validOperationalRegion(region), true);
  for (const invalid of [null, 'op5-v1:1:1:1', 'nearby-v2:1:2:3', 'op5-v1:99999:1:0', 'op5-v1:1:1:0 private']) {
    assert.equal(validOperationalRegion(invalid), false);
    assert.equal(evaluate(eligibleRows(), { dimensions: { ...DIMENSIONS, operationalRegion: invalid } }).eligible, false);
  }
});

test('snapshot cache hits, expires and remains bounded with deterministic eviction', () => {
  let time = 0;
  const cache = createPolicySnapshotCache({ maxKeys: 2, ttlMs: 10 * 60 * 1000, now: () => time });
  cache.set('one', { id: 1 }); cache.set('two', { id: 2 });
  assert.equal(cache.get('one').id, 1);
  cache.set('three', { id: 3 });
  assert.equal(cache.get('two'), null);
  assert.equal(cache.size(), 2);
  time = 10 * 60 * 1000;
  assert.equal(cache.get('one'), null);
  const bounded = createPolicySnapshotCache({ maxKeys: SNAPSHOT_MAX_KEYS });
  for (let index = 0; index < SNAPSHOT_MAX_KEYS + 10; index += 1) bounded.set(`key-${index}`, { index });
  assert.equal(bounded.size(), SNAPSHOT_MAX_KEYS);
});

test('cache identity isolates policy version, ordered provider set and every policy dimension', () => {
  const base = policyKey(DIMENSIONS, STATIC);
  assert.equal(typeof base, 'string');
  assert.notEqual(base, policyKey(DIMENSIONS, ['geoapify', 'osm']));
  assert.notEqual(base, policyKey(DIMENSIONS, ['osm', 'google', 'geoapify']));
  assert.notEqual(base, policyKey({ ...DIMENSIONS, category: 'pharmacy' }, STATIC));
  assert.notEqual(base, policyKey({ ...DIMENSIONS, countryCode: 'SK' }, STATIC));
  assert.notEqual(base, policyKey({ ...DIMENSIONS, radiusBucket: 5000 }, STATIC));
  assert.notEqual(base, policyKey({ ...DIMENSIONS,
    operationalRegion: operationalRegion(47.5, 19.0) }, STATIC));
  assert.equal(policyKey(DIMENSIONS, STATIC, 'future-policy'), null);
  for (const providers of [null, undefined, [], ['geoapify', 'geoapify'], ['geoapify', 'hostile'],
    ['geoapify|google', 'osm']]) assert.equal(policyKey(DIMENSIONS, providers), null);
  assert.equal(providerSignature(['geoapify', 'google']), '["geoapify","google"]');
  assert.notEqual(policyKey(DIMENSIONS, ['geoapify', 'google']),
    policyKey(DIMENSIONS, ['google', 'geoapify']));
});

test('malformed cached identity fails closed and is never reused', async () => {
  let reads = 0;
  const hostileCache = {
    get: () => ({ key: 'wrong', policyVersion: POLICY_VERSION,
      providerSignature: '["geoapify","google"]', decision: evaluate() }),
    set: () => {}, size: () => 0, clear: () => {},
  };
  const policy = createProviderPolicyShadow(policyEnv({ providerPolicyShadowEnabled: true }), {
    cache: hostileCache, now: () => NOW, logger: () => {},
    readMetrics: async () => { reads += 1; return { ok: false, reasonCode: 'READER_UNAVAILABLE' }; },
  });
  const decision = policy.evaluate(params, [{ name: 'geoapify' }, { name: 'google' }]);
  assert.equal(decision.reasonCode, 'NO_EVIDENCE');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, 1);
});

test('distinct in-flight analytics loads are bounded without queueing and clean up', async () => {
  const releases = []; let reads = 0;
  const policy = createProviderPolicyShadow(policyEnv({ providerPolicyShadowEnabled: true }), {
    now: () => NOW, logger: () => {}, readMetrics: () => {
      reads += 1; return new Promise((resolve) => releases.push(resolve));
    },
  });
  const providers = [{ name: 'geoapify' }, { name: 'google' }];
  const decisions = [];
  for (let index = 0; index < MAX_IN_FLIGHT_LOADS + 25; index += 1) {
    decisions.push(policy.evaluate({ ...params, latitude: -70 + index }, providers));
  }
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(policy.pendingCount(), MAX_IN_FLIGHT_LOADS);
  assert.equal(reads, MAX_IN_FLIGHT_LOADS);
  assert.equal(decisions.every((decision) => decision.reasonCode === 'NO_EVIDENCE'), true);
  releases.splice(0).forEach((release) => release({ ok: true, rows: eligibleRows() }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(policy.pendingCount(), 0);
  policy.evaluate({ ...params, latitude: 69 }, providers);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, MAX_IN_FLIGHT_LOADS + 1);
  releases[0]({ ok: false, reasonCode: 'READER_UNAVAILABLE' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(policy.pendingCount(), 0);
});

test('reader rejection and synchronous failure always release in-flight ownership', async () => {
  const providers = [{ name: 'geoapify' }, { name: 'google' }];
  for (const readMetrics of [() => { throw new Error('sync'); }, async () => { throw new Error('async'); },
    () => new Promise((resolve) => setTimeout(() => resolve({ ok: false, reasonCode: 'READER_TIMEOUT' }), 5))]) {
    const policy = createProviderPolicyShadow(policyEnv({ providerPolicyShadowEnabled: true }), {
      now: () => NOW, logger: () => {}, readMetrics,
    });
    policy.evaluate(params, providers);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(policy.pendingCount(), 0);
  }
});

test('pending ownership prevents eviction or clear from creating stale overlapping loads', async () => {
  let reads = 0; let release;
  const policy = createProviderPolicyShadow(policyEnv({ providerPolicyShadowEnabled: true }), {
    now: () => NOW, logger: () => {}, readMetrics: () => {
      reads += 1; return new Promise((resolve) => { release = resolve; });
    },
  });
  const providers = [{ name: 'geoapify' }, { name: 'google' }];
  policy.evaluate(params, providers);
  await new Promise((resolve) => setImmediate(resolve));
  policy.cache.clear();
  policy.evaluate(params, providers);
  assert.equal(reads, 1);
  assert.equal(policy.pendingCount(), 1);
  release({ ok: true, rows: eligibleRows() });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(policy.pendingCount(), 0);
  assert.deepEqual(policy.evaluate(params, providers).proposedOrder, ['google', 'geoapify']);
});

test('reader uses fixed columns, bounded dates, one request and service-role only', async () => {
  let calls = 0; let captured;
  const reader = createMetricsReader(policyEnv(), { fetchImpl: async (url, options) => {
    calls += 1; captured = { url, options }; return { ok: true, json: async () => eligibleRows() };
  } });
  const result = await reader({ operationalRegion: operationalRegion(params.latitude, params.longitude),
    countryCode: 'AT', category: 'hospital', radiusBucket: 10000 }, NOW);
  assert.equal(result.ok, true); assert.equal(calls, 1); assert.equal(result.rows.length, 3);
  assert.ok(SELECTED_COLUMNS.every((column) => captured.url.includes(column)));
  assert.equal(captured.options.method, undefined);
  assert.equal(Boolean(captured.options.headers.authorization), true);
  assert.doesNotMatch(JSON.stringify(result), /authorization|apikey|project\.example/i);
});

test('reader timeout, malformed response and invalid dimensions fail closed without retry', async () => {
  let timeoutCalls = 0;
  const timeoutReader = createMetricsReader(policyEnv(), { timeoutMs: 10, fetchImpl: (_url, options) => {
    timeoutCalls += 1;
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => {
      const error = new Error('private hostname'); error.name = 'AbortError'; reject(error);
    }));
  } });
  assert.equal((await timeoutReader({ operationalRegion: operationalRegion(params.latitude, params.longitude),
    countryCode: 'AT', category: 'hospital', radiusBucket: 10000 }, NOW)).reasonCode, 'READER_TIMEOUT');
  assert.equal(timeoutCalls, 1);
  const malformed = createMetricsReader(policyEnv(), { fetchImpl: async () => ({ ok: true, json: async () => ({ rows: [] }) }) });
  assert.equal((await malformed({ operationalRegion: operationalRegion(params.latitude, params.longitude),
    countryCode: 'AT', category: 'hospital', radiusBucket: 10000 }, NOW)).reasonCode, 'METRICS_INVALID');
  let invalidCalls = 0;
  const invalid = createMetricsReader(policyEnv(), { fetchImpl: async () => { invalidCalls += 1; } });
  assert.equal((await invalid({ operationalRegion: 'invalid', countryCode: 'AT', category: 'hospital', radiusBucket: 10000 }, NOW)).ok, false);
  assert.equal(invalidCalls, 0);
});

test('cache miss is immediate and duplicate asynchronous loads are suppressed', async () => {
  let reads = 0; let release;
  const policy = createProviderPolicyShadow(policyEnv({ providerPolicyShadowEnabled: true }), {
    now: () => NOW, logger: () => {}, readMetrics: async () => {
      reads += 1; await new Promise((resolve) => { release = resolve; }); return { ok: true, rows: eligibleRows() };
    },
  });
  const providers = [{ name: 'geoapify' }, { name: 'google' }];
  const started = performance.now();
  const first = policy.evaluate(params, providers); policy.evaluate(params, providers);
  assert.ok(performance.now() - started < 10);
  assert.deepEqual(first.proposedOrder, ['geoapify', 'google']);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, 1); assert.equal(policy.pendingCount(), 1);
  release(); await new Promise((resolve) => setImmediate(resolve));
  assert.equal(policy.pendingCount(), 0);
  assert.deepEqual(policy.evaluate(params, providers).proposedOrder, ['google', 'geoapify']);
});

test('shadow off creates no reader, diagnostics or timer activity', async () => {
  let reads = 0; let logs = 0;
  const policy = createProviderPolicyShadow(policyEnv(), { readMetrics: async () => { reads += 1; return { ok: true, rows: [] }; },
    logger: () => { logs += 1; } });
  assert.equal(policy.evaluate(params, [{ name: 'geoapify' }, { name: 'google' }]), null);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, 0); assert.equal(logs, 0); assert.equal(policy.cache.size(), 0);
});

test('adaptive flag is parsed but remains inert', () => {
  const policy = createProviderPolicyShadow(policyEnv({ providerPolicyShadowEnabled: true,
    providerPolicyAdaptiveEnabled: true }), { logger: () => {}, readMetrics: async () => ({ ok: true, rows: eligibleRows() }) });
  assert.equal(policy.adaptiveConfigured, true);
  assert.equal(policy.adaptiveEffective, false);
});

test('all shadow and adaptive flag combinations preserve static provider execution order', async () => {
  for (const shadow of [false, true]) for (const adaptive of [false, true]) {
    const calls = [];
    const providers = ['geoapify', 'google'].map((name) => ({ name, sourceRole: 'LIVE', configured: true,
      searchNearby: async () => { calls.push(name); return [place(name, name)]; } }));
    const service = createNearbyService(policyEnv({ providerPolicyShadowEnabled: shadow,
      providerPolicyAdaptiveEnabled: adaptive }), { providers,
      providerPolicyOptions: { now: () => NOW, logger: () => {},
        readMetrics: async () => ({ ok: true, rows: eligibleRows() }) } });
    await service.searchNearby(params);
    await new Promise((resolve) => setImmediate(resolve));
    service.cache.clear();
    await service.searchNearby(params);
    assert.deepEqual(calls, ['geoapify', 'google', 'geoapify', 'google']);
    assert.equal(service.providerPolicy.adaptiveEffective, false);
  }
});

async function resolverRun(shadowEnabled) {
  const calls = []; let analyticsReads = 0;
  const providers = [
    { name: 'geoapify', sourceRole: 'LIVE', configured: true,
      searchNearby: async () => { calls.push('geoapify'); return [place('geoapify', 'one')]; } },
    { name: 'google', sourceRole: 'LIVE', configured: true,
      searchNearby: async () => { calls.push('google'); return [place('google', 'two')]; } },
  ];
  const service = createNearbyService(policyEnv({ providerPolicyShadowEnabled: shadowEnabled }), {
    providers, providerPolicyOptions: { now: () => NOW, logger: () => {},
      readMetrics: async () => { analyticsReads += 1; return { ok: true, rows: eligibleRows() }; } },
  });
  const response = await service.searchNearby(params);
  await new Promise((resolve) => setImmediate(resolve));
  return { calls, analyticsReads, response };
}

test('feature-off and shadow-on resolver calls, retries, order and response are equivalent', async () => {
  const off = await resolverRun(false); const on = await resolverRun(true);
  assert.deepEqual(off.calls, ['geoapify', 'google']);
  assert.deepEqual(on.calls, off.calls);
  assert.equal(off.analyticsReads, 0); assert.equal(on.analyticsReads, 1);
  assert.deepEqual(on.response.items.map((item) => item.provider), off.response.items.map((item) => item.provider));
  assert.deepEqual(on.response.sourcesAttempted, off.response.sourcesAttempted);
  assert.equal(on.response.coverageStatus, off.response.coverageStatus);
});

test('shadow proposal never alters effective order on a later cache hit', async () => {
  const calls = [];
  const providers = ['geoapify', 'google'].map((name) => ({ name, sourceRole: 'LIVE', configured: true,
    searchNearby: async () => { calls.push(name); return [place(name, name)]; } }));
  const service = createNearbyService(policyEnv({ providerPolicyShadowEnabled: true }), { providers,
    providerPolicyOptions: { now: () => NOW, logger: () => {}, readMetrics: async () => ({ ok: true, rows: eligibleRows() }) } });
  await service.searchNearby({ ...params, latitude: params.latitude });
  await new Promise((resolve) => setImmediate(resolve));
  service.cache.clear();
  await service.searchNearby({ ...params, latitude: params.latitude });
  assert.deepEqual(calls, ['geoapify', 'google', 'geoapify', 'google']);
});

test('diagnostics are an explicit privacy-safe allowlist', () => {
  const logs = [];
  const diagnostics = createPolicyDiagnostics((message, meta) => logs.push({ message, meta }));
  diagnostics.emit({ event: 'provider_deprioritized', provider: 'geoapify', reasonCode: 'ADAPTIVE_POLICY_ELIGIBLE',
    evidenceClass: 'sufficient', decisionAgeClass: 'fresh', observationClass: 'medium',
    latitude: params.latitude, longitude: params.longitude, operationalRegion: 'private-region',
    requestId: 'private-request', userId: 'private-user', token: 'private-token', url: 'https://private.invalid',
    rows: eligibleRows(), body: 'private-body' });
  diagnostics.emit({ event: 'hostile_event', provider: 'hostile', token: 'leak' });
  assert.equal(logs.length, 1);
  assert.deepEqual(Object.keys(logs[0].meta).sort(),
    ['decisionAgeClass', 'event', 'evidenceClass', 'mode', 'observationClass', 'policyVersion', 'provider', 'reasonCode'].sort());
  assert.doesNotMatch(JSON.stringify(logs), /latitude|longitude|region|request|user|token|url|body|private|48\.2|16\.3/i);
  assert.doesNotThrow(() => createPolicyDiagnostics(() => { throw new Error('logger unavailable'); })
    .emit({ event: 'static_policy_used', reasonCode: 'CACHE_MISS' }));
});

test('policy cannot alter trust, lineage, LDE-4 or LDE-5 state', async () => {
  let metricsCalls = 0;
  const metrics = { enabled: true, increment: () => { metricsCalls += 1; return true; },
    observeProvider: () => { metricsCalls += 1; return true; }, observeResponse: () => { metricsCalls += 1; } };
  const providerPolicy = { evaluate: () => ({ proposedOrder: ['google', 'geoapify'] }) };
  const providers = [{ name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async () => [place('geoapify', 'one'), place('geoapify', 'two')] }];
  const response = await createNearbyService(policyEnv(), { providers, operationalMetrics: metrics, providerPolicy }).searchNearby(params);
  assert.equal(response.items.every((item) => item.verified === false), true);
  assert.equal(response.items.every((item) => item.provider === 'geoapify'), true);
  assert.ok(metricsCalls > 0);
  assert.equal(providerPolicy.adaptiveEffective, undefined);
});

test('throwing or malformed shadow policy remains equivalent to static discovery', async () => {
  async function run(providerPolicy) {
    const calls = [];
    const providers = ['geoapify', 'google'].map((name) => ({ name, sourceRole: 'LIVE', configured: true,
      searchNearby: async () => { calls.push(name); return [place(name, name)]; } }));
    const response = await createNearbyService(policyEnv(), { providers, providerPolicy }).searchNearby(params);
    return { calls, response };
  }
  const baseline = await run({ evaluate: () => null });
  const throwing = await run({ evaluate: () => { throw new Error('unsafe location-bearing error'); } });
  const malformed = await run({ evaluate: () => Object.create(null, {
    proposedOrder: { get() { throw new Error('hostile getter'); } },
  }) });
  const stable = (response) => ({ ...response,
    items: response.items.map(({ fetchedAt: _fetchedAt, ...item }) => item) });
  for (const candidate of [throwing, malformed]) {
    assert.deepEqual(candidate.calls, baseline.calls);
    assert.deepEqual(stable(candidate.response), stable(baseline.response));
  }
});

test('shadow reader initialization failure remains equivalent to static discovery', async () => {
  const calls = [];
  const readerOptions = {};
  Object.defineProperty(readerOptions, 'fetchImpl', { get() { throw new Error('reader initialization'); } });
  const providers = [{ name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async () => { calls.push('geoapify'); return [place('geoapify', 'one')]; } }];
  const response = await createNearbyService(policyEnv({ providerPolicyShadowEnabled: true }), {
    providers, providerPolicyOptions: { readerOptions },
  }).searchNearby(params);
  assert.deepEqual(calls, ['geoapify']);
  assert.equal(response.items.length, 1);
});

test('pure evaluation and snapshot lookup meet the local p95 target', () => {
  const decision = evaluate();
  const cache = createPolicySnapshotCache(); cache.set('benchmark', decision);
  const evaluation = []; const lookup = [];
  for (let index = 0; index < 5000; index += 1) {
    let started = performance.now(); evaluate(); evaluation.push(performance.now() - started);
    started = performance.now(); cache.get('benchmark'); lookup.push(performance.now() - started);
  }
  evaluation.sort((a, b) => a - b); lookup.sort((a, b) => a - b);
  const e95 = evaluation[Math.floor(evaluation.length * 0.95)];
  const c95 = lookup[Math.floor(lookup.length * 0.95)];
  console.log(`LDE-6 local benchmark evaluation median=${evaluation[2500].toFixed(4)}ms p95=${e95.toFixed(4)}ms; snapshot median=${lookup[2500].toFixed(4)}ms p95=${c95.toFixed(4)}ms`);
  assert.ok(e95 < 1); assert.ok(c95 < 1);
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`LDE-6 shadow provider policy tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
