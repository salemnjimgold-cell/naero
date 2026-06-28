import { DataService } from './dataService';
import { mockJobs } from '../data/providers/mockJobs';
import { filterByCity } from '../utils/geo';

class JobService extends DataService {
  constructor() {
    super('jobs', mockJobs);
  }

  async getByType(type, city = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = type ? all.data.filter((j) => j.type === type) : all.data;
    if (city) items = this.filterByCity(items, city);
    return { data: items, error: null };
  }

  async getByCity(city) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return { data: filterByCity(all.data, city), error: null };
  }

  async getByLanguage(language) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    const lang = language.toLowerCase();
    return {
      data: all.data.filter((j) =>
        (j.languages || []).some((l) => l.toLowerCase().includes(lang))
      ),
      error: null,
    };
  }

  async searchJobs(query, city = null, type = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = all.data;
    if (city) items = this.filterByCity(items, city);
    if (type) items = items.filter((j) => j.type === type);
    items = this.search(items, query);
    return { data: items, error: null };
  }
}

export const jobService = new JobService();
