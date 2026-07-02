const { createSupabaseRestClient } = require('../supabaseRest');

function createSavedPlacesRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const TABLE = '/saved_places';

  return {
    listByUser: async (userId, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*,place:place_id(*)');
      params.append('user_id', `eq.${encodeURIComponent(userId)}`);
      if (options.listName) params.append('list_name', `eq.${encodeURIComponent(options.listName)}`);
      params.append('order', 'sort_order.asc,created_at.desc');
      if (options.limit) params.append('limit', String(options.limit));
      return client.request(`${TABLE}?${params.toString()}`);
    },

    getById: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (savedPlace, userId) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify([{ ...savedPlace, user_id: userId }]),
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

    isSaved: async (userId, placeId) => {
      return client.request(`${TABLE}?user_id=eq.${encodeURIComponent(userId)}&place_id=eq.${encodeURIComponent(placeId)}&select=id&limit=1`);
    },

    reorder: async (id, sortOrder) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sort_order: sortOrder }),
        headers: { prefer: 'return=representation' },
      });
    },

    listNames: async (userId) => {
      return client.request(`${TABLE}?user_id=eq.${encodeURIComponent(userId)}&select=list_name`);
    },

    removeByPlaceAndUser: async (userId, placeId, listName = 'default') => {
      return client.request(`${TABLE}?user_id=eq.${encodeURIComponent(userId)}&place_id=eq.${encodeURIComponent(placeId)}&list_name=eq.${encodeURIComponent(listName)}`, {
        method: 'DELETE',
      });
    },
  };
}

module.exports = { createSavedPlacesRepository };
