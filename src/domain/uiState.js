const ERROR_KINDS = Object.freeze(['network', 'service', 'invalid_data', 'unavailable', 'permission', 'unknown']);
const PERMISSION_KINDS = Object.freeze(['location', 'notifications', 'camera', 'other']);

function normalizeErrorKind(value) { return ERROR_KINDS.includes(value) ? value : 'unknown'; }
function normalizePermissionKind(value) { return PERMISSION_KINDS.includes(value) ? value : 'other'; }
function createErrorState({ kind, referenceId = null, retryable = false } = {}) {
  const normalized = normalizeErrorKind(kind);
  return Object.freeze({ kind: normalized, referenceId: typeof referenceId === 'string' ? referenceId : null, retryable: Boolean(retryable && normalized !== 'invalid_data' && normalized !== 'permission') });
}

module.exports = { ERROR_KINDS, PERMISSION_KINDS, normalizeErrorKind, normalizePermissionKind, createErrorState };
