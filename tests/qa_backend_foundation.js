const assert = require('assert');
const { createServer } = require('http');
const { createRequestHandler } = require('../backend/src/server');
const { readEnv } = require('../backend/src/config/env');
const { sanitizeProfile } = require('../backend/src/routes/profiles');
const { redact } = require('../backend/src/observability/logger');

async function fetchJson(baseUrl, path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { response, body: await response.json() };
}

async function run() {
  const env = {
    ...readEnv({ NODE_ENV: 'test', PORT: '0' }),
    port: 0,
    corsOrigins: ['http://localhost:8081'],
  };
  const server = createServer(createRequestHandler({ env }));
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const health = await fetchJson(baseUrl, '/health');
    assert.strictEqual(health.response.status, 200);
    assert.strictEqual(health.body.status, 'ok');

    const config = await fetchJson(baseUrl, '/v1/config');
    assert.strictEqual(config.response.status, 200);
    assert.strictEqual(config.body.authProvider, 'supabase');
    assert.strictEqual(config.body.aiGatewayEnabled, false);

    const unauthenticated = await fetchJson(baseUrl, '/v1/profile');
    assert.strictEqual(unauthenticated.response.status, 401);
    assert.strictEqual(unauthenticated.body.error.code, 'AUTH_REQUIRED');

    const redacted = redact({
      authorization: 'Bearer secret',
      nested: { email: 'person@example.com', safe: 'ok' },
    });
    assert.strictEqual(redacted.authorization, '[redacted]');
    assert.strictEqual(redacted.nested.email, '[redacted]');
    assert.strictEqual(redacted.nested.safe, 'ok');

    const sanitized = sanitizeProfile({
      display_name: 'A',
      service_role_key: 'secret',
      current_city: 'Budapest',
    });
    assert.deepStrictEqual(sanitized, { display_name: 'A', current_city: 'Budapest' });

    console.log('Naero backend foundation QA passed');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
