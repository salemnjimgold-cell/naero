const FLAG_DEFAULTS = Object.freeze({
  contextualCompass: false,
  newNavigation: false,
  newOnboarding: false,
  newDiscover: false,
  contextualHome: false,
  myNaero: false,
  settlementBasics: false,
  askNaeroV2: false,
});

function parseFlagValue(value) {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return null;
}

function resolveFeatureFlags(overrides = {}) {
  const result = { ...FLAG_DEFAULTS };
  for (const key of Object.keys(FLAG_DEFAULTS)) {
    const parsed = parseFlagValue(overrides[key]);
    if (parsed !== null) result[key] = parsed;
  }
  return Object.freeze(result);
}

module.exports = { FLAG_DEFAULTS, parseFlagValue, resolveFeatureFlags };
