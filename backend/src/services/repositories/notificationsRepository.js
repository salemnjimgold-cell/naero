const { createSupabaseRestClient } = require('../supabaseRest');

function createNotificationsRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const TABLE = '/notifications';

  return {
    listByUser: async (userId, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*');
      params.append('user_id', `eq.${encodeURIComponent(userId)}`);
      params.append('order', 'created_at.desc');
      if (options.limit) params.append('limit', String(options.limit));
      if (options.offset) params.append('offset', String(options.offset));
      if (options.status) params.append('status', `eq.${encodeURIComponent(options.status)}`);
      if (options.type) params.append('type', `eq.${encodeURIComponent(options.type)}`);
      return client.request(`${TABLE}?${params.toString()}`);
    },

    getUnreadCount: async (userId) => {
      const params = new URLSearchParams();
      params.set('select', 'id');
      params.append('user_id', `eq.${encodeURIComponent(userId)}`);
      params.append('status', 'eq.pending');
      params.append('read_at', 'is.null');
      return client.request(`${TABLE}?${params.toString()}`);
    },

    getById: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (notification) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify([notification]),
        headers: { prefer: 'return=representation' },
      });
    },

    createMany: async (notifications) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify(notifications),
        headers: { prefer: 'return=representation' },
      });
    },

    markRead: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'sent', read_at: new Date().toISOString() }),
        headers: { prefer: 'return=representation' },
      });
    },

    markAllRead: async (userId) => {
      return client.request(`${TABLE}?user_id=eq.${encodeURIComponent(userId)}&status=eq.pending`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'sent', read_at: new Date().toISOString() }),
        headers: { prefer: 'return=representation' },
      });
    },

    markFailed: async (id, reason) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'failed', failed_at: new Date().toISOString(), failure_reason: reason }),
        headers: { prefer: 'return=representation' },
      });
    },
  };
}

module.exports = { createNotificationsRepository };
