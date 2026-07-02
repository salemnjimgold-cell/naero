const http = require('http');
const crypto = require('crypto');
const { readEnv, getPublicConfig, validateEnv } = require('./config/env');
const { getCorsHeaders } = require('./http/cors');
const { sendJson, readJson } = require('./http/respond');
const { authenticateRequest } = require('./middleware/auth');
const { logger } = require('./observability/logger');
const { emitMonitoringEvent } = require('./observability/monitoring');
const { healthRoute } = require('./routes/health');
const { getProfile, updateProfile } = require('./routes/profiles');
const { createSupabaseRestClient } = require('./services/supabaseRest');
const { createStorageService } = require('./services/storageService');
const { createRealtimeService } = require('./services/realtimeService');
const { createRepositories } = require('./services/repositories/index');
const { createUploadRoutes } = require('./routes/uploads');
const { createNotificationRoutes } = require('./routes/notifications');
const { createActivityRoutes } = require('./routes/activity');
const { createModerationRoutes } = require('./routes/moderation');
const { createAIServices } = require('./services/ai/index');
const { createAIRoutes } = require('./routes/ai');

function createRequestHandler(options = {}) {
  const env = options.env || readEnv();
  const profileStore = options.profileStore || createSupabaseRestClient(env);
  const repositories = options.repositories || createRepositories(env);
  const storageService = options.storageService || createStorageService(env);
  const realtimeService = options.realtimeService || createRealtimeService(env, repositories);
  const uploadRoutes = options.uploadRoutes || createUploadRoutes(env, storageService);
  const notificationRoutes = options.notificationRoutes || createNotificationRoutes(env, repositories);
  const activityRoutes = options.activityRoutes || createActivityRoutes(env, repositories);
  const moderationRoutes = options.moderationRoutes || createModerationRoutes(env, repositories);
  const aiServices = options.aiServices || createAIServices(env, repositories, profileStore);
  const aiRoutes = options.aiRoutes || createAIRoutes(env, repositories, aiServices);

  return async function requestHandler(req, res) {
    req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
    const corsHeaders = getCorsHeaders(req, env.corsOrigins);
    const startedAt = Date.now();

    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {}, { ...corsHeaders, 'x-request-id': req.requestId });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        logger.request(req, { statusCode: 200, durationMs: Date.now() - startedAt });
        sendJson(res, 200, healthRoute(env), { ...corsHeaders, 'x-request-id': req.requestId });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/config') {
        logger.request(req, { statusCode: 200, durationMs: Date.now() - startedAt });
        sendJson(res, 200, getPublicConfig(env), { ...corsHeaders, 'x-request-id': req.requestId });
        return;
      }

      if (url.pathname === '/v1/profile') {
        const auth = await authenticateRequest(req, env);
        if (!auth.ok) {
          logger.request(req, { statusCode: auth.statusCode, durationMs: Date.now() - startedAt, auth: auth.code });
          sendJson(res, auth.statusCode, { error: { code: auth.code, message: auth.message } }, { ...corsHeaders, 'x-request-id': req.requestId });
          return;
        }

        const result = req.method === 'GET'
          ? await getProfile(auth.user, profileStore)
          : req.method === 'PUT'
            ? await updateProfile(req, auth.user, profileStore)
            : { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } };

        if (result.error) {
          const status = result.error.code === 'METHOD_NOT_ALLOWED' ? 405 : 503;
          logger.request(req, { statusCode: status, durationMs: Date.now() - startedAt, error: result.error.code });
          sendJson(res, status, { error: result.error }, { ...corsHeaders, 'x-request-id': req.requestId });
          return;
        }

        if (req.method === 'PUT' && result.data && repositories.activityLogs) {
          await repositories.activityLogs.create({
            user_id: auth.user.id,
            activity_type: repositories.activityLogs.ACTIVITY_TYPES.PROFILE_UPDATE,
            resource_type: 'profile',
            description: 'Profile updated',
            metadata: { updatedFields: Object.keys(result.data) },
          });
        }

        logger.request(req, { statusCode: 200, durationMs: Date.now() - startedAt });
        sendJson(res, 200, { data: result.data }, { ...corsHeaders, 'x-request-id': req.requestId });
        return;
      }

      if (url.pathname.startsWith('/v1/uploads')) {
        const auth = await authenticateRequest(req, env);
        const result = await uploadRoutes.handleUpload(req, res, url, auth, readJson);
        logger.request(req, { statusCode: result.status, durationMs: Date.now() - startedAt });
        sendJson(res, result.status, result.body, { ...corsHeaders, 'x-request-id': req.requestId });
        return;
      }

      if (url.pathname.startsWith('/v1/notifications')) {
        const auth = await authenticateRequest(req, env);
        const result = await notificationRoutes.handleNotifications(req, res, url, auth);
        logger.request(req, { statusCode: result.status, durationMs: Date.now() - startedAt });
        sendJson(res, result.status, result.body, { ...corsHeaders, 'x-request-id': req.requestId });
        return;
      }

      if (url.pathname.startsWith('/v1/activity')) {
        const auth = await authenticateRequest(req, env);
        const result = await activityRoutes.handleActivity(req, res, url, auth);
        logger.request(req, { statusCode: result.status, durationMs: Date.now() - startedAt });
        sendJson(res, result.status, result.body, { ...corsHeaders, 'x-request-id': req.requestId });
        return;
      }

      if (url.pathname.startsWith('/v1/moderation')) {
        const auth = await authenticateRequest(req, env);
        const result = await moderationRoutes.handleModeration(req, res, url, auth, readJson);
        logger.request(req, { statusCode: result.status, durationMs: Date.now() - startedAt });
        sendJson(res, result.status, result.body, { ...corsHeaders, 'x-request-id': req.requestId });
        return;
      }

      if (url.pathname.startsWith('/v1/ai')) {
        const auth = await authenticateRequest(req, env);
        const result = await aiRoutes.handleAI(req, res, url, auth);
        logger.request(req, { statusCode: result.status, durationMs: Date.now() - startedAt });
        sendJson(res, result.status, result.body, { ...corsHeaders, 'x-request-id': req.requestId });
        return;
      }

      logger.request(req, { statusCode: 404, durationMs: Date.now() - startedAt });
      sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Route not found.' } }, { ...corsHeaders, 'x-request-id': req.requestId });
    } catch (error) {
      logger.error('Unhandled backend request error', { path: url.pathname, error: error.message });
      emitMonitoringEvent(env, 'backend.unhandled_error', { path: url.pathname, error: error.message });
      sendJson(res, error.statusCode || 500, { error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } }, { ...corsHeaders, 'x-request-id': req.requestId });
    }
  };
}

function startServer(options = {}) {
  const env = options.env || readEnv();

  const validation = validateEnv(env);
  if (!validation.valid) {
    for (const err of validation.errors) {
      logger.error('Environment validation failed', { error: err });
    }
    if (validation.isProduction) {
      logger.error('Production environment validation failed — aborting startup');
      emitMonitoringEvent(env, 'backend.validation_failed', { errors: validation.errors });
      throw new Error('Production environment validation failed. Check logs for missing required variables.');
    }
    logger.warn('Continuing with missing optional variables in non-production mode');
  }

  const server = http.createServer(createRequestHandler({ ...options, env }));
  server.listen(env.port, () => {
    logger.info('Naero backend listening', { port: env.port, nodeEnv: env.nodeEnv, serviceEnv: env.serviceEnv });
    emitMonitoringEvent(env, 'backend.started', { port: env.port, serviceEnv: env.serviceEnv });
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createRequestHandler,
  startServer,
};
