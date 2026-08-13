const { GatewayError, normalizeGatewayError } = require('../gateway/errors');
const { success, failure } = require('../gateway/response');
const validation = require('../gateway/validation');
const { createRateLimiter } = require('../gateway/rateLimiter');
const { createNominatimProvider } = require('../gateway/providers/nominatim');
const { createNearbyService } = require('../services/nearbyService');

function createGatewayRoutes(env, options = {}) {
  const reverseGeocoder = options.reverseGeocoder || createNominatimProvider(env, options);
  const limiter = options.rateLimiter || createRateLimiter(env.gateway.rateLimit);
  const nearbyService = options.nearbyService || createNearbyService(env, options);

  return {
    async handle(req, url) {
      const rate = limiter.check(req.socket?.remoteAddress || 'unknown');
      if (!rate.allowed) return failure(req, new GatewayError('RATE_LIMITED', 'Too many requests. Try again later.'));

      try {
        if (req.method === 'GET' && url.pathname === '/api/v1/health') {
          return success(req, { status: 'ok', service: 'naero-backend' }, { source: 'naero' });
        }
        if (req.method === 'GET' && url.pathname === '/api/v1/location/reverse-geocode') {
          const input = validation.reverseGeocode(Object.fromEntries(url.searchParams));
          const data = await reverseGeocoder.reverseGeocode(input);
          return success(req, data, { source: reverseGeocoder.name || data.provider });
        }
        if (req.method === 'GET' && url.pathname === '/api/v1/nearby') {
          const input = validation.nearby(Object.fromEntries(url.searchParams));
          const result = await nearbyService.searchNearby(input, { requestId: req.requestId });
          return success(req, result.items, {
            source: result.providers.join('+') || 'nearby-cache',
            cached: result.cached,
            extraMeta: {
              stale: result.stale,
              partial: result.partial,
              providers: result.providers,
              attributions: result.attributions,
              coverageStatus: result.coverageStatus,
              sourcesAttempted: result.sourcesAttempted,
              sourcesSucceeded: result.sourcesSucceeded,
            },
          });
        }
        return null;
      } catch (error) {
        return failure(req, normalizeGatewayError(error));
      }
    },
  };
}

module.exports = { createGatewayRoutes };
