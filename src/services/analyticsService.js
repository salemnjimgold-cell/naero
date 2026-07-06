import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_KEY = '@naero_analytics_events';
const FLUSH_INTERVAL = 30000;
const MAX_CACHED = 100;

let eventQueue = [];
let flushTimer = null;

const ANALYTICS_ENABLED_KEY = '@naero_analytics_enabled';

export async function isAnalyticsEnabled() {
  try {
    const val = await AsyncStorage.getItem(ANALYTICS_ENABLED_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

export async function setAnalyticsEnabled(enabled) {
  await AsyncStorage.setItem(ANALYTICS_ENABLED_KEY, enabled ? 'true' : 'false');
}

function makeEvent(name, properties = {}) {
  return {
    name,
    properties,
    timestamp: new Date().toISOString(),
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

export async function track(eventName, properties = {}) {
  const enabled = await isAnalyticsEnabled();
  if (!enabled) return;

  const event = makeEvent(eventName, properties);
  eventQueue.push(event);

  if (eventQueue.length >= MAX_CACHED) {
    await flush();
  }

  startFlushTimer();
}

export async function flush() {
  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    const stored = await AsyncStorage.getItem(EVENTS_KEY);
    const allEvents = stored ? [...JSON.parse(stored), ...batch] : batch;
    const trimmed = allEvents.slice(-500);
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {
    eventQueue = [...batch, ...eventQueue];
  }
}

function startFlushTimer() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flush();
    flushTimer = null;
  }, FLUSH_INTERVAL);
}

export function stopFlushTimer() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

export async function getCachedEvents(limit = 50) {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw).slice(-limit) : [];
  } catch {
    return [];
  }
}

export async function clearEvents() {
  await AsyncStorage.removeItem(EVENTS_KEY);
  eventQueue = [];
}

// Convenience trackers
export function trackScreenView(screenName) {
  return track('screen_view', { screen: screenName });
}

export function trackAIRequest(model, provider, topic) {
  return track('ai_request', { model, provider, topic });
}

export function trackSearch(query, category, resultCount) {
  return track('search', { query, category, resultCount });
}

export function trackPlaceOpen(placeId, placeName, category) {
  return track('place_open', { placeId, placeName, category });
}

export function trackAuth(action) {
  return track('auth', { action });
}

export function trackError(errorCode, context) {
  return track('error', { code: errorCode, context });
}
