import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@naero_cache_';
const DEFAULT_TTL_MS = 10 * 60 * 1000;

export class CacheService {
  constructor(namespace = 'default', ttlMs = DEFAULT_TTL_MS) {
    this.namespace = namespace;
    this.ttlMs = ttlMs;
    this._memoryCache = new Map();
  }

  _key(key) {
    return `${CACHE_PREFIX}${this.namespace}_${key}`;
  }

  async set(key, data, ttlMs = this.ttlMs) {
    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    this._memoryCache.set(key, entry);
    try {
      await AsyncStorage.setItem(this._key(key), JSON.stringify(entry));
    } catch (err) {
      console.warn('[Cache] AsyncStorage set failed:', err.message);
    }
  }

  async get(key) {
    const memory = this._memoryCache.get(key);
    if (memory && this._isFresh(memory)) {
      return memory.data;
    }
    if (memory) this._memoryCache.delete(key);

    try {
      const raw = await AsyncStorage.getItem(this._key(key));
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (this._isFresh(entry)) {
        this._memoryCache.set(key, entry);
        return entry.data;
      }
      await AsyncStorage.removeItem(this._key(key));
      return null;
    } catch (err) {
      console.warn('[Cache] AsyncStorage get failed:', err.message);
      return null;
    }
  }

  _isFresh(entry) {
    return (Date.now() - entry.timestamp) < entry.ttl;
  }

  async remove(key) {
    this._memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(this._key(key));
    } catch (err) {
      console.warn('[Cache] AsyncStorage remove failed:', err.message);
    }
  }

  async clear() {
    this._memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX + this.namespace));
      if (cacheKeys.length) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (err) {
      console.warn('[Cache] AsyncStorage clear failed:', err.message);
    }
  }

  async getAllKeys() {
    const keys = [];
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const prefix = CACHE_PREFIX + this.namespace;
      for (const k of allKeys) {
        if (k.startsWith(prefix)) {
          keys.push(k.replace(prefix + '_', ''));
        }
      }
    } catch (err) {
      console.warn('[Cache] AsyncStorage getAllKeys failed:', err.message);
    }
    return [...new Set([...this._memoryCache.keys(), ...keys])];
  }

  invalidateCache(cacheKey) {
    if (cacheKey) {
      return this.remove(cacheKey);
    }
    return this.clear();
  }
}

export const globalCache = new CacheService('global', 5 * 60 * 1000);
export const locationCache = new CacheService('location', 2 * 60 * 1000);
export const placesCache = new CacheService('places', 10 * 60 * 1000);
export const servicesCache = new CacheService('services', 10 * 60 * 1000);
export const jobsCache = new CacheService('jobs', 10 * 60 * 1000);
export const housingCache = new CacheService('housing', 10 * 60 * 1000);
export const communityCache = new CacheService('community', 5 * 60 * 1000);
export const safetyCache = new CacheService('safety', 15 * 60 * 1000);
