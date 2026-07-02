function createNotificationRoutes(env, repositories) {
  async function handleNotifications(req, res, url, auth) {
    if (!auth.ok) {
      return { status: auth.statusCode, body: { error: { code: auth.code, message: auth.message } } };
    }

    const userId = auth.user.id;
    const { parsePagination, buildOffsetResponse } = require('../http/pagination');
    const pagination = parsePagination(url);

    if (req.method === 'GET' && url.pathname === '/v1/notifications') {
      const result = await repositories.notifications.listByUser(userId, {
        limit: pagination.limit,
        offset: pagination.offset,
        status: url.searchParams.get('status') || undefined,
        type: url.searchParams.get('type') || undefined,
      });
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 200, body: buildOffsetResponse(result.data, result.data?.length, pagination) };
    }

    if (req.method === 'GET' && url.pathname === '/v1/notifications/unread-count') {
      const result = await repositories.notifications.getUnreadCount(userId);
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 200, body: { data: { unread: result.data?.length || 0 } } };
    }

    if (req.method === 'GET' && url.pathname.startsWith('/v1/notifications/')) {
      const id = url.pathname.split('/').pop();
      if (id === 'unread-count') return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Route not found.' } } };
      const result = await repositories.notifications.getById(id);
      if (result.error) return { status: 502, body: { error: result.error } };
      const notification = result.data?.[0];
      if (!notification) return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Notification not found.' } } };
      if (notification.user_id !== userId) return { status: 403, body: { error: { code: 'FORBIDDEN', message: 'Access denied.' } } };
      return { status: 200, body: { data: notification } };
    }

    if (req.method === 'PUT' && url.pathname.startsWith('/v1/notifications/')) {
      const id = url.pathname.split('/').pop();
      const result = await repositories.notifications.markRead(id);
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 200, body: { data: { read: true } } };
    }

    if (req.method === 'PUT' && url.pathname === '/v1/notifications/read-all') {
      const result = await repositories.notifications.markAllRead(userId);
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 200, body: { data: { read: true } } };
    }

    return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Notification route not found.' } } };
  }

  return { handleNotifications };
}

module.exports = { createNotificationRoutes };
