import { DataService } from './dataService';
import { filterByCity } from '../utils/geo';
import { naeroApi } from './api/naeroApi';
import { apiClient } from './apiClient';
const { createNearbyQuery } = require('./nearbyClientCore');

class PlaceService extends DataService {
  constructor() {
    super('places', [], { remoteEndpoint: '/v1/places' });
  }

  markDemo(items) {
    return items.map(p => ({ ...p, demo: true }));
  }

  async getNearby(userLat, userLng, radiusKm = 10, limit = 20, category = 'hospital', language = 'en', options = {}) {
    const params = createNearbyQuery({
      latitude: userLat, longitude: userLng, radiusKm, limit, category, language,
    });
    const result = await apiClient.get(`/api/v1/nearby?${params}`, { signal: options.signal });
    return {
      data: Array.isArray(result.data) ? result.data : [],
      error: result.error,
      source: result.meta?.source || 'gateway',
      cached: Boolean(result.meta?.cached),
      stale: Boolean(result.meta?.stale),
      attribution: result.meta?.attributions || [],
    };
  }

  async getByCategory(category, city = null) {
    if (this.useRemote) {
      const params = new URLSearchParams({ category });
      if (city) params.set('city', city);
      const result = await naeroApi.get(`/v1/places?${params.toString()}`);
      if (result.data && !result.error) {
        const items = Array.isArray(result.data) ? result.data : [];
        return { data: items, error: null, source: 'remote' };
      }
    }
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = this.filterByCategory(all.data, category);
    if (city) items = this.filterByCity(items, city);
    return { data: this.markDemo(items), error: null };
  }

  async getByCity(city) {
    if (this.useRemote) {
      const result = await naeroApi.get(`/v1/places?city=${encodeURIComponent(city)}`);
      if (result.data && !result.error) {
        const items = Array.isArray(result.data) ? result.data : [];
        return { data: items, error: null, source: 'remote' };
      }
    }

    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = filterByCity(all.data, city);
    if (items.length === 0) {
      items = all.data;
    }
    return { data: this.markDemo(items), error: null, source: 'local' };
  }

  async searchPlaces(query, city = null, category = null) {
    if (this.useRemote) {
      const params = new URLSearchParams({ q: query });
      if (city) params.set('city', city);
      if (category) params.set('category', category);
      const result = await naeroApi.get(`/v1/places/search?${params.toString()}`);
      if (result.data && !result.error) {
        const items = Array.isArray(result.data) ? result.data : [];
        return { data: items, error: null, source: 'remote' };
      }
    }

    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = this.search(all.data, query);
    if (city) items = this.filterByCity(items, city);
    if (category) items = this.filterByCategory(items, category);
    return { data: this.markDemo(items), error: null, source: 'local' };
  }

  async getCategories() {
    if (this.useRemote) {
      const result = await naeroApi.get('/v1/places/categories');
      if (result.data && !result.error) return { data: result.data, error: null, source: 'remote' };
    }
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    const cats = [...new Set(all.data.map((p) => p.category).filter(Boolean))];
    return { data: cats.sort(), error: null };
  }
}

export const placeService = new PlaceService();
