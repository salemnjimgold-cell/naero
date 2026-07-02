const { createSupabaseRestClient } = require('../supabaseRest');

function createModerationRepository(baseUrl, serviceRoleKey, fetchImpl = fetch) {
  const client = createSupabaseRestClient({ supabase: { url: baseUrl, serviceRoleKey } }, fetchImpl);
  const QUEUE_TABLE = '/moderation_queue';
  const ACTIONS_TABLE = '/moderation_actions';

  const STATUS = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ESCALATED: 'escalated',
  };

  const ACTION_TYPES = {
    FLAG: 'flag',
    ASSIGN: 'assign',
    REVIEW: 'review',
    APPROVE: 'approve',
    REJECT: 'reject',
    ESCALATE: 'escalate',
    DISMISS: 'dismiss',
    NOTE: 'note',
  };

  return {
    STATUS,
    ACTION_TYPES,

    // ── Moderation Queue ──

    list: async (options = {}) => {
      const params = new URLSearchParams();
      params.set('select', '*,flagged_by:flagged_by(display_name),reviewed_by:reviewed_by(display_name)');
      params.append('order', 'created_at.desc');
      if (options.status) params.append('status', `eq.${encodeURIComponent(options.status)}`);
      if (options.priority) params.append('priority', `eq.${encodeURIComponent(options.priority)}`);
      if (options.assignedTo) params.append('assigned_to', `eq.${encodeURIComponent(options.assignedTo)}`);
      if (options.limit) params.append('limit', String(options.limit));
      if (options.offset) params.append('offset', String(options.offset));
      return client.request(`${QUEUE_TABLE}?${params.toString()}`);
    },

    getById: async (id) => {
      return client.request(`${QUEUE_TABLE}?id=eq.${encodeURIComponent(id)}&select=*`);
    },

    create: async (entry) => {
      return client.request(QUEUE_TABLE, {
        method: 'POST',
        body: JSON.stringify([entry]),
        headers: { prefer: 'return=representation' },
      });
    },

    updateStatus: async (id, status, reviewerId, resolution) => {
      const updates = {
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        resolution: resolution || null,
      };
      return client.request(`${QUEUE_TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { prefer: 'return=representation' },
      });
    },

    assign: async (id, moderatorId) => {
      return client.request(`${QUEUE_TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ assigned_to: moderatorId }),
        headers: { prefer: 'return=representation' },
      });
    },

    addFlag: async (id, flag) => {
      return client.request(`${QUEUE_TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { prefer: 'return=representation' },
        body: JSON.stringify({
          status: 'flagged',
          flags: { append: [flag] },
        }),
      });
    },

    // ── Moderation Actions ──

    listActions: async (moderationId) => {
      const params = new URLSearchParams();
      params.set('select', '*,actioned_by:actioned_by(display_name)');
      params.append('moderation_id', `eq.${encodeURIComponent(moderationId)}`);
      params.append('order', 'created_at.desc');
      return client.request(`${ACTIONS_TABLE}?${params.toString()}`);
    },

    addAction: async (moderationId, actionType, actionedBy, reason, details) => {
      return client.request(ACTIONS_TABLE, {
        method: 'POST',
        body: JSON.stringify([{
          moderation_id: moderationId,
          action_type: actionType,
          actioned_by: actionedBy,
          reason: reason || null,
          details: details || null,
        }]),
        headers: { prefer: 'return=representation' },
      });
    },

    // ── Review Status Helpers ──

    updateReviewStatus: async (reviewId, status, moderatorId, note) => {
      return client.request(`/reviews?id=eq.${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          moderation_status: status,
          moderated_by: moderatorId,
          moderated_at: new Date().toISOString(),
          moderation_note: note || null,
        }),
        headers: { prefer: 'return=representation' },
      });
    },
  };
}

module.exports = { createModerationRepository };
