function createMemoryService(env, repositories) {
  const SHORT_TERM_LIMIT = 20;

  async function getConversationMemory(conversationId) {
    if (!conversationId || !repositories?.aiMessages) return [];

    try {
      const result = await repositories.aiMessages.listByConversation(conversationId, {
        limit: SHORT_TERM_LIMIT,
      });
      return (result.data || []).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content_redacted ? '[redacted]' : m.content,
        createdAt: m.created_at,
      }));
    } catch {
      return [];
    }
  }

  async function getLongTermPreferences(userId) {
    if (!userId || !repositories?.profiles) return {};

    try {
      const result = await repositories.profiles.getById(userId);
      if (result.data && result.data.length > 0) {
        const p = result.data[0];
        return {
          preferredLanguage: p.preferred_language,
          housingStatus: p.housing_status,
          workStatus: p.work_status,
          migrationReason: p.migration_reason,
          aiPersonalizationEnabled: p.ai_personalization_enabled,
        };
      }
    } catch {
      // silently fail
    }
    return {};
  }

  async function getConversationSummary(conversationId) {
    if (!conversationId || !repositories?.aiConversations) return null;

    try {
      const result = await repositories.aiConversations.getById(conversationId);
      if (result.data && result.data.length > 0) {
        const conv = result.data[0];
        return {
          topic: conv.topic,
          title: conv.title,
          messageCount: conv.message_count,
          createdAt: conv.created_at,
        };
      }
    } catch {
      // silently fail
    }
    return null;
  }

  async function addMessage(conversationId, role, content, options = {}) {
    if (!conversationId || !repositories?.aiMessages) {
      return { data: null, error: { code: 'MEMORY_UNAVAILABLE', message: 'Message storage is not available.' } };
    }

    const message = {
      conversation_id: conversationId,
      role,
      content,
      content_redacted: options.redacted || false,
      tokens_in: options.tokensIn || null,
      tokens_out: options.tokensOut || null,
      model: options.model || null,
      latency_ms: options.latencyMs || null,
      metadata: options.metadata || null,
    };

    return repositories.aiMessages.create(message);
  }

  return {
    getConversationMemory,
    getLongTermPreferences,
    getConversationSummary,
    addMessage,
  };
}

module.exports = { createMemoryService };
