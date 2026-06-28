import { DataService } from './dataService';
import { mockServices } from '../data/providers/mockServices';
import { sortByDistance } from '../utils/distance';
import { filterByCity } from '../utils/geo';

class ServiceService extends DataService {
  constructor() {
    super('services', mockServices);
  }

  async getByCategory(category, city = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = this.filterByCategory(all.data, category);
    if (city) items = this.filterByCity(items, city);
    return { data: items, error: null };
  }

  async getByCity(city) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return { data: filterByCity(all.data, city), error: null };
  }

  async getNearby(userLat, userLng, radiusKm = 10) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return { data: sortByDistance(all.data, userLat, userLng, radiusKm), error: null };
  }

  async getFree() {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return {
      data: all.data.filter(
        (s) => s.price && s.price.toLowerCase() === 'free'
      ),
      error: null,
    };
  }

  async searchServices(query, city = null, category = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = all.data;
    if (city) items = this.filterByCity(items, city);
    if (category) items = this.filterByCategory(items, category);
    items = this.search(items, query);
    return { data: items, error: null };
  }

  getCategories() {
    return { data: [...new Set(mockServices.map((s) => s.category))], error: null };
  }
}

export const serviceService = new ServiceService();
