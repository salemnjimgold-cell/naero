const { createSupabaseRestClient } = require('../supabaseRest');

function createPlacesRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const TABLE = '/places';

  return {
    list: async (filters = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*');
      if (filters.city) params.append('city', `eq.${encodeURIComponent(filters.city)}`);
      if (filters.category) params.append('category', `eq.${encodeURIComponent(filters.category)}`);
      if (filters.verified !== undefined) params.append('verified', `eq.${filters.verified}`);
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.offset) params.append('offset', String(filters.offset));
      if (filters.order) params.append('order', filters.order);

      const query = params.toString();
      return client.request(`${TABLE}?${query}`);
    },

    getById: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (place, userId) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify([{ ...place, created_by: userId }]),
        headers: { prefer: 'return=representation' },
      });
    },

    update: async (id, updates) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { prefer: 'return=representation' },
      });
    },

    remove: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    search: async (query) => {
      return client.request(`${TABLE}?name=ilike.*${encodeURIComponent(query)}*&select=*`);
    },

    listByCityAndCategory: async (city, category) => {
      return client.request(`${TABLE}?city=eq.${encodeURIComponent(city)}&category=eq.${encodeURIComponent(category)}&select=*`);
    },

    count: async (filters = {}) => {
      const params = new URLSearchParams();
      params.set('select', 'id');
      if (filters.city) params.append('city', `eq.${encodeURIComponent(filters.city)}`);
      if (filters.category) params.append('category', `eq.${encodeURIComponent(filters.category)}`);
      const query = params.toString();
      return client.request(`${TABLE}?${query}`);
    },
  };
}

module.exports = { createPlacesRepository };
