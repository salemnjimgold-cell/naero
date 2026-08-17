const COVERAGE_STATES = Object.freeze({
  UNSEEN: 'UNSEEN',
  SUFFICIENT: 'SUFFICIENT',
  PARTIAL: 'PARTIAL',
  EXHAUSTED: 'EXHAUSTED',
  STALE: 'STALE',
  REFRESHING: 'REFRESHING',
  REFRESH_FAILED: 'REFRESH_FAILED',
});
const COVERAGE_SCHEMA_VERSION = 'coverage-v2';
const COVERAGE_POLICY_VERSION = 'lde-4';
const LIVE_PROVIDERS = new Set(['geoapify', 'google', 'osm']);

function safeCoverageState(value) {
  return Object.values(COVERAGE_STATES).includes(value) ? value : COVERAGE_STATES.UNSEEN;
}

function coverageDecision(state, { demandRefreshEnabled = false, availableCount = 0 } = {}) {
  const safeState = safeCoverageState(state?.state);
  if (!demandRefreshEnabled) return { action: 'continue', state: safeState };
  if (safeState === COVERAGE_STATES.EXHAUSTED && state.coverageComplete === true
    && Number.isInteger(state.resultCount) && state.resultCount >= 0 && availableCount >= state.resultCount) {
    return { action: 'suppress_live', state: safeState };
  }
  if (safeState === COVERAGE_STATES.REFRESHING) return { action: 'await_existing', state: safeState };
  if (safeState === COVERAGE_STATES.REFRESH_FAILED) return { action: 'backoff', state: safeState };
  return { action: 'claim_refresh', state: safeState };
}

function refreshOutcome({ items, limit, liveAttempted, liveSucceeded, liveFailures, chainComplete }) {
  const count = Math.min(Array.isArray(items) ? items.length : 0, 50);
  const attempted = [...new Set((liveAttempted || []).filter((value) => LIVE_PROVIDERS.has(value)))];
  const succeeded = [...new Set((liveSucceeded || []).filter((value) => LIVE_PROVIDERS.has(value)))];
  const providerFailures = Number(liveFailures || 0) > 0;
  if (count >= limit) return { status: COVERAGE_STATES.SUFFICIENT, resultCount: count,
    coverageComplete: Boolean(chainComplete), providerFailures, providersAttempted: attempted, providersSucceeded: succeeded };
  if (chainComplete && !providerFailures && succeeded.length) {
    return { status: COVERAGE_STATES.EXHAUSTED, resultCount: count, coverageComplete: true,
      providerFailures: false, providersAttempted: attempted, providersSucceeded: succeeded };
  }
  return { status: COVERAGE_STATES.PARTIAL, resultCount: count, coverageComplete: false,
    providerFailures, providersAttempted: attempted, providersSucceeded: succeeded };
}

module.exports = { COVERAGE_POLICY_VERSION, COVERAGE_SCHEMA_VERSION, COVERAGE_STATES,
  coverageDecision, refreshOutcome, safeCoverageState };
