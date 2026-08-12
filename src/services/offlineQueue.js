import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@naero_offline_queue';

let isProcessing = false;

export async function enqueueWrite(operation) {
  try {
    const queue = await getQueue();
    queue.push({
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      retryCount: 0,
      lastAttempt: null,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function processQueue(executor) {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      isProcessing = false;
      return;
    }

    const remaining = [];
    for (const op of queue) {
      try {
        const result = await executor(op);
        if (result?.error) {
          if (op.retryCount < (op.maxRetries || 3)) {
            remaining.push({
              ...op,
              retryCount: op.retryCount + 1,
              lastAttempt: Date.now(),
            });
          }
        }
      } catch {
        if (op.retryCount < (op.maxRetries || 3)) {
          remaining.push({
            ...op,
            retryCount: op.retryCount + 1,
            lastAttempt: Date.now(),
          });
        }
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.warn('[OfflineQueue] processQueue error:', err.message);
  } finally {
    isProcessing = false;
  }
}

export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getQueueSize() {
  const queue = await getQueue();
  return queue.length;
}
