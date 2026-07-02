const { createSupabaseRestClient } = require('../supabaseRest');

function createReviewsRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const TABLE = '/reviews';

  return {
    listByPlace: async (placeId, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*');
      params.append('place_id', `eq.${encodeURIComponent(placeId)}`);
      params.append('order', 'created_at.desc');
      if (options.limit) params.append('limit', String(options.limit));
      if (options.offset) params.append('offset', String(options.offset));
      return client.request(`${TABLE}?${params.toString()}`);
    },

    listByUser: async (userId, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*,place:place_id(name,category)');
      params.append('user_id', `eq.${encodeURIComponent(userId)}`);
      params.append('order', 'created_at.desc');
      if (options.limit) params.append('limit', String(options.limit));
      return client.request(`${TABLE}?${params.toString()}`);
    },

    getById: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (review, userId) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify([{ ...review, user_id: userId }]),
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

    markHelpful: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ helpful_count: { inc: 1 } }),
        headers: { prefer: 'return=representation' },
      });
    },

    getAverageRating: async (placeId) => {
      return client.request(`${TABLE}?place_id=eq.${encodeURIComponent(placeId)}&select=rating`);
    },
  };
}

module.exports = { createReviewsRepository };
