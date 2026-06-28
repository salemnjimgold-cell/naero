import { AppState } from 'react-native';
import { placesCache, servicesCache, jobsCache, housingCache, communityCache, safetyCache } from './cacheService';

const SYNC_INTERVAL_MS = 15 * 60 * 1000;
const SYNC_KEY = '@naero_last_sync';

let syncTimer = null;
let appStateSubscription = null;
let syncInProgress = false;

const syncHandlers = [];

export function registerSyncHandler(name, handler) {
  syncHandlers.push({ name, handler });
}

export async function runSync({ force = false } = {}) {
  if (syncInProgress) return { synced: false, reason: 'already_in_progress' };
  syncInProgress = true;

  const results = [];
  for (const { name, handler } of syncHandlers) {
    try {
      const result = await handler({ force });
      results.push({ name, success: true, result });
    } catch (err) {
      console.warn(`[Sync] Handler "${name}" failed:`, err.message);
      results.push({ name, success: false, error: err.message });
    }
  }

  await _persistSyncTime();
  syncInProgress = false;
  return { synced: true, results };
}

export function scheduleSync(intervalMs = SYNC_INTERVAL_MS) {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    runSync().catch(() => {});
  }, intervalMs);
}

export function stopSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

export function startBackgroundSync() {
  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      runSync({ force: false }).catch(() => {});
    }
  });
  scheduleSync();
}

export function stopBackgroundSync() {
  stopSync();
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}

export async function getLastSyncTime() {
  try {
    const { AsyncStorage } = require('@react-native-async-storage/async-storage');
    const raw = await AsyncStorage.getItem(SYNC_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

async function _persistSyncTime() {
  try {
    const { AsyncStorage } = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem(SYNC_KEY, String(Date.now()));
  } catch {}
}

export async function clearSyncState() {
  stopBackgroundSync();
  try {
    const { AsyncStorage } = require('@react-native-async-storage/async-storage');
    await AsyncStorage.removeItem(SYNC_KEY);
  } catch {}
}

export function isSyncInProgress() {
  return syncInProgress;
}

export { SYNC_INTERVAL_MS };
