function createModerationRoutes(env, repositories) {
  async function handleModeration(req, res, url, auth, readJson) {
    if (!auth.ok) {
      return { status: auth.statusCode, body: { error: { code: auth.code, message: auth.message } } };
    }

    const userId = auth.user.id;
    const { parsePagination, buildOffsetResponse } = require('../http/pagination');
    const pagination = parsePagination(url);

    if (req.method === 'GET' && url.pathname === '/v1/moderation/queue') {
      const status = url.searchParams.get('status') || undefined;
      const priority = url.searchParams.get('priority') || undefined;
      const result = await repositories.moderation.list({
        status,
        priority,
        assignedTo: url.searchParams.get('assigned_to') || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 200, body: buildOffsetResponse(result.data, result.data?.length, pagination) };
    }

    if (req.method === 'GET' && url.pathname.startsWith('/v1/moderation/queue/')) {
      const id = url.pathname.split('/').pop();
      const result = await repositories.moderation.getById(id);
      if (result.error) return { status: 502, body: { error: result.error } };
      const item = result.data?.[0];
      if (!item) return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Queue item not found.' } } };
      return { status: 200, body: { data: item } };
    }

    if (req.method === 'POST' && url.pathname === '/v1/moderation/queue') {
      const body = await readJson(req);
      const result = await repositories.moderation.create({
        reportable_type: body.reportableType,
        reportable_id: body.reportableId,
        reason: body.reason,
        description: body.description || null,
        priority: body.priority || 'normal',
        flagged_by: userId,
      });
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 201, body: { data: result.data } };
    }

    if (req.method === 'PUT' && url.pathname.startsWith('/v1/moderation/queue/')) {
      const id = url.pathname.split('/').pop();
      const body = await readJson(req);

      if (body.action === 'status') {
        const updateResult = await repositories.moderation.updateStatus(id, body.status, userId, body.resolution);
        if (updateResult.error) return { status: 502, body: { error: updateResult.error } };

        if (body.reviewId) {
          await repositories.moderation.updateReviewStatus(body.reviewId, body.status, userId, body.resolution);
        }

        await repositories.moderation.addAction(id, body.status, userId, body.resolution || null, { source: 'api' });

        if (repositories.activityLogs) {
          await repositories.activityLogs.create({
            user_id: userId,
            activity_type: repositories.activityLogs.ACTIVITY_TYPES.MODERATION_ACTION,
            resource_type: 'moderation_queue',
            resource_id: id,
            description: `Moderation ${body.status} on queue item ${id}`,
            metadata: { status: body.status, resolution: body.resolution },
          });
        }

        return { status: 200, body: { data: updateResult.data } };
      }

      if (body.action === 'assign') {
        const result = await repositories.moderation.assign(id, body.moderatorId || userId);
        if (result.error) return { status: 502, body: { error: result.error } };
        return { status: 200, body: { data: result.data } };
      }

      return { status: 400, body: { error: { code: 'INVALID_ACTION', message: 'Invalid moderation action.' } } };
    }

    if (req.method === 'GET' && url.pathname.startsWith('/v1/moderation/queue/') && url.pathname.endsWith('/actions')) {
      const parts = url.pathname.split('/');
      const queueId = parts[parts.length - 2];
      const result = await repositories.moderation.listActions(queueId);
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 200, body: { data: result.data } };
    }

    return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Moderation route not found.' } } };
  }

  return { handleModeration };
}

module.exports = { createModerationRoutes };
