const assert = require('assert');
const { createServer } = require('http');
const { createRequestHandler } = require('../src/server');
const { readEnv } = require('../src/config/env');

async function run() {
  const env = {
    ...readEnv({ NODE_ENV: 'test', PORT: '0' }),
    port: 0,
    corsOrigins: ['http://localhost:8081'],
  };
  const server = createServer(createRequestHandler({ env }));

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const health = await fetch(`${baseUrl}/health`).then((res) => res.json());
    assert.strictEqual(health.status, 'ok');
    assert.strictEqual(health.service, 'naero-backend');

    const config = await fetch(`${baseUrl}/v1/config`).then((res) => res.json());
    assert.strictEqual(config.authProvider, 'supabase');
    assert.strictEqual(config.aiGatewayEnabled, false);

    const profileResponse = await fetch(`${baseUrl}/v1/profile`);
    const profile = await profileResponse.json();
    assert.strictEqual(profileResponse.status, 401);
    assert.strictEqual(profile.error.code, 'AUTH_REQUIRED');

    console.log('Naero backend smoke test passed');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
