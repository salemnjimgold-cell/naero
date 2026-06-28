import { DataService } from './dataService';
import { mockPlaces } from '../data/providers/mockPlaces';
import { sortByDistance } from '../utils/distance';
import { filterByCity } from '../utils/geo';
import { searchNearbyPlaces, searchCityPlaces } from './api/overpassApi';
import { isRealtimeEnabled } from './realTimeService';
import { placesCache } from './cacheService';

class PlaceService extends DataService {
  constructor() {
    super('places', mockPlaces);
  }

  async getNearby(userLat, userLng, radiusKm = 10, limit = 20) {
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
    return { data: sorted.slice(0, limit), error: null, source: 'local' };
  }

  async getByCategory(category, city = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = this.filterByCategory(all.data, category);
    if (city) items = this.filterByCity(items, city);
    return { data: items, error: null };
  }

  async getByCity(city) {
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
    return { data: filterByCity(all.data, city), error: null, source: 'local' };
  }

  async searchPlaces(query, city = null, category = null) {
    if (isRealtimeEnabled() && city) {
      const overpass = await searchCityPlaces(city, category);
      if (overpass.length > 0) {
        const q = query.toLowerCase();
        const filtered = overpass.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
        );
        if (filtered.length > 0) return { data: filtered, error: null, source: 'overpass' };
      }
    }
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = all.data;
    if (city) items = this.filterByCity(items, city);
    if (category) items = this.filterByCategory(items, category);
    items = this.search(items, query);
    return { data: items, error: null, source: 'local' };
  }

  async getCategories() {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    const cats = [...new Set(all.data.map((p) => p.category))];
    return { data: cats, error: null };
  }
}

export const placeService = new PlaceService();
