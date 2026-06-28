import { DataService } from './dataService';
import { mockCommunityPosts } from '../data/providers/mockCommunity';

class CommunityService extends DataService {
  constructor() {
    super('communityPosts', mockCommunityPosts);
  }

  async getPosts({ type = null, city = null, limit = 20 } = {}) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = all.data;
    if (type) items = items.filter((p) => p.type === type);
    if (city) items = this.filterByCity(items, city);
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { data: items.slice(0, limit), error: null };
  }

  async getByCity(city) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    return { data: this.filterByCity(all.data, city), error: null };
  }

  async getAlerts(city = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = all.data.filter((p) => p.type === 'alert' || p.type === 'warning');
    if (city) items = this.filterByCity(items, city);
    return { data: items, error: null };
  }

  async addPost(post) {
    return { data: { id: `post_${Date.now()}`, ...post }, error: null };
  }

  async addComment(postId, comment) {
    return { data: { id: `cm_${Date.now()}`, postId, ...comment }, error: null };
  }

  async likePost(postId, userId) {
    return { success: true, error: null };
  }

  async searchPosts(query, city = null) {
    const all = await this.getAll();
    if (!all.data) return { data: [], error: null };
    let items = all.data;
    if (city) items = this.filterByCity(items, city);
    items = this.search(items, query);
    return { data: items, error: null };
  }
}

export const communityService = new CommunityService();
