const assert = require('assert');

const baseUrl = (process.argv[2] || process.env.BACKEND_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'x-request-id': `healthcheck-${Date.now()}` },
  });
  const body = await response.json();
  return { response, body };
}

async function run() {
  const health = await fetchJson('/health');
  assert.strictEqual(health.response.status, 200);
  assert.strictEqual(health.body.status, 'ok');
  assert.strictEqual(health.body.service, 'naero-backend');

  const config = await fetchJson('/v1/config');
  assert.strictEqual(config.response.status, 200);
  assert.strictEqual(config.body.aiGatewayEnabled, false);

  console.log(`Naero backend healthcheck passed: ${baseUrl}`);
}

run().catch((error) => {
  console.error(`Naero backend healthcheck failed: ${baseUrl}`);
  console.error(error);
  process.exit(1);
});
