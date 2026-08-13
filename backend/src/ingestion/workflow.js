const { EXPECTED_REVIEW_DIGEST, validateReviewedBatch } = require('./reviewedBatch');

function workflowError(code, message) { return Object.assign(new Error(message), { code }); }

function requireApplyAuthorization(options) {
  if (options.production !== true) throw workflowError('PRODUCTION_FLAG_REQUIRED', 'Explicit production authorization is required.');
  if (options.expectedProject !== 'rqsqmepxjkgfgvrkwvhn') throw workflowError('PROJECT_MISMATCH', 'Expected project does not match.');
  if (options.reviewedDigest !== EXPECTED_REVIEW_DIGEST) throw workflowError('DIGEST_MISMATCH', 'Canonical review digest does not match.');
  if (!options.operatorId) throw workflowError('OPERATOR_REQUIRED', 'Operator identity is required.');
  if (!options.credential) throw workflowError('CREDENTIAL_REQUIRED', 'Runtime administrative credential is required.');
}

function requireReviewedWorkflow() {
  throw workflowError('REVIEW_ARTIFACT_REQUIRED', 'Acquisition manifests and arbitrary service identifiers cannot authorize Phase 2C writes.');
}

function requireApprovalAuthorization(options) {
  if (options.production !== true) throw workflowError('PRODUCTION_FLAG_REQUIRED', 'Explicit production authorization is required.');
  if (options.expectedProject !== 'rqsqmepxjkgfgvrkwvhn') throw workflowError('PROJECT_MISMATCH', 'Expected project does not match.');
  if (options.reviewedDigest !== EXPECTED_REVIEW_DIGEST) throw workflowError('DIGEST_MISMATCH', 'Canonical review digest does not match.');
  if (!options.reviewerId) throw workflowError('REVIEWER_REQUIRED', 'Reviewer identity is required.');
  if (!options.credential) throw workflowError('CREDENTIAL_REQUIRED', 'Runtime administrative credential is required.');
}

async function applyReviewedBatch(review, manifests, options, repository) {
  requireApplyAuthorization(options);
  const batch = validateReviewedBatch(review, manifests);
  return repository.transaction(async (tx) => {
    const results = [];
    for (const item of batch.candidates) {
      let service = await tx.findByProviderIdentity(item.provider, item.providerId);
      let action = 'existing';
      if (!service) {
        service = await tx.insertDraft(item, options.operatorId);
        await tx.insertProviderLink(service.id, item.provider, item.providerId);
        await tx.insertLog(service.id, 'created', 'draft', options.operatorId, item.sourceReference, batch.digest);
        await tx.markPending(service.id, options.operatorId);
        await tx.insertLog(service.id, 'submitted', 'pending', options.operatorId, item.sourceReference, batch.digest);
        action = 'created';
      }
      await tx.registerReviewedBatch(service.id, batch.digest, item.provider, item.providerId);
      results.push({ provider: item.provider, providerId: item.providerId, serviceId: service.id, action });
    }
    if (results.length !== batch.candidates.length) throw workflowError('APPLY_COUNT_MISMATCH', 'Applied batch count does not match reviewed batch.');
    return results;
  });
}

function verifyApprovalRows(rows, batch) {
  if (!Array.isArray(rows) || rows.length !== batch.candidates.length) throw workflowError('APPROVAL_BATCH_COUNT_MISMATCH', 'Approval batch count does not match review.');
  const expected = new Set(batch.candidates.map((item) => `${item.provider}:${item.providerId}`));
  const serviceIds = new Set();
  for (const row of rows) {
    const identity = `${row.provider}:${row.providerId}`;
    if (!expected.delete(identity)) throw workflowError('UNREVIEWED_APPROVAL_TARGET', 'Approval batch contains an unreviewed or duplicate provider identity.');
    if (!row.serviceId || serviceIds.has(row.serviceId)) throw workflowError('INVALID_APPROVAL_SERVICE', 'Approval target service identity is missing or duplicated.');
    if (!['pending', 'approved'].includes(row.verificationStatus)) throw workflowError('INVALID_APPROVAL_STATE', 'Approval target is not pending or already approved.');
    serviceIds.add(row.serviceId);
  }
  if (expected.size) throw workflowError('MISSING_APPROVAL_TARGET', 'A reviewed provider identity has no service/provider link.');
  return rows;
}

async function preflightReviewedApproval(review, manifests, repository) {
  const batch = validateReviewedBatch(review, manifests);
  const rows = await repository.listReviewedBatch(batch.digest);
  return { batch, rows: verifyApprovalRows(rows, batch) };
}

async function approveReviewedBatch(review, manifests, options, repository) {
  requireApprovalAuthorization(options);
  const verifiedAt = options.verifiedAt || new Date().toISOString();
  const expiresAt = new Date(new Date(verifiedAt).getTime() + 180 * 86400000).toISOString();
  return repository.transaction(async (tx) => {
    const batch = validateReviewedBatch(review, manifests);
    const rows = verifyApprovalRows(await tx.listReviewedBatch(batch.digest), batch);
    const results = [];
    for (const row of rows) {
      if (row.verificationStatus === 'pending') {
        await tx.approve(row.serviceId, { reviewerId: options.reviewerId, confidence: options.confidence || 'medium', verifiedAt, expiresAt });
        await tx.insertLog(row.serviceId, 'approved', 'approved', options.reviewerId, null, batch.digest);
      }
      results.push({ id: row.serviceId, providerId: row.providerId, verifiedAt, expiresAt, action: row.verificationStatus === 'approved' ? 'existing' : 'approved' });
    }
    return results;
  });
}

async function preflightReviewedRecovery(review, manifests, repository) {
  const { batch, rows } = await preflightReviewedApproval(review, manifests, repository);
  const approved = rows.some((row) => row.verificationStatus === 'approved');
  return {
    digest: batch.digest,
    serviceIds: rows.map((row) => row.serviceId).sort(),
    mode: approved ? 'DEACTIVATE_WITH_AUDIT' : 'TRANSACTIONAL_DELETE_UNAPPROVED',
    executable: false,
  };
}

module.exports = {
  requireApplyAuthorization,
  requireApprovalAuthorization,
  applyManifest: requireReviewedWorkflow,
  approveServices: requireReviewedWorkflow,
  applyReviewedBatch,
  preflightReviewedApproval,
  approveReviewedBatch,
  preflightReviewedRecovery,
  verifyApprovalRows,
};
