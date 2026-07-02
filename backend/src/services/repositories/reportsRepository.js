const { createSupabaseRestClient } = require('../supabaseRest');

function createReportsRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const TABLE = '/reports';

  return {
    list: async (filters = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*');
      if (filters.status) params.append('status', `eq.${encodeURIComponent(filters.status)}`);
      if (filters.reporterId) params.append('reporter_id', `eq.${encodeURIComponent(filters.reporterId)}`);
      if (filters.reportableType) params.append('reportable_type', `eq.${encodeURIComponent(filters.reportableType)}`);
      if (filters.limit) params.append('limit', String(filters.limit));
      params.append('order', 'created_at.desc');
      return client.request(`${TABLE}?${params.toString()}`);
    },

    getById: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (report, userId) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify([{ ...report, reporter_id: userId }]),
        headers: { prefer: 'return=representation' },
      });
    },

    resolve: async (id, resolution) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: resolution.status || 'resolved',
          resolved_by: resolution.resolvedBy,
          resolution_note: resolution.note,
          resolved_at: new Date().toISOString(),
        }),
        headers: { prefer: 'return=representation' },
      });
    },

    countByStatus: async () => {
      return client.request(`${TABLE}?select=status`);
    },
  };
}

module.exports = { createReportsRepository };
