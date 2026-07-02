const { PERMISSIONS } = require('./permissions');

function createNotificationsTools(repositories) {
  return {
    getNotifications: {
      async execute(args, userId) {
        if (!userId) {
          return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } };
        }
        const { status, type, limit, offset } = args || {};
        return repositories.notifications.listByUser(userId, {
          status: status || undefined,
          type: type || undefined,
          limit: Math.min(limit || 20, 100),
          offset: offset || 0,
        });
      },
      permissions: [PERMISSIONS.READ_NOTIFICATIONS],
      rateLimit: 30,
      description: 'Get notifications for the authenticated user. Supports filtering by status and type.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status: pending, sent, failed, read' },
          type: { type: 'string', description: 'Filter by notification type' },
          limit: { type: 'number', description: 'Maximum results (default 20, max 100)' },
          offset: { type: 'number', description: 'Pagination offset' },
        },
      },
    },

    createNotification: {
      async execute(args, userId) {
        if (!userId) {
          return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } };
        }
        const { type, title, body, data, targetUserId } = args || {};

        if (!type) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'type is required.' } };
        }
        if (!title) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'title is required.' } };
        }
        if (!body) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'body is required.' } };
        }

        const recipientId = targetUserId || userId;
        return repositories.notifications.create({
          user_id: recipientId,
          type,
          title,
          body,
          data: data ? (typeof data === 'string' ? JSON.parse(data) : data) : null,
          channel: 'in-app',
          status: 'pending',
        });
      },
      permissions: [PERMISSIONS.WRITE_NOTIFICATIONS],
      rateLimit: 10,
      description: 'Create an in-app notification for the user or another user. Requires type, title, and body.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Notification type (e.g. system, reminder, alert)' },
          title: { type: 'string', description: 'Notification title' },
          body: { type: 'string', description: 'Notification body text' },
          data: { type: 'string', description: 'Optional JSON string with additional data payload' },
          targetUserId: { type: 'string', description: 'Optional target user UUID (defaults to self)' },
        },
        required: ['type', 'title', 'body'],
      },
    },
  };
}

module.exports = { createNotificationsTools };
