import { DataService } from './dataService';
import { mockPlaces } from '../data/providers/mockPlaces';
import { sortByDistance } from '../utils/distance';
import { filterByCity } from '../utils/geo';
import { searchNearbyPlaces, searchCityPlaces } from './api/overpassApi';
import { isRealtimeEnabled } from './realTimeService';
import { placesCache } from './cacheService';
import { naeroApi } from './api/naeroApi';

class PlaceService extends DataService {
  constructor() {
    super('places', mockPlaces, { remoteEndpoint: '/v1/places' });
  }

  markDemo(items) {
    return items.map(p => ({ ...p, demo: true }));
  }

  async getNearby(userLat, userLng, radiusKm = 10, limit = 20) {
    if (this.useRemote) {
      const result = await naeroApi.get(`/v1/places/nearby?lat=${userLat}&lng=${userLng}&radius=${radiusKm}&limit=${limit}`);
      if (result.data && !result.error) {
        const items = Array.isArray(result.data) ? result.data : [];
        return { data: items.slice(0, limit), error: null, source: 'remote' };
      }
    }

    if (isRealtimeEnabled()) {
      const overpass = await searchNearbyPlaces(userLat, userLng, radiusKm);
      if (overpass.length > 0) {
        const sorted = sortByDistance(overpass, userLat, userLng, radiusKm);
        return { data: sorted.slice(0, limit), error: null, source: 'overpass' };
      }
    }
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    const sorted = sortByDistance(all.data, userLat, userLng, radiusKm);
    return { data: this.markDemo(sorted.slice(0, limit)), error: null, source: 'local' };
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

    if (isRealtimeEnabled()) {
      const cacheKey = `city_${city.toLowerCase()}`;
      const cached = await placesCache.get(cacheKey);
      if (cached) return { data: cached, error: null, source: 'cache' };

      const overpass = await searchCityPlaces(city);
      if (overpass.length > 0) {
        await placesCache.set(cacheKey, overpass, 10 * 60 * 1000);
        return { data: overpass, error: null, source: 'overpass' };
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

    if (isRealtimeEnabled() && city) {
      const overpass = await searchCityPlaces(city, category);
      if (overpass.length > 0) {
        const q = query.toLowerCase();
        const filtered = overpass.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
        return { data: filtered, error: null, source: 'overpass' };
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
