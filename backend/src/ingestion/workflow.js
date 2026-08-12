function requireApplyAuthorization(options) {
  if (options.production !== true) throw Object.assign(new Error('Explicit production authorization is required.'), { code: 'PRODUCTION_FLAG_REQUIRED' });
  if (options.expectedProject !== 'rqsqmepxjkgfgvrkwvhn') throw Object.assign(new Error('Expected project does not match.'), { code: 'PROJECT_MISMATCH' });
  if (!/^[a-f0-9]{64}$/.test(options.reviewedDigest || '')) throw Object.assign(new Error('Reviewed manifest digest is required.'), { code: 'DIGEST_REQUIRED' });
  if (!options.operatorId) throw Object.assign(new Error('Operator identity is required.'), { code: 'OPERATOR_REQUIRED' });
  if (!options.credential) throw Object.assign(new Error('Runtime administrative credential is required.'), { code: 'CREDENTIAL_REQUIRED' });
}
async function applyManifest(manifest, options, repository) {
  requireApplyAuthorization(options);
  if (manifest.digest !== options.reviewedDigest) throw Object.assign(new Error('Reviewed digest does not match manifest.'), { code: 'DIGEST_MISMATCH' });
  return repository.transaction(async (tx) => {
    const results = [];
    for (const item of manifest.candidates.filter((candidate) => candidate.classification === 'accepted')) {
      const existing = await tx.findByProviderIdentity('osm', item.providerId);
      if (existing) { results.push({ providerId: item.providerId, serviceId: existing.id, action: 'existing' }); continue; }
      const service = await tx.insertDraft(item, options.operatorId);
      await tx.insertProviderLink(service.id, 'osm', item.providerId);
      await tx.insertLog(service.id, 'created', 'draft', options.operatorId, item.sourceReference);
      await tx.markPending(service.id, options.operatorId);
      await tx.insertLog(service.id, 'submitted', 'pending', options.operatorId, item.sourceReference);
      results.push({ providerId: item.providerId, serviceId: service.id, action: 'created' });
    }
    return results;
  });
}
async function approveServices(serviceIds, options, repository) {
  if (!options.reviewerId) throw Object.assign(new Error('Reviewer identity is required.'), { code: 'REVIEWER_REQUIRED' });
  const verifiedAt = options.verifiedAt || new Date().toISOString();
  const expiresAt = new Date(new Date(verifiedAt).getTime() + 180 * 86400000).toISOString();
  return repository.transaction(async (tx) => Promise.all(serviceIds.map(async (id) => {
    await tx.approve(id, { reviewerId: options.reviewerId, confidence: options.confidence || 'medium', verifiedAt, expiresAt });
    await tx.insertLog(id, 'approved', 'approved', options.reviewerId, null);
    return { id, verifiedAt, expiresAt };
  })));
}

module.exports = { requireApplyAuthorization, applyManifest, approveServices };
