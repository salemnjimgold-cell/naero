const { getConfigStatus } = require('../config/env');

function healthRoute(env) {
  return {
    status: 'ok',
    service: 'naero-backend',
    version: '0.1.0',
    environment: env.serviceEnv,
    uptimeSeconds: Math.round(process.uptime()),
    config: getConfigStatus(env),
  };
}

module.exports = {
  healthRoute,
};
