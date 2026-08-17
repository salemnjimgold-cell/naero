const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readEnv } = require('../backend/src/config/env');
const { createNearbyService } = require('../backend/src/services/nearbyService');
const { createDiscoveredPlacesProvider } = require('../backend/src/gateway/providers/discoveredPlaces');
const { createProviderDiagnostics } = require('../backend/src/gateway/providerDiagnostics');
const { coverageDecision, refreshOutcome } = require('../backend/src/gateway/coverageLifecycle');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'backend/db/migrations/007_demand_driven_coverage_lifecycle.sql'), 'utf8');
const rollback = fs.readFileSync(path.join(root, 'backend/db/rollbacks/007_demand_driven_coverage_lifecycle.rollback.sql'), 'utf8');
const params = { latitude: 48.2, longitude: 16.3, radius: 5000, limit: 2,
  category: 'hospital', countryCode: 'AT', language: 'en' };
const env = { gateway: { providerTimeoutMs: 50, nearbyCache: { ttlMs: 0, staleMs: 0 } },
  providers: {}, supabase: { url: 'https://project.example', serviceRoleKey: 'runtime-only' } };
function place(id = 'one') { return { provider: 'geoapify', providerId: id, name: `Hospital ${id}`,
  latitude: params.latitude, longitude: params.longitude, countryCode: 'AT',
  sourceAttribution: 'source', confidence: 'high' }; }
function discovered(shared, records = []) {
  return { name: 'discovered', sourceRole: 'DISCOVERED', configured: true, persistenceEnabled: false,
    coverageEnabled: true, demandRefreshEnabled: true, searchNearby: async () => records,
    searchStale: async () => records, readCoverage: async () => ({ ...shared.state }),
    claimRefresh: async () => {
      if (shared.claimed) return { claimed: false };
      shared.claimed = true; return { claimed: true, claimToken: '11111111-1111-4111-8111-111111111111' };
    },
    completeRefresh: async (_params, outcome) => { shared.completed = outcome; shared.state = {
      state: outcome.status, coverageComplete: outcome.coverageComplete, resultCount: outcome.resultCount }; shared.claimed = false; },
    failRefresh: async (_params, outcome) => { shared.failed = outcome; shared.state = { state: 'REFRESH_FAILED' }; shared.claimed = false; },
  };
}
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('missing compatible state is UNSEEN and claims refresh', () => {
  assert.deepEqual(coverageDecision(undefined, { demandRefreshEnabled: true }), { action: 'claim_refresh', state: 'UNSEEN' });
});
test('coverage metadata disagreement fails toward live discovery', () => {
  assert.equal(coverageDecision({ state: 'EXHAUSTED', coverageComplete: true, resultCount: 2 },
    { demandRefreshEnabled: true, availableCount: 1 }).action, 'claim_refresh');
  assert.equal(coverageDecision({ state: 'EXHAUSTED', coverageComplete: true, resultCount: 0 },
    { demandRefreshEnabled: true, availableCount: 0 }).action, 'suppress_live');
});
test('feature flags default off and demand depends on intelligence', () => {
  assert.equal(readEnv({}).gateway.coverageIntelligenceEnabled, false);
  assert.equal(readEnv({ DISCOVERY_DEMAND_REFRESH_ENABLED: 'true' }).gateway.demandRefreshEnabled, false);
  const enabled = readEnv({ DISCOVERY_COVERAGE_INTELLIGENCE_ENABLED: 'true', DISCOVERY_DEMAND_REFRESH_ENABLED: 'true' });
  assert.equal(enabled.gateway.demandRefreshEnabled, true);
});
test('feature-off resolver preserves LDE-3 behavior without lifecycle calls', async () => {
  let liveCalls = 0; const d = discovered({ state: { state: 'EXHAUSTED', coverageComplete: true } });
  d.coverageEnabled = false; d.demandRefreshEnabled = false;
  d.readCoverage = async () => { throw new Error('must not call'); };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async () => { liveCalls += 1; return []; } };
  const result = await createNearbyService(env, { providers: [d, live] }).searchNearby(params);
  assert.equal(liveCalls, 1); assert.equal(result.coverageStatus, 'exhausted');
});
test('successful empty acquisition becomes EXHAUSTED and survives process restart', async () => {
  let liveCalls = 0; const shared = { state: { state: 'UNSEEN' }, claimed: false };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async () => { liveCalls += 1; return []; } };
  await createNearbyService(env, { providers: [discovered(shared), live] }).searchNearby(params);
  assert.equal(shared.completed.status, 'EXHAUSTED'); assert.equal(shared.completed.resultCount, 0);
  const repeated = await createNearbyService(env, { providers: [discovered(shared), live] }).searchNearby(params);
  assert.equal(liveCalls, 1); assert.equal(repeated.coverageStatus, 'exhausted');
});
test('provider failure records REFRESH_FAILED and cannot create EXHAUSTED', async () => {
  const shared = { state: { state: 'UNSEEN' }, claimed: false };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async () => { const error = new Error(); error.code = 'PROVIDER_UNAVAILABLE'; throw error; } };
  await assert.rejects(() => createNearbyService(env, { providers: [discovered(shared), live] }).searchNearby(params));
  assert.equal(shared.completed, undefined); assert.equal(shared.failed.failureCode, 'LIVE_PROVIDER_FAILURE');
});
test('partial state allows live discovery and sufficient actual records remain authoritative', async () => {
  let liveCalls = 0; const shared = { state: { state: 'PARTIAL', coverageComplete: false }, claimed: false };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async () => { liveCalls += 1; return [place('two')]; } };
  const result = await createNearbyService(env, { providers: [discovered(shared, [place('one')]), live] }).searchNearby(params);
  assert.equal(liveCalls, 1); assert.equal(result.items.length, 2); assert.equal(shared.completed.status, 'SUFFICIENT');
});
test('actual sufficient L2 results suppress live independently of stale metadata', async () => {
  let liveCalls = 0; const shared = { state: { state: 'STALE' }, claimed: false };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
    searchNearby: async () => { liveCalls += 1; return []; } };
  const result = await createNearbyService(env, { providers: [discovered(shared, [place('one'), place('two')]), live] }).searchNearby(params);
  assert.equal(result.items.length, 2); assert.equal(liveCalls, 0); assert.equal(shared.claimed, false);
});
test('stale state claims a bounded demand refresh', async () => {
  const shared = { state: { state: 'STALE' }, claimed: false };
  const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true, searchNearby: async () => [place()] };
  await createNearbyService(env, { providers: [discovered(shared), live] }).searchNearby(params);
  assert.equal(shared.completed.status, 'EXHAUSTED');
});
test('refreshing and backoff states suppress parallel live traffic truthfully', async () => {
  for (const state of ['REFRESHING', 'REFRESH_FAILED']) {
    let liveCalls = 0; const shared = { state: { state }, claimed: true };
    const live = { name: 'geoapify', sourceRole: 'LIVE', configured: true,
      searchNearby: async () => { liveCalls += 1; return []; } };
    const result = await createNearbyService(env, { providers: [discovered(shared), live] }).searchNearby(params);
    assert.equal(liveCalls, 0); assert.equal(result.partial, true); assert.equal(result.coverageStatus, 'partial');
  }
});
test('atomic claim contract allows one concurrent owner and later recovery', async () => {
  let claimedUntil = 0;
  const claim = async (now) => { await Promise.resolve(); if (claimedUntil > now) return false; claimedUntil = now + 90000; return true; };
  const concurrent = await Promise.all([claim(1000), claim(1000)]);
  assert.deepEqual(concurrent.sort(), [false, true]); assert.equal(await claim(91001), true);
  assert.match(migration, /interval '90 seconds'/); assert.match(migration, /interval '60 seconds'/);
  assert.match(migration, /refresh_claim_token=v_claim_token/);
});
test('refresh outcome is conservative for failures and incomplete chains', () => {
  assert.equal(refreshOutcome({ items: [], limit: 2, liveAttempted: ['geoapify'], liveSucceeded: ['geoapify'], liveFailures: 0, chainComplete: true }).status, 'EXHAUSTED');
  assert.equal(refreshOutcome({ items: [], limit: 2, liveAttempted: ['geoapify'], liveSucceeded: [], liveFailures: 1, chainComplete: true }).status, 'PARTIAL');
  assert.equal(refreshOutcome({ items: [], limit: 2, liveAttempted: ['geoapify'], liveSucceeded: ['geoapify'], liveFailures: 0, chainComplete: false }).status, 'PARTIAL');
});
test('coverage RPC sends coarse dimensions only and isolates request dimensions', async () => {
  const bodies = [];
  const provider = createDiscoveredPlacesProvider({ ...env, gateway: { ...env.gateway,
    discoveredStoreEnabled: true, coverageIntelligenceEnabled: true, demandRefreshEnabled: true } }, {
    fetchImpl: async (_url, request) => { bodies.push(JSON.parse(request.body)); return { ok: true, json: async () => ({ state: 'UNSEEN' }) }; },
  });
  await provider.readCoverage(params);
  await provider.readCoverage({ ...params, category: 'pharmacy' });
  await provider.readCoverage({ ...params, countryCode: 'HU' });
  await provider.readCoverage({ ...params, language: 'hu' });
  await provider.readCoverage({ ...params, radius: 1000 });
  const serialized = JSON.stringify(bodies[0]);
  assert.doesNotMatch(serialized, /latitude|longitude|requestId|user|session|device/i);
  assert.match(serialized, /cellId/); assert.match(serialized, /coverage-v2/); assert.match(serialized, /lde-4/);
  const dimensions = bodies.map((body) => body.p_dimensions);
  assert.notDeepEqual(dimensions[0], dimensions[1]); assert.notDeepEqual(dimensions[0], dimensions[2]);
  assert.notDeepEqual(dimensions[0], dimensions[3]); assert.notDeepEqual(dimensions[0], dimensions[4]);
});
test('migration enforces RLS, service role, fixed search path and safe exhaustion', () => {
  assert.match(migration, /security definer\s+set search_path=public,extensions/i);
  assert.match(migration, /auth\.role\(\)<>'service_role'/);
  assert.match(migration, /revoke all on function public\.manage_discovery_coverage[^;]+from public,anon,authenticated/i);
  assert.match(migration, /v_status='EXHAUSTED'.+not v_complete.+v_failures/s);
  assert.doesNotMatch(migration, /latitude|longitude|user_id|device_id|session_id|request_id|ip_address/i);
  assert.doesNotMatch(migration, /verified_services|service_provider_links|service_verification_log/i);
  assert.doesNotMatch(migration, /permanently_closed\s*=|active\s*=\s*false/i);
});
test('migration is additive, rollback scoped, and old migrations remain untouched', () => {
  assert.doesNotMatch(migration, /drop table|truncate|delete from/i);
  assert.match(rollback, /drop function if exists public\.manage_discovery_coverage/);
  assert.match(rollback, /drop column if exists coverage_status/);
  assert.doesNotMatch(rollback, /drop table|005|006/i);
});
test('lifecycle diagnostics discard location, claim nonce, bodies, credentials and identity', () => {
  const events = [];
  const diagnostics = createProviderDiagnostics('lde4-safe-request', (_message, meta) => events.push(meta));
  diagnostics.emit({ provider: 'discovered', stage: 'refresh_claim', coverageState: 'REFRESHING',
    claimOutcome: 'acquired', resultCount: 1, claimToken: '11111111-1111-4111-8111-111111111111',
    cellId: 'private-cell', latitude: 48.2, longitude: 16.3, requestBody: 'private-body',
    authorization: 'Bearer private-token', userId: 'private-user' });
  assert.equal(events.length, 1);
  assert.deepEqual(Object.keys(events[0]).sort(), ['claimOutcome','coverageState','provider','requestId','resultCount','stage']);
  assert.doesNotMatch(JSON.stringify(events), /11111111|private|48\.2|16\.3|Bearer/i);
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`LDE-4 coverage lifecycle tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
