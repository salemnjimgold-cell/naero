const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createSecureAuthStorage } = require('../src/services/secureAuthStorageCore');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: async (key) => values.has(key) ? values.get(key) : null,
    setItem: async (key, value) => values.set(key, value),
    removeItem: async (key) => values.delete(key),
  };
}

async function run() {
  const secure = memoryStorage();
  const legacy = memoryStorage({ session: 'legacy-session-with-refresh-token' });
  const storage = createSecureAuthStorage(secure, legacy);

  assert.strictEqual(await storage.getItem('session'), 'legacy-session-with-refresh-token');
  assert.strictEqual(secure.values.get('session'), 'legacy-session-with-refresh-token');
  assert.strictEqual(legacy.values.has('session'), false);

  await storage.setItem('session', 'new-secure-session');
  assert.strictEqual(secure.values.get('session'), 'new-secure-session');
  assert.strictEqual(legacy.values.has('session'), false);

  await storage.removeItem('session');
  assert.strictEqual(secure.values.has('session'), false);
  assert.strictEqual(legacy.values.has('session'), false);

  const authSource = fs.readFileSync(path.join(__dirname, '../src/services/authService.js'), 'utf8');
  const ordinarySessionWrites = authSource.match(/AsyncStorage\.setItem\(AUTH_SESSION_KEY,\s*JSON\.stringify\(session\)\)/g) || [];
  assert.strictEqual(ordinarySessionWrites.length, 1, 'Only the tokenless guest session may use AsyncStorage');
  assert(!/refreshToken:\s*supabaseSession\.refresh_token/.test(authSource));
  assert(!/console\.(log|warn|error)\([^\n]*(callbackUrl|result\.url|params|access_token|refresh_token)/.test(authSource));

  const backendAuth = fs.readFileSync(path.join(__dirname, '../backend/src/middleware/auth.js'), 'utf8');
  assert(!backendAuth.includes('AUTH_DEBUG'));

  const aiClient = fs.readFileSync(path.join(__dirname, '../src/services/api/naeroAI.js'), 'utf8');
  assert(!aiClient.includes('create conversation raw response'));

  console.log('Milestone 5B auth storage and logging: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
