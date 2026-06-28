import { DataService } from './dataService';
import { mockHousing } from '../data/providers/mockHousing';
import { sortByDistance } from '../utils/distance';
import { filterByCity } from '../utils/geo';

class HousingService extends DataService {
  constructor() {
    super('housing', mockHousing);
  }

  async getByType(type, city = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = type ? all.data.filter((h) => h.type === type) : all.data;
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

  async getByPriceRange(min, max, city = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = all.data.filter((h) => {
      const price = h.priceMin || 0;
      return price >= min && price <= max;
    });
    if (city) items = this.filterByCity(items, city);
    return { data: items, error: null };
  }

  async searchHousing(query, city = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = all.data;
    if (city) items = this.filterByCity(items, city);
    items = this.search(items, query);
    return { data: items, error: null };
  }
}

export const housingService = new HousingService();
