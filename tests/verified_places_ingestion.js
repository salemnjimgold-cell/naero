const assert = require('node:assert/strict');
const { createManifest, validateManifest, digestContent, normalizeElement, stableStringify } = require('../backend/src/ingestion/manifest');
const { acquire, MAX_RESPONSE_BYTES } = require('../backend/src/ingestion/acquire');
const { getTarget } = require('../backend/src/ingestion/targets');
const { parseArgs, main: ingestionMain } = require('../backend/scripts/verifiedPlacesCli');
const {
  requireApplyAuthorization, requireApprovalAuthorization, applyManifest, approveServices, applyReviewedBatch,
  preflightReviewedApproval, approveReviewedBatch, preflightReviewedRecovery,
} = require('../backend/src/ingestion/workflow');
const { EXPECTED_REVIEW_DIGEST, reviewDigest, validateReviewedBatch } = require('../backend/src/ingestion/reviewedBatch');
const fs = require('node:fs');
const path = require('node:path');

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
  assert.throws(() => parseArgs(['apply', '--manifest', 'acquisition.json']), /Unsupported/);
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
  constructor(failAt = null) { this.state = { services: [], links: [], logs: [], batches: [] }; this.failAt = failAt; }
  async listReviewedBatch(digest) {
    return this.state.batches.filter((item) => item.digest === digest).map((item) => {
      const service = this.state.services.find((row) => row.id === item.serviceId);
      return { ...item, verificationStatus: service?.status };
    });
  }
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
      registerReviewedBatch: async (serviceId, digest, provider, providerId) => {
        fail();
        if (!this.state.batches.some((item) => item.digest === digest && item.provider === provider && item.providerId === providerId)) {
          this.state.batches.push({ serviceId, digest, provider, providerId });
        }
      },
      listReviewedBatch: async (digest) => this.listReviewedBatch(digest),
    };
    try { return await callback(tx); } catch (error) { this.state = original; throw error; }
  }
}
const artifactRoot = path.resolve(process.cwd(), 'docs/recovery/milestone-3d/phase-2b');
const review = JSON.parse(fs.readFileSync(path.join(artifactRoot, 'verified-places.review.json'), 'utf8'));
const sourceManifests = {
  vienna: JSON.parse(fs.readFileSync(path.join(artifactRoot, 'vienna-hospitals.manifest.json'), 'utf8')),
  gyor: JSON.parse(fs.readFileSync(path.join(artifactRoot, 'gyor-hospitals.manifest.json'), 'utf8')),
};
test('CLI validates the reviewed batch and remains production-write disabled', async () => {
  await assert.rejects(() => ingestionMain([
    'apply', '--review', path.join(artifactRoot, 'verified-places.review.json'),
    '--vienna-manifest', path.join(artifactRoot, 'vienna-hospitals.manifest.json'),
    '--gyor-manifest', path.join(artifactRoot, 'gyor-hospitals.manifest.json'),
    '--production', 'true', '--expected-project', 'rqsqmepxjkgfgvrkwvhn',
    '--reviewed-digest', EXPECTED_REVIEW_DIGEST, '--operator', 'operator',
  ]), (error) => error.code === 'PRODUCTION_WRITE_DISABLED');
});
const auth = { production: true, expectedProject: 'rqsqmepxjkgfgvrkwvhn', reviewedDigest: EXPECTED_REVIEW_DIGEST, operatorId: 'operator', credential: 'runtime-only' };
test('apply safety gates fail closed', () => {
  for (const key of ['production', 'expectedProject', 'reviewedDigest', 'operatorId', 'credential']) assert.throws(() => requireApplyAuthorization({ ...auth, [key]: null }));
  const approvalAuth = { ...auth, reviewerId: 'reviewer' };
  for (const key of ['production', 'expectedProject', 'reviewedDigest', 'reviewerId', 'credential']) assert.throws(() => requireApprovalAuthorization({ ...approvalAuth, [key]: null }));
});
test('legacy acquisition apply and arbitrary approval fail closed', async () => {
  assert.throws(() => applyManifest(manifest(), auth, new MemoryRepository()), (error) => error.code === 'REVIEW_ARTIFACT_REQUIRED');
  assert.throws(() => approveServices(['arbitrary-service'], { reviewerId: 'reviewer' }, new MemoryRepository()), (error) => error.code === 'REVIEW_ARTIFACT_REQUIRED');
});
test('canonical review creates exactly 18 Vienna and 1 Gyor candidates', () => {
  const batch = validateReviewedBatch(review, sourceManifests);
  assert.equal(reviewDigest(review), EXPECTED_REVIEW_DIGEST);
  assert.equal(batch.candidates.length, 19); assert.deepEqual(batch.targetAccepts, { vienna: 18, gyor: 1 });
  assert.deepEqual(batch.counts, { ACCEPT: 19, HOLD: 5, REJECT: 2, OUT_OF_TARGET: 2, CHILD_FACILITY: 5 });
  assert.ok(batch.candidates.every((item) => item.review.decision === 'ACCEPT'));
});
test('review digest, missing record, duplicate identity and manifest tampering fail closed', () => {
  const wrongDigest = structuredClone(review); wrongDigest.reviewDigest = '0'.repeat(64);
  assert.throws(() => validateReviewedBatch(wrongDigest, sourceManifests), (error) => error.code === 'REVIEW_DIGEST_MISMATCH');
  const missing = structuredClone(review); missing.decisions.pop();
  assert.throws(() => validateReviewedBatch(missing, sourceManifests), (error) => error.code === 'REVIEW_DIGEST_MISMATCH' || error.code === 'REVIEW_DECISION_COUNT_MISMATCH');
  const duplicate = structuredClone(review); duplicate.decisions[1] = structuredClone(duplicate.decisions[0]);
  duplicate.reviewDigest = reviewDigest(duplicate);
  assert.throws(() => validateReviewedBatch(duplicate, sourceManifests));
  const tamperedManifests = structuredClone(sourceManifests); tamperedManifests.vienna.candidates[0].fields.name = 'Changed';
  assert.throws(() => validateReviewedBatch(review, tamperedManifests), (error) => error.code === 'INVALID_SOURCE_MANIFEST');
});
test('reviewed display-name override is projected without mutating acquisition evidence', () => {
  const before = stableStringify(sourceManifests);
  const batch = validateReviewedBatch(review, sourceManifests);
  const projected = batch.candidates.find((item) => item.providerId === 'way/23304539');
  const acquired = sourceManifests.vienna.candidates.find((item) => item.providerId === 'way/23304539');
  assert.equal(projected.fields.name, 'Traumazentrum Wien – Standort Meidling');
  assert.notEqual(projected.fields.name, acquired.fields.name);
  assert.equal(stableStringify(sourceManifests), before);
});
test('reviewed apply creates only the exact batch and is idempotent', async () => {
  const repo = new MemoryRepository();
  const first = await applyReviewedBatch(review, sourceManifests, auth, repo);
  const second = await applyReviewedBatch(review, sourceManifests, auth, repo);
  assert.equal(first.length, 19); assert.equal(second.length, 19);
  assert.equal(repo.state.services.length, 19); assert.equal(repo.state.links.length, 19); assert.equal(repo.state.batches.length, 19);
  assert.ok(repo.state.services.every((item) => item.status === 'pending'));
});
test('transaction rolls back every component failure', async () => {
  const repo = new MemoryRepository(3);
  await assert.rejects(() => applyReviewedBatch(review, sourceManifests, auth, repo));
  assert.deepEqual(repo.state, { services: [], links: [], logs: [], batches: [] });
});
test('approval derives exact linked batch, rejects missing/extra links, and is idempotent', async () => {
  const repo = new MemoryRepository(); await applyReviewedBatch(review, sourceManifests, auth, repo);
  const preflight = await preflightReviewedApproval(review, sourceManifests, repo); assert.equal(preflight.rows.length, 19);
  const missing = structuredClone(repo.state.batches.pop());
  await assert.rejects(() => preflightReviewedApproval(review, sourceManifests, repo), (error) => error.code === 'APPROVAL_BATCH_COUNT_MISMATCH');
  repo.state.batches.push(missing, { ...missing, providerId: 'node/999999', serviceId: 'extra' });
  await assert.rejects(() => preflightReviewedApproval(review, sourceManifests, repo), (error) => ['APPROVAL_BATCH_COUNT_MISMATCH', 'UNREVIEWED_APPROVAL_TARGET'].includes(error.code));
  repo.state.batches.pop();
  const options = { ...auth, reviewerId: 'reviewer', verifiedAt: '2026-01-01T00:00:00Z' };
  const first = await approveReviewedBatch(review, sourceManifests, options, repo);
  const second = await approveReviewedBatch(review, sourceManifests, options, repo);
  assert.equal(first.length, 19); assert.ok(first.every((item) => item.expiresAt === '2026-06-30T00:00:00.000Z'));
  assert.ok(second.every((item) => item.action === 'existing'));
});
test('recovery preflight is exact and never executes a mutation', async () => {
  const repo = new MemoryRepository(); await applyReviewedBatch(review, sourceManifests, auth, repo);
  const before = structuredClone(repo.state);
  const recovery = await preflightReviewedRecovery(review, sourceManifests, repo);
  assert.equal(recovery.mode, 'TRANSACTIONAL_DELETE_UNAPPROVED'); assert.equal(recovery.executable, false); assert.equal(recovery.serviceIds.length, 19);
  assert.deepEqual(repo.state, before);
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
