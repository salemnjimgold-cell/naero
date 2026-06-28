import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFirebaseConfigured } from '../firebase/config';
import { createCollection } from '../firebase/firestore';

const CACHE_PREFIX = '@naero_ds_';

export class DataService {
  constructor(collectionName, mockData) {
    this.collectionName = collectionName;
    this.mockData = mockData || [];
    this.firestoreCollection = createCollection(collectionName);
    this.firestoreCollection.setLocalData(this.mockData);
    this.cache = null;
    this.cacheTime = null;
    this.cacheTTL = 5 * 60 * 1000;
    this.persistCacheTTL = 10 * 60 * 1000;
  }

  async getAll({ forceRefresh = false, source = 'all' } = {}) {
    if (this.cache && !forceRefresh && Date.now() - this.cacheTime < this.cacheTTL) {
      return { data: this.cache, error: null, source: 'cache' };
    }

    if (!forceRefresh) {
      const persisted = await this._loadPersistedCache();
      if (persisted) {
        this.cache = persisted;
        this.cacheTime = Date.now();
        return { data: persisted, error: null, source: 'persisted_cache' };
      }
    }

    if (isFirebaseConfigured() && source !== 'local') {
      const result = await this.firestoreCollection.getAll();
      if (result.data && !result.local) {
        this.cache = result.data;
        this.cacheTime = Date.now();
        await this._persistCache(result.data);
        return { data: result.data, error: null, source: 'firestore' };
      }
    }

    this.cache = [...this.mockData];
    this.cacheTime = Date.now();
    await this._persistCache(this.mockData);
    return { data: [...this.mockData], error: null, source: 'local' };
  }

  async getById(id) {
    const all = await this.getAll();
    if (!all.data) return { data: null, error: 'No data' };
    const item = all.data.find((d) => d.id === id);
    return { data: item || null, error: item ? null : 'Not found' };
  }

  filterByCity(items, cityName) {
    if (!cityName || cityName === 'all') return items;
    return items.filter(
      (i) => i.city && i.city.toLowerCase() === cityName.toLowerCase()
    );
  }

  filterByCategory(items, category) {
    if (!category) return items;
    return items.filter((i) => i.category === category);
  }

  search(items, query) {
    if (!query || !query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => {
      const searchable = [
        item.name, item.title, item.description,
        ...(item.tags || []), item.city, item.category,
        item.provider, item.company,
      ].filter(Boolean).map((s) => s.toLowerCase());
      return searchable.some((s) => s.includes(q));
    });
  }

  async clearCache() {
    this.cache = null;
    this.cacheTime = null;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX + this.collectionName));
      if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys);
    } catch {}
  }

  async _persistCache(data) {
    try {
      const entry = JSON.stringify({ data, timestamp: Date.now(), ttl: this.persistCacheTTL });
      await AsyncStorage.setItem(CACHE_PREFIX + this.collectionName, entry);
    } catch (err) {
      console.warn(`[DataService] Persist cache failed for ${this.collectionName}:`, err.message);
    }
  }

  async _loadPersistedCache() {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + this.collectionName);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.timestamp < entry.ttl) {
        return entry.data;
      }
      await AsyncStorage.removeItem(CACHE_PREFIX + this.collectionName);
      return null;
    } catch {
      return null;
    }
  }
}
