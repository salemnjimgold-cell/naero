const SOURCE_ROLES = Object.freeze({
  VERIFIED: 'VERIFIED',
  DISCOVERED: 'DISCOVERED',
  LIVE: 'LIVE',
});

function sourceRole(provider) {
  if (Object.values(SOURCE_ROLES).includes(provider?.sourceRole)) return provider.sourceRole;
  return provider?.name === 'naero' ? SOURCE_ROLES.VERIFIED : SOURCE_ROLES.LIVE;
}

function tier(provider) {
  const role = sourceRole(provider);
  if (role === SOURCE_ROLES.VERIFIED) return 0;
  if (role === SOURCE_ROLES.DISCOVERED) return 1;
  return 2;
}

function orderProviders(providers) {
  return providers
    .map((provider, index) => ({ provider, index }))
    .sort((a, b) => tier(a.provider) - tier(b.provider) || a.index - b.index)
    .map(({ provider }) => provider);
}

function isSufficient(items, params) {
  return Array.isArray(items) && items.length >= params.limit;
}

function coverageStatus({ items, params, failures, stale = false }) {
  if (stale) return 'stale';
  if (isSufficient(items, params)) return 'sufficient';
  if (items.length && failures.length) return 'partial';
  return 'exhausted';
}

module.exports = { SOURCE_ROLES, sourceRole, orderProviders, isSufficient, coverageStatus };
