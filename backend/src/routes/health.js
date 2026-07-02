const { getConfigStatus, validateEnv } = require('../config/env');

function healthRoute(env) {
  const validation = validateEnv(env);
  return {
    status: validation.valid ? 'ok' : 'degraded',
    service: 'naero-backend',
    version: '0.1.0',
    environment: env.serviceEnv,
    uptimeSeconds: Math.round(process.uptime()),
    config: getConfigStatus(env),
    validation: validation.isProduction ? { ok: validation.valid } : undefined,
  };
}

module.exports = {
  healthRoute,
};
