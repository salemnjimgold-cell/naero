class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', data = null, requestId = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
    this.requestId = requestId;
  }
}

function normalizeApiFailure(error) {
  if (error?.name === 'AbortError') return { code: 'REQUEST_TIMEOUT', message: 'The request timed out.' };
  return { code: 'NETWORK_ERROR', message: 'The service could not be reached.' };
}

function createRequestId() {
  return `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

module.exports = { ApiError, normalizeApiFailure, createRequestId };
