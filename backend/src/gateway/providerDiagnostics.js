const { logger } = require('../observability/logger');

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
      write('Nearby provider diagnostic', meta);
    },
  };
}

module.exports = { createProviderDiagnostics, safeErrorClass };
