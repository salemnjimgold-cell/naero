const { logger } = require('./logger');

function shouldSend(sampleRate) {
  if (!sampleRate || sampleRate <= 0) return false;
  if (sampleRate >= 1) return true;
  return Math.random() <= sampleRate;
}

async function emitMonitoringEvent(env, event, meta = {}, fetchImpl = fetch) {
  const webhookUrl = env.monitoring?.webhookUrl;
  if (!webhookUrl || !shouldSend(env.monitoring.sampleRate)) {
    return { sent: false, reason: 'MONITORING_NOT_CONFIGURED' };
  }

  try {
    const response = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        service: 'naero-backend',
        environment: env.serviceEnv,
        event,
        timestamp: new Date().toISOString(),
        meta: logger.redact(meta),
      }),
    });
    return { sent: response.ok, status: response.status };
  } catch (error) {
    logger.warn('Monitoring event failed', { event, error: error.message });
    return { sent: false, reason: 'MONITORING_SEND_FAILED' };
  }
}

module.exports = {
  emitMonitoringEvent,
};
