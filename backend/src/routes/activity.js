function createActivityRoutes(env, repositories) {
  async function handleActivity(req, res, url, auth) {
    if (!auth.ok) {
      return { status: auth.statusCode, body: { error: { code: auth.code, message: auth.message } } };
    }

    const userId = auth.user.id;
    const { parsePagination, buildOffsetResponse } = require('../http/pagination');
    const pagination = parsePagination(url);

    if (req.method === 'GET' && url.pathname === '/v1/activity') {
      const result = await repositories.activityLogs.listByUser(userId, {
        limit: pagination.limit,
        offset: pagination.offset,
        activityType: url.searchParams.get('type') || undefined,
        fromDate: url.searchParams.get('from') || undefined,
        toDate: url.searchParams.get('to') || undefined,
      });
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 200, body: buildOffsetResponse(result.data, result.data?.length, pagination) };
    }

    return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Activity route not found.' } } };
  }

  return { handleActivity };
}

module.exports = { createActivityRoutes };
