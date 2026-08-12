const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeVerifiedService, createVerifiedServicesProvider } = require('../backend/src/gateway/providers/verifiedServices');
const { normalizeResult, deduplicate, rank } = require('../backend/src/gateway/nearbyCore');

const migrationPath = path.resolve(__dirname, '../backend/db/migrations/005_postgis_verified_services.sql');
const rollbackPath = path.resolve(__dirname, '../backend/db/rollbacks/005_postgis_verified_services.rollback.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');
const rollback = fs.readFileSync(rollbackPath, 'utf8');
const params = { latitude: 47.4979, longitude: 19.0402, radius: 5000, limit: 20, category: 'hospital', language: 'en' };
const baseEnv = {
  gateway: { providerTimeoutMs: 10, verifiedCacheTtlMs: 1000 },
  supabase: { url: '', anonKey: '', serviceRoleKey: '' },
};
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function publicVisible(row, now = Date.now()) {
  return row.active === true
    && row.status === 'active'
    && row.verification_status === 'approved'
    && (!row.verification_expires_at || new Date(row.verification_expires_at).getTime() > now);
}
function fixture(overrides = {}) {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    provider_id: '00000000-0000-4000-8000-000000000001',
    category: 'hospital',
    name: 'Controlled Test Service',
    latitude: 47.5,
    longitude: 19.04,
    verified: true,
    confidence: 'high',
    source_attribution: 'Controlled fixture',
    active: true,
    status: 'active',
    verification_status: 'approved',
    verification_expires_at: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

test('PostGIS extension is enabled in extensions schema', () => assert.match(sql, /create extension if not exists postgis with schema extensions/i));
for (const table of ['service_categories', 'verified_services', 'service_verification_log', 'service_provider_links']) {
  test(`${table} table is created idempotently`, () => assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, 'i')));
}
test('country, state, confidence, source and origin constraints exist', () => {
  for (const token of ['verified_services_country_code', 'verified_services_status', 'verified_services_verification_status', 'verified_services_confidence', 'verified_services_source_type', 'verified_services_location_not_origin']) {
    assert.match(sql, new RegExp(token));
  }
});
test('spatial GiST index exists', () => assert.match(sql, /using gist \(location\)/i));
test('country city category and verification indexes exist', () => {
  for (const token of ['idx_verified_services_country_city', 'idx_verified_services_category', 'idx_verified_services_public_state']) assert.match(sql, new RegExp(token));
});
test('migration uses idempotent table index trigger policy patterns', () => {
  assert.match(sql, /^\s*begin;/im);
  assert.match(sql, /POSTGIS_SCHEMA_MISMATCH/);
  assert.match(sql, /\bcommit;\s*$/i);
  assert.match(sql, /on conflict \(key\) do nothing/i);
  assert.match(sql, /drop trigger if exists/i);
  assert.match(sql, /drop policy if exists/i);
  assert.match(sql, /create or replace function public\.nearby_verified_services/i);
});
test('rollback is documented and retains PostGIS', () => {
  assert.match(rollback, /drop function if exists/i);
  assert.match(rollback, /Do not run `drop extension postgis`/i);
});
test('migration inserts category keys but no verified service', () => {
  assert.doesNotMatch(sql, /insert into public\.verified_services/i);
  assert.equal((sql.match(/\('[a-z_]+', '[^']+'\)/g) || []).length, 24);
});
test('RLS enabled and forced on every new table', () => {
  for (const table of ['service_categories', 'verified_services', 'service_verification_log', 'service_provider_links']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`alter table public\\.${table} force row level security`, 'i'));
  }
});
test('anonymous direct verified-table access and mutations are revoked', () => {
  assert.match(sql, /revoke all on public\.verified_services from anon, authenticated/i);
  assert.doesNotMatch(sql, /grant select on public\.verified_services to anon/i);
  assert.doesNotMatch(sql, /create policy[^;]+for insert/is);
  assert.doesNotMatch(sql, /create policy[^;]+for update/is);
});
test('verification logs and reviewer fields are absent from RPC output', () => {
  const returns = sql.slice(sql.indexOf('returns table'), sql.indexOf('language plpgsql'));
  assert.doesNotMatch(returns, /reviewed_by|created_by|notes|email|source_url|provider_links/);
});
test('RPC is bounded and validates coordinates radius limit language', () => {
  for (const token of ['INVALID_COORDINATES', 'INVALID_RADIUS', 'INVALID_LIMIT', 'INVALID_COUNTRY_CODE', 'INVALID_LANGUAGE']) assert.match(sql, new RegExp(token));
  assert.match(sql, /p_radius_meters > 50000/);
  assert.match(sql, /p_result_limit > 50/);
});
test('RPC filters active approved unexpired rows and uses ST_DWithin', () => {
  assert.match(sql, /service\.active = true/);
  assert.match(sql, /service\.verification_status = 'approved'/);
  assert.match(sql, /verification_expires_at > now\(\)/);
  assert.match(sql, /st_dwithin/i);
});
test('RPC execution is granted without direct public internal-table grants', () => assert.match(sql, /grant execute on function public\.nearby_verified_services[\s\S]+to anon, authenticated, service_role/i));
test('service role receives explicit backend management grants', () => {
  for (const table of ['service_categories', 'verified_services', 'service_verification_log', 'service_provider_links']) {
    assert.match(sql, new RegExp(`grant select, insert, update, delete on public\\.${table} to service_role`, 'i'));
  }
});

test('anonymous reads active approved record', () => assert.equal(publicVisible(fixture()), true));
test('anonymous cannot read draft record', () => assert.equal(publicVisible(fixture({ verification_status: 'draft' })), false));
test('anonymous cannot read expired record', () => assert.equal(publicVisible(fixture({ verification_expires_at: new Date(Date.now() - 1000).toISOString() })), false));
test('anonymous cannot read inactive record', () => assert.equal(publicVisible(fixture({ active: false })), false));
test('users cannot insert or update and service role remains RPC/admin boundary', () => {
  assert.match(sql, /revoke all on public\.service_verification_log from anon, authenticated/i);
  assert.match(sql, /to anon, authenticated, service_role/);
});

test('Supabase provider unconfigured is safe', async () => {
  const provider = createVerifiedServicesProvider(baseEnv);
  assert.equal((await provider.healthCheck()).configured, false);
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_NOT_CONFIGURED');
});
test('Supabase provider configured uses anon key and RPC parameters', async () => {
  let request;
  const env = { ...baseEnv, supabase: { url: 'https://project.supabase.co', anonKey: 'anon-public', serviceRoleKey: 'must-not-be-used' } };
  const provider = createVerifiedServicesProvider(env, {
    fetchImpl: async (url, options) => { request = { url, options }; return { ok: true, json: async () => [] }; },
  });
  await provider.searchNearby(params);
  assert.match(request.url, /rpc\/nearby_verified_services/);
  assert.equal(request.options.headers.apikey, 'anon-public');
  assert.doesNotMatch(JSON.stringify(request), /must-not-be-used/);
  assert.equal(JSON.parse(request.options.body).p_radius_meters, 5000);
});
test('Supabase timeout is normalized', async () => {
  const env = { ...baseEnv, supabase: { url: 'https://project.supabase.co', anonKey: 'anon', serviceRoleKey: '' } };
  const provider = createVerifiedServicesProvider(env, {
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' })))),
  });
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_TIMEOUT');
});
test('malformed database response is normalized', async () => {
  const env = { ...baseEnv, supabase: { url: 'https://project.supabase.co', anonKey: 'anon', serviceRoleKey: '' } };
  const provider = createVerifiedServicesProvider(env, { fetchImpl: async () => ({ ok: true, json: async () => ({ bad: true }) }) });
  await assert.rejects(() => provider.searchNearby(params), (error) => error.code === 'PROVIDER_UNAVAILABLE');
});
test('missing optional verified fields remain null', () => {
  const item = normalizeVerifiedService(fixture());
  assert.equal(item.address, null);
  assert.equal(item.phone, null);
  assert.equal(item.website, null);
});
test('expired and inactive database records are filtered defensively', () => {
  assert.equal(normalizeVerifiedService(fixture({ active: false })), null);
  assert.equal(normalizeVerifiedService(fixture({ verification_expires_at: new Date(Date.now() - 1).toISOString() })), null);
});
test('verified record normalization preserves badge metadata', () => {
  const item = normalizeResult(normalizeVerifiedService(fixture({ last_verified_at: '2026-07-01T00:00:00.000Z' })), params);
  assert.equal(item.provider, 'naero');
  assert.equal(item.verified, true);
  assert.equal(item.lastVerifiedAt, '2026-07-01T00:00:00.000Z');
});
test('empty database returns an honest empty result', async () => {
  const env = { ...baseEnv, supabase: { url: 'https://project.supabase.co', anonKey: 'anon', serviceRoleKey: '' } };
  const provider = createVerifiedServicesProvider(env, { fetchImpl: async () => ({ ok: true, json: async () => [] }) });
  assert.deepEqual(await provider.searchNearby(params), []);
});
test('Naero provider link deduplicates Google match', () => {
  const naero = normalizeResult(normalizeVerifiedService(fixture({ provider_links: [{ provider: 'google', providerId: 'g1' }] })), params);
  const google = normalizeResult({ provider: 'google', providerId: 'g1', name: 'Different provider spelling', latitude: 47.5, longitude: 19.04, sourceAttribution: 'Google' }, params);
  assert.equal(deduplicate([google, naero]).length, 1);
});
test('Naero provider link deduplicates OSM match', () => {
  const naero = normalizeResult(normalizeVerifiedService(fixture({ provider_links: [{ provider: 'osm', providerId: 'node/1' }] })), params);
  const osm = normalizeResult({ provider: 'osm', providerId: 'node/1', name: 'Different provider spelling', latitude: 47.5, longitude: 19.04, sourceAttribution: 'OSM' }, params);
  assert.equal(deduplicate([osm, naero]).length, 1);
});
test('verified fields take precedence while truthful gaps are filled', () => {
  const naero = normalizeResult(normalizeVerifiedService(fixture({ name: 'Verified Name', phone: null })), params);
  const external = normalizeResult({ provider: 'google', providerId: 'g1', name: 'Verified Name', latitude: 47.5, longitude: 19.04, phone: '123', address: 'Main 1', sourceAttribution: 'Google' }, params);
  const merged = deduplicate([external, naero])[0];
  assert.equal(merged.name, 'Verified Name');
  assert.equal(merged.verified, true);
  assert.equal(merged.phone, '123');
  assert.match(merged.sourceAttribution, /Google/);
});
test('verified result receives a close-range ranking boost', () => {
  const verified = normalizeResult(normalizeVerifiedService(fixture()), params);
  const external = normalizeResult({ provider: 'google', providerId: 'g2', name: 'External', latitude: 47.5001, longitude: 19.04, sourceAttribution: 'Google', confidence: 'high' }, params);
  assert.equal(rank([external, verified])[0].provider, 'naero');
});

test('controlled city fixtures stay within their own radius', () => {
  const cities = [
    ['Budapest', 47.4979, 19.0402], ['Győr', 47.6875, 17.6504],
    ['Vienna', 48.2082, 16.3738], ['Tunis', 36.8065, 10.1815],
  ];
  for (const [name, latitude, longitude] of cities) {
    const context = { ...params, latitude, longitude, radius: 1000 };
    const inside = normalizeResult(normalizeVerifiedService(fixture({ name: `${name} controlled fixture`, latitude: latitude + 0.001, longitude })), context);
    const outside = normalizeResult(normalizeVerifiedService(fixture({ id: `${name}-outside`, latitude: latitude + 1, longitude })), context);
    assert.ok(inside && inside.distanceMeters > 0 && inside.distanceMeters < 1000);
    assert.equal(inside.verified, true);
    assert.equal(outside, null);
  }
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`PostGIS verified-service tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
