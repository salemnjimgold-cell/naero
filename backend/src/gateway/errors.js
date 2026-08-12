const ERROR_STATUS = Object.freeze({
  INVALID_COORDINATES: 400,
  INVALID_RADIUS: 400,
  INVALID_CATEGORY: 400,
  INVALID_LANGUAGE: 400,
  INVALID_LIMIT: 400,
  INVALID_COUNTRY_CODE: 400,
  INVALID_CURSOR: 400,
  LOCATION_NOT_FOUND: 404,
  PROVIDER_NOT_CONFIGURED: 503,
  PROVIDER_TIMEOUT: 504,
  PROVIDER_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
});

class GatewayError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'GatewayError';
    this.code = ERROR_STATUS[code] ? code : 'INTERNAL_ERROR';
    this.statusCode = options.statusCode || ERROR_STATUS[this.code];
    this.cause = options.cause;
  }
}

function normalizeGatewayError(error) {
  if (error instanceof GatewayError) return error;
  if (error?.name === 'AbortError' || error?.code === 'ETIMEDOUT') {
    return new GatewayError('PROVIDER_TIMEOUT', 'The location provider timed out.');
  }
  return new GatewayError('INTERNAL_ERROR', 'Unexpected server error.');
}

module.exports = { ERROR_STATUS, GatewayError, normalizeGatewayError };
