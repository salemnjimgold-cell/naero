const { createSupabaseRestClient } = require('../supabaseRest');

function createAiMessagesRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const TABLE = '/ai_messages';

  return {
    listByConversation: async (conversationId, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*');
      params.append('conversation_id', `eq.${encodeURIComponent(conversationId)}`);
      params.append('order', 'created_at.asc');
      if (options.limit) params.append('limit', String(options.limit));
      if (options.offset) params.append('offset', String(options.offset));
      if (options.after) params.append('created_at', `gte.${options.after}`);
      return client.request(`${TABLE}?${params.toString()}`);
    },

    getById: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (message) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify([message]),
        headers: { prefer: 'return=representation' },
      });
    },

    getLastByConversation: async (conversationId) => {
      return client.request(`${TABLE}?conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=created_at.desc&limit=1`);
    },

    countByConversation: async (conversationId) => {
      return client.request(`${TABLE}?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id`);
    },

    removeByConversation: async (conversationId) => {
      return client.request(`${TABLE}?conversation_id=eq.${encodeURIComponent(conversationId)}`, {
        method: 'DELETE',
      });
    },
  };
}

module.exports = { createAiMessagesRepository };
