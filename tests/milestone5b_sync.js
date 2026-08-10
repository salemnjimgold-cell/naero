const assert = require('assert');
const { SYNC_KEY, createSyncStorage } = require('../src/services/syncStorageCore');

async function run() {
  const values = new Map();
  const storage = {
    getItem: async (key) => values.has(key) ? values.get(key) : null,
    setItem: async (key, value) => values.set(key, value),
    removeItem: async (key) => values.delete(key),
  };

  const firstProcess = createSyncStorage(storage, () => 1723280400000);
  assert.strictEqual(await firstProcess.getLastSyncTime(), null);
  assert.strictEqual(await firstProcess.persistSyncTime(), 1723280400000);
  assert.strictEqual(values.get(SYNC_KEY), '1723280400000');

  const restartedProcess = createSyncStorage(storage);
  assert.strictEqual(await restartedProcess.getLastSyncTime(), 1723280400000);

  values.set(SYNC_KEY, 'not-a-timestamp');
  assert.strictEqual(await restartedProcess.getLastSyncTime(), null);

  const failingStorage = {
    getItem: async () => { throw new Error('storage unavailable'); },
    setItem: async () => { throw new Error('storage unavailable'); },
    removeItem: async () => { throw new Error('storage unavailable'); },
  };
  const failureSafe = createSyncStorage(failingStorage, () => 123);
  assert.strictEqual(await failureSafe.getLastSyncTime(), null);
  assert.strictEqual(await failureSafe.persistSyncTime(), null);
  assert.strictEqual(await failureSafe.clearSyncTime(), false);

  console.log('Milestone 5B sync persistence: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
