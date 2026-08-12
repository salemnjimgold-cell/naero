const { logger } = require('../observability/logger');
const { isIP } = require('node:net');

const PROVIDERS = new Set(['naero', 'google', 'osm']);
const STAGES = new Set([
  'provider_start', 'request', 'http_response', 'parse', 'normalization',
  'provider_success', 'provider_failure', 'circuit_open', 'circuit_probe', 'circuit_closed',
]);
const SAFE_ERROR_CLASSES = new Set([
  'AbortError', 'GatewayError', 'SyntaxError', 'TypeError',
  'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
  'CERT_ERROR', 'FETCH_ERROR', 'UNKNOWN_ERROR',
]);
const NETWORK_CLASSES = new Set([
  'dns_failure', 'connection_refused', 'connection_reset', 'connection_closed',
  'connect_timeout', 'tls_failure', 'network_unreachable', 'address_unreachable',
  'generic_network_failure',
]);
const NETWORK_CODE_CLASS = Object.freeze({
  ENOTFOUND: 'dns_failure',
  EAI_AGAIN: 'dns_failure',
  ECONNREFUSED: 'connection_refused',
  ECONNRESET: 'connection_reset',
  UND_ERR_SOCKET: 'connection_closed',
  UND_ERR_DESTROYED: 'connection_closed',
  UND_ERR_CONNECT_TIMEOUT: 'connect_timeout',
  ETIMEDOUT: 'connect_timeout',
  ERR_TLS_CERT_ALTNAME_INVALID: 'tls_failure',
  CERT_HAS_EXPIRED: 'tls_failure',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'tls_failure',
  SELF_SIGNED_CERT_IN_CHAIN: 'tls_failure',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'tls_failure',
  ENETUNREACH: 'network_unreachable',
  EHOSTUNREACH: 'address_unreachable',
});
const ADDRESS_FAMILIES = new Set(['IPv4', 'IPv6']);
const ATTEMPT_OUTCOMES = new Set([
  'timeout', 'unreachable', 'refused', 'reset', 'closed', 'tls_failure',
  'other_network_failure',
]);
const MAX_ADDRESS_ATTEMPTS = 8;
const ATTEMPT_CODE_OUTCOME = Object.freeze({
  UND_ERR_CONNECT_TIMEOUT: 'timeout',
  ETIMEDOUT: 'timeout',
  ENETUNREACH: 'unreachable',
  EHOSTUNREACH: 'unreachable',
  ECONNREFUSED: 'refused',
  ECONNRESET: 'reset',
  UND_ERR_SOCKET: 'closed',
  UND_ERR_DESTROYED: 'closed',
  ERR_TLS_CERT_ALTNAME_INVALID: 'tls_failure',
  CERT_HAS_EXPIRED: 'tls_failure',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'tls_failure',
  SELF_SIGNED_CERT_IN_CHAIN: 'tls_failure',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'tls_failure',
});

function safeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  return Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

function safeErrorClass(error) {
  const candidates = [error?.cause?.code, error?.code, error?.name];
  const match = candidates.find((value) => SAFE_ERROR_CLASSES.has(value));
  if (match) return match;
  if (error instanceof TypeError) return 'TypeError';
  return 'UNKNOWN_ERROR';
}

function safeErrorCode(value) {
  return typeof value === 'string' && /^[A-Z][A-Z0-9_]{1,63}$/.test(value) ? value : undefined;
}

function classifyNetworkError(error) {
  const code = error?.cause?.code || error?.code;
  return NETWORK_CODE_CLASS[code] || 'generic_network_failure';
}

function safeProperty(value, key) {
  try { return value != null ? value[key] : undefined; } catch { return undefined; }
}

function familyFromAttempt(attempt) {
  const address = safeProperty(attempt, 'address');
  if (typeof address !== 'string') return undefined;
  const family = isIP(address);
  return family === 4 ? 'IPv4' : family === 6 ? 'IPv6' : undefined;
}

function outcomeFromAttempt(attempt) {
  const code = safeProperty(attempt, 'code');
  return ATTEMPT_CODE_OUTCOME[code] || 'other_network_failure';
}

function classifyAddressFamilyAttempts(error) {
  try {
    const cause = safeProperty(error, 'cause');
    const nestedCause = safeProperty(cause, 'cause');
    const aggregate = cause instanceof AggregateError ? cause
      : nestedCause instanceof AggregateError ? nestedCause : undefined;
    const rawAttempts = aggregate ? safeProperty(aggregate, 'errors') : undefined;
    const attempts = Array.isArray(rawAttempts) ? rawAttempts.slice(0, MAX_ADDRESS_ATTEMPTS)
      : cause && typeof cause === 'object' ? [cause] : [];
    if (!attempts.length) return undefined;

    const attemptOutcomes = attempts.map((attempt) => {
      const family = familyFromAttempt(attempt);
      return family ? { family, outcome: outcomeFromAttempt(attempt) } : undefined;
    }).filter(Boolean);
    const addressFamilies = [...new Set(attemptOutcomes.map(({ family }) => family))];
    const result = {
      multiAddress: Boolean(aggregate),
      attemptCount: attempts.length,
    };
    if (addressFamilies.length) result.addressFamilies = addressFamilies;
    if (attemptOutcomes.length) result.attemptOutcomes = attemptOutcomes;
    return result;
  } catch {
    return undefined;
  }
}

function createProviderDiagnostics(requestId, write = (message, meta) => logger.info(message, meta)) {
  const safeRequestId = typeof requestId === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(requestId)
    ? requestId : 'unknown';
  return {
    emit(event = {}) {
      if (!PROVIDERS.has(event.provider) || !STAGES.has(event.stage)) return;
      const meta = {
        requestId: safeRequestId,
        provider: event.provider,
        stage: event.stage,
      };
      const attempt = safeInteger(event.attempt, { min: 1, max: 10 });
      const elapsedMs = safeInteger(event.elapsedMs, { max: 300000 });
      const upstreamStatus = safeInteger(event.upstreamStatus, { min: 100, max: 599 });
      const resultCount = safeInteger(event.resultCount, { max: 10000 });
      const errorCode = safeErrorCode(event.errorCode);
      if (attempt !== undefined) meta.attempt = attempt;
      if (elapsedMs !== undefined) meta.elapsedMs = elapsedMs;
      if (upstreamStatus !== undefined) meta.upstreamStatus = upstreamStatus;
      if (resultCount !== undefined) meta.resultCount = resultCount;
      if (errorCode !== undefined) meta.errorCode = errorCode;
      if (SAFE_ERROR_CLASSES.has(event.errorClass)) meta.errorClass = event.errorClass;
      if (NETWORK_CLASSES.has(event.networkClass)) meta.networkClass = event.networkClass;
      if (typeof event.multiAddress === 'boolean') meta.multiAddress = event.multiAddress;
      const attemptCount = safeInteger(event.attemptCount, { min: 1, max: MAX_ADDRESS_ATTEMPTS });
      if (attemptCount !== undefined) meta.attemptCount = attemptCount;
      if (Array.isArray(event.addressFamilies)) {
        const addressFamilies = [...new Set(event.addressFamilies.slice(0, MAX_ADDRESS_ATTEMPTS)
          .filter((value) => ADDRESS_FAMILIES.has(value)))];
        if (addressFamilies.length) meta.addressFamilies = addressFamilies;
      }
      if (Array.isArray(event.attemptOutcomes)) {
        const attemptOutcomes = event.attemptOutcomes.slice(0, MAX_ADDRESS_ATTEMPTS).map((item) => {
          const family = safeProperty(item, 'family');
          const outcome = safeProperty(item, 'outcome');
          if (!ADDRESS_FAMILIES.has(family) || !ATTEMPT_OUTCOMES.has(outcome)) return undefined;
          return { family, outcome };
        }).filter(Boolean);
        if (attemptOutcomes.length) meta.attemptOutcomes = attemptOutcomes;
      }
      write('Nearby provider diagnostic', meta);
    },
  };
}

module.exports = { createProviderDiagnostics, safeErrorClass, classifyNetworkError, classifyAddressFamilyAttempts };
