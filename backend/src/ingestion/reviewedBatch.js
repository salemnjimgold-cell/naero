const { createHash } = require('node:crypto');
const { stableStringify, validateManifest } = require('./manifest');

const EXPECTED_REVIEW_DIGEST = 'cb47329fe4f8280d53318ebe1c83b9ac9e2e6a4495b60a1331ff8b7841c52f76';
const EXPECTED_DECISIONS = 33;
const EXPECTED_ACCEPTS = Object.freeze({ vienna: 18, gyor: 1 });
const ALLOWED_DECISIONS = new Set(['ACCEPT', 'HOLD', 'REJECT', 'OUT_OF_TARGET', 'CHILD_FACILITY']);

function fail(code) { throw Object.assign(new Error(`Reviewed batch validation failed: ${code}`), { code }); }

function reviewDigest(review) {
  const content = { ...review };
  delete content.reviewedAt;
  delete content.reviewDigest;
  return createHash('sha256').update(stableStringify(content)).digest('hex');
}

function validateReviewedBatch(review, manifests) {
  if (!review || !Array.isArray(review.decisions) || !manifests || typeof manifests !== 'object') fail('INVALID_REVIEW_ARTIFACT');
  if (review.reviewDigest !== EXPECTED_REVIEW_DIGEST || reviewDigest(review) !== EXPECTED_REVIEW_DIGEST) fail('REVIEW_DIGEST_MISMATCH');
  if (review.decisions.length !== EXPECTED_DECISIONS) fail('REVIEW_DECISION_COUNT_MISMATCH');

  const acquisition = new Map();
  for (const target of Object.keys(EXPECTED_ACCEPTS)) {
    const manifest = manifests[target];
    if (!manifest || !validateManifest(manifest).valid) fail('INVALID_SOURCE_MANIFEST');
    if (manifest.digest !== review.sourceManifests?.[target]) fail('SOURCE_MANIFEST_DIGEST_MISMATCH');
    for (const candidate of manifest.candidates) {
      const identity = `${target}:${candidate.provider}:${candidate.providerId}`;
      if (acquisition.has(identity)) fail('DUPLICATE_ACQUISITION_IDENTITY');
      acquisition.set(identity, candidate);
    }
  }

  const reviewed = new Set();
  const counts = { ACCEPT: 0, HOLD: 0, REJECT: 0, OUT_OF_TARGET: 0, CHILD_FACILITY: 0 };
  const targetAccepts = { vienna: 0, gyor: 0 };
  const candidates = [];
  for (const decision of review.decisions) {
    if (!Object.hasOwn(EXPECTED_ACCEPTS, decision.target) || !ALLOWED_DECISIONS.has(decision.decision)) fail('INVALID_REVIEW_DECISION');
    const identity = `${decision.target}:osm:${decision.providerId}`;
    if (reviewed.has(identity)) fail('DUPLICATE_REVIEW_IDENTITY');
    reviewed.add(identity);
    const source = acquisition.get(identity);
    if (!source) fail('MISSING_ACQUISITION_IDENTITY');
    if (decision.originalManifestDigest !== review.sourceManifests[decision.target]) fail('REVIEW_SOURCE_REFERENCE_MISMATCH');
    if (decision.originalClassification !== source.classification) fail('CLASSIFICATION_REFERENCE_MISMATCH');
    counts[decision.decision] += 1;
    if (decision.decision === 'ACCEPT') {
      targetAccepts[decision.target] += 1;
      candidates.push({
        ...source,
        fields: { ...source.fields, name: decision.name || source.fields.name },
        review: {
          digest: EXPECTED_REVIEW_DIGEST,
          target: decision.target,
          decision: 'ACCEPT',
          confidence: decision.confidence,
          reasonCode: decision.reasonCode,
        },
      });
    }
  }
  if (reviewed.size !== acquisition.size || [...acquisition.keys()].some((identity) => !reviewed.has(identity))) fail('REVIEW_COVERAGE_MISMATCH');
  if (counts.ACCEPT !== 19 || targetAccepts.vienna !== EXPECTED_ACCEPTS.vienna || targetAccepts.gyor !== EXPECTED_ACCEPTS.gyor) fail('ACCEPT_COUNT_MISMATCH');
  candidates.sort((a, b) => `${a.review.target}:${a.providerId}`.localeCompare(`${b.review.target}:${b.providerId}`));
  return { digest: EXPECTED_REVIEW_DIGEST, candidates, counts, targetAccepts };
}

module.exports = { EXPECTED_REVIEW_DIGEST, EXPECTED_DECISIONS, EXPECTED_ACCEPTS, reviewDigest, validateReviewedBatch };
