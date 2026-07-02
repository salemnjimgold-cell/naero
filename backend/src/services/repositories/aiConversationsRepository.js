const { createSupabaseRestClient } = require('../supabaseRest');

function createAiConversationsRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const TABLE = '/ai_conversations';

  return {
    listByUser: async (userId, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*');
      params.append('user_id', `eq.${encodeURIComponent(userId)}`);
      params.append('order', 'updated_at.desc');
      if (options.includeArchived) params.append('is_archived', `eq.${options.includeArchived}`);
      else params.append('is_archived', 'eq.false');
      if (options.limit) params.append('limit', String(options.limit));
      if (options.offset) params.append('offset', String(options.offset));
      return client.request(`${TABLE}?${params.toString()}`);
    },

    getById: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (conversation, userId) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify([{ ...conversation, user_id: userId }]),
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

    archive: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_archived: true }),
        headers: { prefer: 'return=representation' },
      });
    },

    remove: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    incrementMessageCount: async (id) => {
      const result = await client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=message_count`);
      if (result.error) return result;
      const current = result.data?.[0]?.message_count || 0;
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ message_count: current + 1 }),
        headers: { prefer: 'return=representation' },
      });
    },
  };
}

module.exports = { createAiConversationsRepository };
