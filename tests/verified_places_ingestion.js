const assert = require('node:assert/strict');
const { createManifest, validateManifest, digestContent, normalizeElement, stableStringify } = require('../backend/src/ingestion/manifest');
const { acquire, MAX_RESPONSE_BYTES } = require('../backend/src/ingestion/acquire');
const { getTarget } = require('../backend/src/ingestion/targets');
const { parseArgs } = require('../backend/scripts/verifiedPlacesCli');
const { requireApplyAuthorization, applyManifest, approveServices } = require('../backend/src/ingestion/workflow');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const target = getTarget('vienna', 'hospital');
function element(overrides = {}) {
  return { type: 'node', id: 1, lat: target.latitude, lon: target.longitude, tags: { amenity: 'hospital', name: 'General Hospital', 'addr:country': 'AT', 'addr:city': 'Vienna' }, ...overrides };
}
function manifest(elements = [element()], acquiredAt = '2026-08-12T12:00:00.000Z') {
  return createManifest({ city: 'vienna', category: 'hospital', elements, acquiredAt, queryFingerprint: 'a'.repeat(64) });
}
function response(payload, options = {}) {
  const bytes = new TextEncoder().encode(typeof payload === 'string' ? payload : JSON.stringify(payload));
  return { ok: options.ok ?? true, status: options.status ?? 200, headers: { get: () => options.length ?? String(bytes.byteLength) }, arrayBuffer: async () => bytes.buffer };
}

test('fixed targets accept only reviewed city/category pairs', () => {
  assert.ok(getTarget('vienna', 'hospital')); assert.ok(getTarget('gyor', 'hospital'));
  assert.equal(getTarget('budapest', 'hospital'), null); assert.equal(getTarget('vienna', 'clinic'), null);
});
test('CLI rejects arbitrary URL, coordinates, city, and category arguments', () => {
  assert.throws(() => parseArgs(['acquire', '--url', 'https://example.test']), /Unsupported/);
  assert.throws(() => parseArgs(['acquire', '--latitude', '1']), /Unsupported/);
  assert.rejects(() => acquire({ city: 'other', category: 'hospital', fetchImpl: async () => response({ elements: [] }) }), (error) => error.code === 'UNSUPPORTED_TARGET');
});
test('acquisition rejects non-2xx, oversized, invalid JSON and invalid envelope', async () => {
  await assert.rejects(() => acquire({ city: 'vienna', category: 'hospital', fetchImpl: async () => response({}, { ok: false, status: 503 }) }), (error) => error.code === 'UPSTREAM_HTTP_ERROR');
  await assert.rejects(() => acquire({ city: 'vienna', category: 'hospital', fetchImpl: async () => response({}, { length: MAX_RESPONSE_BYTES + 1 }) }), (error) => error.code === 'RESPONSE_TOO_LARGE');
  await assert.rejects(() => acquire({ city: 'vienna', category: 'hospital', fetchImpl: async () => response('{bad') }), (error) => error.code === 'INVALID_JSON');
  await assert.rejects(() => acquire({ city: 'vienna', category: 'hospital', fetchImpl: async () => response({ data: [] }) }), (error) => error.code === 'INVALID_ENVELOPE');
});
test('acquisition timeout is normalized without raw error leakage', async () => {
  const abort = Object.assign(new Error('secret host'), { name: 'AbortError' });
  await assert.rejects(() => acquire({ city: 'vienna', category: 'hospital', fetchImpl: async () => { throw abort; } }), (error) => error.code === 'ACQUISITION_TIMEOUT' && !error.message.includes('secret'));
});
test('normalization preserves supported provenance and does not infer fields', () => {
  const item = normalizeElement(element({ tags: { amenity: 'hospital', name: 'A', operator: 'B', opening_hours: 'Mo-Fr 08:00-16:00', wheelchair: 'yes' } }), target);
  assert.equal(item.providerId, 'node/1'); assert.equal(item.fields.organizationName, 'B'); assert.equal(item.fields.openingHours, 'Mo-Fr 08:00-16:00');
  for (const key of ['rating', 'reviewCount', 'isOpenNow', 'recommendation', 'price']) assert.equal(item.fields[key], undefined);
  assert.equal(item.fieldProvenance.city, 'target_context');
});
test('invalid coordinates, outside boundary, missing name, wrong category and country are rejected', () => {
  assert.equal(normalizeElement(element({ lat: 100 }), target).reasonCode, 'INVALID_COORDINATES');
  assert.equal(normalizeElement(element({ lat: 47 }), target).reasonCode, 'OUTSIDE_BOUNDARY');
  assert.equal(normalizeElement(element({ tags: { amenity: 'hospital' } }), target).reasonCode, 'MISSING_NAME');
  assert.equal(normalizeElement(element({ tags: { amenity: 'clinic', name: 'X' } }), target).reasonCode, 'WRONG_CATEGORY');
  assert.equal(normalizeElement(element({ tags: { amenity: 'hospital', name: 'X', 'addr:country': 'HU' } }), target).reasonCode, 'WRONG_COUNTRY');
});
test('exact identity and evidenced node/way duplicates are deterministic', () => {
  const exact = manifest([element(), element()]); assert.equal(exact.counts.duplicate, 1);
  const related = manifest([element(), element({ type: 'relation', id: 2, tags: { amenity: 'hospital', name: 'General Hospital', phone: '1' } })]);
  assert.equal(related.candidates.find((item) => item.providerId === 'relation/2').classification, 'accepted');
  assert.equal(related.counts.duplicate, 1);
});
test('similar but insufficient identity is retained as ambiguous', () => {
  const result = manifest([element(), element({ id: 2, lat: target.latitude + 0.00035 })]);
  assert.equal(result.counts.ambiguous, 1); assert.equal(result.candidates.find((item) => item.classification === 'ambiguous').reasonCode, 'POSSIBLE_SAME_HOSPITAL');
});
test('canonical ordering and digest exclude acquisition timestamp', () => {
  const a = manifest([element({ id: 2 }), element({ id: 1 })], '2026-01-01T00:00:00Z');
  const b = manifest([element({ id: 1 }), element({ id: 2 })], '2026-02-01T00:00:00Z');
  assert.equal(a.digest, b.digest); assert.equal(a.candidates.map((item) => item.providerId).join(','), b.candidates.map((item) => item.providerId).join(','));
});
test('validate accepts intact manifest and rejects tampering/forbidden fields', () => {
  const good = manifest(); assert.equal(validateManifest(good).valid, true);
  const tampered = structuredClone(good); tampered.candidates[0].fields.name = 'Changed'; assert.equal(validateManifest(tampered).code, 'DIGEST_MISMATCH');
  const forbidden = structuredClone(good); forbidden.candidates[0].fields.rating = 5; forbidden.digest = digestContent(forbidden); assert.equal(validateManifest(forbidden).code, 'FORBIDDEN_FIELD');
});
test('canonical serialization ignores hostile inherited getters', () => {
  let called = false; const hostile = Object.create({ get token() { called = true; return 'secret'; } }); hostile.safe = 'value';
  assert.equal(stableStringify(hostile), '{"safe":"value"}'); assert.equal(called, false);
});

class MemoryRepository {
  constructor(failAt = null) { this.state = { services: [], links: [], logs: [] }; this.failAt = failAt; }
  async transaction(callback) {
    const original = structuredClone(this.state); let calls = 0;
    const fail = () => { calls += 1; if (calls === this.failAt) throw new Error('isolated failure'); };
    const tx = {
      findByProviderIdentity: async (provider, providerId) => { const link = this.state.links.find((item) => item.provider === provider && item.providerId === providerId); return link && this.state.services.find((item) => item.id === link.serviceId); },
      insertDraft: async (item) => { fail(); const row = { id: `service-${this.state.services.length + 1}`, status: 'draft', item }; this.state.services.push(row); return row; },
      insertProviderLink: async (serviceId, provider, providerId) => { fail(); this.state.links.push({ serviceId, provider, providerId }); },
      insertLog: async (serviceId, action, status) => { fail(); this.state.logs.push({ serviceId, action, status }); },
      markPending: async (id) => { fail(); this.state.services.find((row) => row.id === id).status = 'pending'; },
      approve: async (id, details) => { fail(); Object.assign(this.state.services.find((row) => row.id === id), { status: 'approved', ...details }); },
    };
    try { return await callback(tx); } catch (error) { this.state = original; throw error; }
  }
}
const auth = { production: true, expectedProject: 'rqsqmepxjkgfgvrkwvhn', reviewedDigest: manifest().digest, operatorId: 'operator', credential: 'runtime-only' };
test('apply safety gates fail closed', () => {
  for (const key of ['production', 'expectedProject', 'reviewedDigest', 'operatorId', 'credential']) assert.throws(() => requireApplyAuthorization({ ...auth, [key]: null }));
});
test('apply creates draft/link/log/pending and repeated apply is idempotent', async () => {
  const repo = new MemoryRepository(); const value = manifest();
  await applyManifest(value, { ...auth, reviewedDigest: value.digest }, repo); await applyManifest(value, { ...auth, reviewedDigest: value.digest }, repo);
  assert.equal(repo.state.services.length, 1); assert.equal(repo.state.links.length, 1); assert.equal(repo.state.services[0].status, 'pending');
});
test('transaction rolls back every component failure', async () => {
  const repo = new MemoryRepository(3); const value = manifest();
  await assert.rejects(() => applyManifest(value, { ...auth, reviewedDigest: value.digest }, repo)); assert.deepEqual(repo.state, { services: [], links: [], logs: [] });
});
test('approval is separate and assigns expiry', async () => {
  const repo = new MemoryRepository(); const value = manifest();
  await applyManifest(value, { ...auth, reviewedDigest: value.digest }, repo);
  const result = await approveServices(['service-1'], { reviewerId: 'reviewer', verifiedAt: '2026-01-01T00:00:00Z' }, repo);
  assert.equal(repo.state.services[0].status, 'approved'); assert.equal(result[0].expiresAt, '2026-06-30T00:00:00.000Z');
});
test('source contains no credentials or raw-response logging', () => {
  const all = [require.resolve('../backend/src/ingestion/acquire'), require.resolve('../backend/src/ingestion/manifest'), require.resolve('../backend/scripts/verifiedPlacesCli')].map((file) => require('node:fs').readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(all, /SUPABASE_SERVICE_ROLE_KEY|authorization\s*:|cookie\s*:|console\.log\([^)]*(latitude|longitude|response)/i);
});
test('Migration 005 RLS remains production-safe and contains no service inserts', () => {
  const sql = require('node:fs').readFileSync(require.resolve('../backend/db/migrations/005_postgis_verified_services.sql'), 'utf8');
  assert.match(sql, /force row level security/i); assert.doesNotMatch(sql, /insert into public\.verified_services/i);
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); } catch (error) { console.error(`FAIL ${item.name}\n${error.stack}`); }
  }
  console.log(`Verified places ingestion tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
