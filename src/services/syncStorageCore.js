const SYNC_KEY = '@naero_last_sync';

function createSyncStorage(storage, now = () => Date.now()) {
  async function getLastSyncTime() {
    try {
      const raw = await storage.getItem(SYNC_KEY);
      if (raw === null) return null;
      const timestamp = Number.parseInt(raw, 10);
      return Number.isFinite(timestamp) && timestamp >= 0 ? timestamp : null;
    } catch {
      return null;
    }
  }

  async function persistSyncTime() {
    const timestamp = now();
    try {
      await storage.setItem(SYNC_KEY, String(timestamp));
      return timestamp;
    } catch {
      return null;
    }
  }

  async function clearSyncTime() {
    try {
      await storage.removeItem(SYNC_KEY);
      return true;
    } catch {
      return false;
    }
  }

  return { getLastSyncTime, persistSyncTime, clearSyncTime };
}

module.exports = { SYNC_KEY, createSyncStorage };
