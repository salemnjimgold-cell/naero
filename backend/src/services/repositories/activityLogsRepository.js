const { createSupabaseRestClient } = require('../supabaseRest');

function createActivityLogsRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const TABLE = '/activity_logs';

  const ACTIVITY_TYPES = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    PROFILE_UPDATE: 'profile_update',
    REVIEW_CREATE: 'review_create',
    REVIEW_UPDATE: 'review_update',
    REVIEW_DELETE: 'review_delete',
    REPORT_CREATE: 'report_create',
    REPORT_RESOLVE: 'report_resolve',
    MODERATION_ACTION: 'moderation_action',
    PLACE_CREATE: 'place_create',
    PLACE_UPDATE: 'place_update',
    SAVED_PLACE_CREATE: 'saved_place_create',
    SAVED_PLACE_DELETE: 'saved_place_delete',
    AI_CONVERSATION_CREATE: 'ai_conversation_create',
    SETTINGS_UPDATE: 'settings_update',
  };

  return {
    ACTIVITY_TYPES,

    listByUser: async (userId, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*');
      params.append('user_id', `eq.${encodeURIComponent(userId)}`);
      params.append('order', 'created_at.desc');
      if (options.limit) params.append('limit', String(options.limit));
      if (options.offset) params.append('offset', String(options.offset));
      if (options.activityType) params.append('activity_type', `eq.${encodeURIComponent(options.activityType)}`);
      if (options.fromDate) params.append('created_at', `gte.${encodeURIComponent(options.fromDate)}`);
      if (options.toDate) params.append('created_at', `lte.${encodeURIComponent(options.toDate)}`);
      return client.request(`${TABLE}?${params.toString()}`);
    },

    listByType: async (activityType, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*,user:user_id(display_name)');
      params.append('activity_type', `eq.${encodeURIComponent(activityType)}`);
      params.append('order', 'created_at.desc');
      if (options.limit) params.append('limit', String(options.limit));
      if (options.offset) params.append('offset', String(options.offset));
      if (options.fromDate) params.append('created_at', `gte.${encodeURIComponent(options.fromDate)}`);
      if (options.toDate) params.append('created_at', `lte.${encodeURIComponent(options.toDate)}`);
      return client.request(`${TABLE}?${params.toString()}`);
    },

    getById: async (id) => {
      return client.request(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (logEntry) => {
      return client.request(TABLE, {
        method: 'POST',
        body: JSON.stringify([logEntry]),
        headers: { prefer: 'return=representation' },
      });
    },

    countByType: async (activityType, options = {}) => {
      const params = new URLSearchParams();
      params.set('select', 'id');
      params.append('activity_type', `eq.${encodeURIComponent(activityType)}`);
      if (options.fromDate) params.append('created_at', `gte.${encodeURIComponent(options.fromDate)}`);
      if (options.toDate) params.append('created_at', `lte.${encodeURIComponent(options.toDate)}`);
      return client.request(`${TABLE}?${params.toString()}`);
    },
  };
}

module.exports = { createActivityLogsRepository };
