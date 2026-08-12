const assert = require('node:assert/strict');
const http = require('node:http');
const { createRequestHandler } = require('../backend/src/server');
const validation = require('../backend/src/gateway/validation');
const { normalizeNominatim } = require('../backend/src/gateway/providers/nominatim');
const { createRateLimiter } = require('../backend/src/gateway/rateLimiter');

const baseEnv = {
  nodeEnv: 'test',
  serviceEnv: 'test',
  port: 0,
  corsOrigins: ['http://localhost:8081'],
  publicBaseUrl: '',
  monitoring: { webhookUrl: '', sampleRate: 0 },
  gateway: { rateLimit: { windowMs: 60000, max: 100 }, providerTimeoutMs: 20, debugLocationLogging: false },
  providers: { nominatimBaseUrl: 'https://nominatim.example', googlePlacesApiKey: '', googleMapsApiKey: '', overpassApiUrl: '' },
  supabase: { url: '', anonKey: '', serviceRoleKey: '', jwtSecret: '', jwksUrl: '' },
  ai: { provider: 'openai', model: '', openaiApiKey: '', geminiApiKey: '', anthropicApiKey: '' },
};

async function withServer(options, callback) {
  const server = http.createServer(createRequestHandler({
    env: { ...baseEnv, ...(options.env || {}) },
    gatewayOptions: options.gatewayOptions,
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function get(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  return { response, payload: await response.json() };
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function expectCode(fn, code) {
  assert.throws(fn, (error) => error.code === code);
}

test('valid coordinates and reverse-geocode response contract', async () => {
  await withServer({
    gatewayOptions: {
      reverseGeocoder: {
        name: 'test',
        reverseGeocode: async (input) => ({
          ...input, country: 'Hungary', countryCode: 'HU', region: null, city: 'Budapest',
          district: null, postalCode: null, provider: 'test', fetchedAt: new Date().toISOString(),
        }),
      },
    },
  }, async (base) => {
    const { response, payload } = await get(base, '/api/v1/location/reverse-geocode?latitude=47.5&longitude=19.04');
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.city, 'Budapest');
    assert.equal(typeof payload.meta.requestId, 'string');
    assert.equal(response.headers.get('x-request-id'), payload.meta.requestId);
    assert.equal(payload.meta.cached, false);
  });
});

test('invalid latitude', () => expectCode(() => validation.coordinates({ latitude: 91, longitude: 0 }), 'INVALID_COORDINATES'));
test('invalid longitude', () => expectCode(() => validation.coordinates({ latitude: 0, longitude: -181 }), 'INVALID_COORDINATES'));
test('malformed coordinates', () => expectCode(() => validation.coordinates({ latitude: 'x', longitude: null }), 'INVALID_COORDINATES'));
test('negative radius', () => expectCode(() => validation.nearby({ latitude: 0, longitude: 0, radius: -1 }), 'INVALID_RADIUS'));
test('excessive radius', () => expectCode(() => validation.nearby({ latitude: 0, longitude: 0, radius: 50001 }), 'INVALID_RADIUS'));
test('excessive result limit', () => expectCode(() => validation.nearby({ latitude: 0, longitude: 0, limit: 51 }), 'INVALID_LIMIT'));
test('unsupported category', () => expectCode(() => validation.nearby({ latitude: 0, longitude: 0, category: 'demo' }), 'INVALID_CATEGORY'));
test('unsupported language', () => expectCode(() => validation.reverseGeocode({ latitude: 0, longitude: 0, language: 'de' }), 'INVALID_LANGUAGE'));

test('provider not configured returns honest error and no demo places', async () => {
  await withServer({ env: { providers: { ...baseEnv.providers, nominatimBaseUrl: '' } } }, async (base) => {
    const { response, payload } = await get(base, '/api/v1/nearby?latitude=47.5&longitude=19');
    assert.equal(response.status, 503);
    assert.equal(payload.error.code, 'PROVIDER_NOT_CONFIGURED');
    assert.equal(payload.data, undefined);
  });
});

test('provider timeout is normalized', async () => {
  const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  await withServer({ gatewayOptions: { fetchImpl } }, async (base) => {
    const { response, payload } = await get(base, '/api/v1/location/reverse-geocode?latitude=1&longitude=2');
    assert.equal(response.status, 504);
    assert.equal(payload.error.code, 'PROVIDER_TIMEOUT');
  });
});

test('upstream provider error is normalized without exposing its body', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 502,
    json: async () => ({ providerSecret: 'must-not-escape' }),
  });
  await withServer({ gatewayOptions: { fetchImpl } }, async (base) => {
    const { response, payload } = await get(base, '/api/v1/location/reverse-geocode?latitude=1&longitude=2');
    assert.equal(response.status, 503);
    assert.equal(payload.error.code, 'PROVIDER_UNAVAILABLE');
    assert.doesNotMatch(JSON.stringify(payload), /must-not-escape/);
  });
});

test('provider failures and internal details are normalized', async () => {
  await withServer({
    gatewayOptions: { reverseGeocoder: { name: 'broken', reverseGeocode: async () => { throw new Error('secret-key=abc stack detail'); } } },
  }, async (base) => {
    const { response, payload } = await get(base, '/api/v1/location/reverse-geocode?latitude=1&longitude=2');
    assert.equal(response.status, 500);
    assert.equal(payload.error.code, 'INTERNAL_ERROR');
    assert.doesNotMatch(JSON.stringify(payload), /secret-key|stack detail/);
  });
});

test('rate limiter rejects requests over the configured maximum', async () => {
  const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
  await withServer({ gatewayOptions: { rateLimiter: limiter } }, async (base) => {
    assert.equal((await get(base, '/api/v1/health')).response.status, 200);
    const second = await get(base, '/api/v1/health');
    assert.equal(second.response.status, 429);
    assert.equal(second.payload.error.code, 'RATE_LIMITED');
  });
});

test('security headers and restricted CORS are present', async () => {
  await withServer({}, async (base) => {
    const allowed = await fetch(`${base}/api/v1/health`, { headers: { origin: 'http://localhost:8081' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:8081');
    assert.equal(allowed.headers.get('x-content-type-options'), 'nosniff');
    const blocked = await fetch(`${base}/api/v1/health`, { headers: { origin: 'https://evil.example' } });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  });
});

test('reverse-geocode normalization preserves missing fields as null', () => {
  const result = normalizeNominatim({ address: { country: 'Hungary', country_code: 'hu', city: 'Budapest' } }, { latitude: 47.5, longitude: 19 });
  assert.deepEqual(
    { district: result.district, postalCode: result.postalCode, region: result.region },
    { district: null, postalCode: null, region: null }
  );
  assert.equal(result.countryCode, 'HU');
});

(async () => {
  let passed = 0;
  for (const item of tests) {
    try {
      await item.fn();
      passed += 1;
      console.log(`PASS ${item.name}`);
    } catch (error) {
      console.error(`FAIL ${item.name}\n${error.stack}`);
    }
  }
  console.log(`Gateway tests: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
