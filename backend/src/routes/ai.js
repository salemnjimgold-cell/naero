const { readJson } = require('../http/respond');

function createAIRoutes(env, repositories, aiServices) {
  const { parsePagination, buildOffsetResponse } = require('../http/pagination');

  async function handleAI(req, res, url, auth) {
    if (!auth.ok) {
      return { status: auth.statusCode, body: { error: { code: auth.code, message: auth.message } } };
    }

    const userId = auth.user.id;

    if (req.method === 'GET' && url.pathname === '/v1/ai/templates') {
      const templates = aiServices.prompts.getTemplateInfo();
      return { status: 200, body: { data: templates } };
    }

    if (req.method === 'GET' && url.pathname === '/v1/ai/providers') {
      const configured = aiServices.providerFactory.getConfiguredProviders().map(p => ({
        name: p.name,
        configured: p.configured,
        models: p.models || [],
      }));
      const defaultProvider = aiServices.providerFactory.getDefaultProvider();
      return {
        status: 200,
        body: {
          data: {
            providers: configured,
            default: defaultProvider?.name || null,
            configured: configured.length > 0,
          },
        },
      };
    }

    if (req.method === 'GET' && url.pathname === '/v1/ai/tools') {
      const allTools = aiServices.toolExecutor.registry.getAllTools();
      return { status: 200, body: { data: allTools } };
    }

    if (req.method === 'POST' && url.pathname === '/v1/ai/tools/execute') {
      const body = await readJson(req);
      if (!body.tool) {
        return { status: 400, body: { error: { code: 'MISSING_TOOL', message: 'tool name is required.' } } };
      }
      const result = await aiServices.executeTool(body.tool, body.args || {}, userId);
      return { status: 200, body: { data: result } };
    }

    if (req.method === 'GET' && url.pathname === '/v1/ai/conversations') {
      const pagination = parsePagination(url);
      const result = await repositories.aiConversations.listByUser(userId, {
        limit: pagination.limit,
        offset: pagination.offset,
      });
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 200, body: buildOffsetResponse(result.data, result.data?.length, pagination) };
    }

    if (req.method === 'POST' && url.pathname === '/v1/ai/conversations') {
      const body = await readJson(req);
      const result = await repositories.aiConversations.create(
        { title: body.title || 'New Conversation', topic: body.topic || null },
        userId
      );
      if (result.error) return { status: 502, body: { error: result.error } };
      return { status: 201, body: { data: result.data } };
    }

    if (req.method === 'GET' && url.pathname.includes('/messages')) {
      const parts = url.pathname.split('/');
      const convIdx = parts.indexOf('conversations');
      if (convIdx === -1) return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Route not found.' } } };
      const conversationId = parts[convIdx + 1];
      const pagination = parsePagination(url);
      const result = await repositories.aiMessages.listByConversation(conversationId, {
        limit: pagination.limit,
        offset: pagination.offset,
      });
      if (result.error) return { status: 502, body: { error: result.error } };

      const messages = (result.data || []).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content_redacted ? '[Content redacted]' : m.content,
        model: m.model,
        createdAt: m.created_at,
      }));

      return { status: 200, body: { data: messages } };
    }

    if (req.method === 'GET' && url.pathname.startsWith('/v1/ai/conversations/')) {
      const parts = url.pathname.split('/');
      const conversationId = parts[parts.length - 1];

      if (['templates', 'providers', 'tools'].includes(conversationId)) {
        return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Route not found.' } } };
      }

      const result = await repositories.aiConversations.getById(conversationId);
      if (result.error) return { status: 502, body: { error: result.error } };
      const conversation = result.data?.[0];
      if (!conversation) return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Conversation not found.' } } };
      if (conversation.user_id !== userId) return { status: 403, body: { error: { code: 'FORBIDDEN', message: 'Access denied.' } } };
      return { status: 200, body: { data: conversation } };
    }

    if (req.method === 'POST' && url.pathname === '/v1/ai/chat') {
      const body = await readJson(req);

      if (!body.message) {
        return { status: 400, body: { error: { code: 'MISSING_MESSAGE', message: 'message is required.' } } };
      }

      if (!body.conversationId) {
        return { status: 400, body: { error: { code: 'MISSING_CONVERSATION', message: 'conversationId is required.' } } };
      }

      const result = await aiServices.chat(userId, body.conversationId, body.message, {
        topic: body.topic || undefined,
        model: body.model || undefined,
        temperature: body.temperature !== undefined ? body.temperature : undefined,
        maxTokens: body.maxTokens || undefined,
        provider: body.provider || undefined,
        tools: body.tools || undefined,
        ragEnabled: body.ragEnabled || undefined,
        ragMatchCount: body.ragMatchCount || undefined,
        ragThreshold: body.ragThreshold !== undefined ? body.ragThreshold : undefined,
        ragHybrid: body.ragHybrid !== undefined ? body.ragHybrid : undefined,
        ragSourceType: body.ragSourceType || undefined,
      });

      if (result.error) {
        return { status: 502, body: { error: result.error } };
      }

      const response = { data: result.data };
      if (result.executedTools) {
        response.executedTools = result.executedTools;
      }
      if (result.ragMetrics) {
        response.ragMetrics = result.ragMetrics;
      }

      return { status: 200, body: response };
    }

    return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'AI route not found.' } } };
  }

  return { handleAI };
}

module.exports = { createAIRoutes };
