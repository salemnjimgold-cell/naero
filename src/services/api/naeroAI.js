import { naeroApi } from './naeroApi.js';
import { API_BASE_URL } from '../../config/api';

export function createNaeroAI(apiClient = naeroApi) {
  let conversations = [];
  let currentConversationId = null;

  const BASE = API_BASE_URL || 'https://naero.onrender.com';

  function debugReq(method, path, result) {
    return { method, path, url: `${BASE}${path}`, status: result?.status, response: result?.error };
  }

  async function ensureConversation(conversationId) {
    if (conversationId) {
      currentConversationId = conversationId;
      return { id: conversationId, existing: true };
    }
    const result = await apiClient.post('/v1/ai/conversations', {
      title: 'Mobile Chat',
      topic: null,
    });
    if (result.data?.id) {
      currentConversationId = result.data.id;
      conversations.push(result.data);
      return { id: result.data.id, existing: false, _debug: debugReq('POST', '/v1/ai/conversations', result) };
    }
    if (result.error) {
      return { error: result.error, status: result.status, _debug: debugReq('POST', '/v1/ai/conversations', result) };
    }
    return { _debug: debugReq('POST', '/v1/ai/conversations', result) };
  }

  async function sendMessage(message, options = {}) {
    const conv = await ensureConversation(options.conversationId);
    if (!conv || conv.error) {
      return { data: null, error: conv?.error || { code: 'CONVERSATION_FAILED', message: 'Could not create or find conversation.' }, _debug: conv?._debug };
    }

    const result = await apiClient.post('/v1/ai/chat', {
      message,
      conversationId: conv.id,
      topic: options.topic || null,
      model: options.model || null,
      provider: options.provider || null,
      temperature: options.temperature ?? null,
      maxTokens: options.maxTokens || null,
      tools: options.tools || null,
      ragEnabled: options.ragEnabled ?? false,
      ragMatchCount: options.ragMatchCount || null,
      ragThreshold: options.ragThreshold ?? null,
      ragHybrid: options.ragHybrid ?? null,
      ragSourceType: options.ragSourceType || null,
    });

    const debug = debugReq('POST', '/v1/ai/chat', result);

    if (result.data) {
      return {
        data: result.data,
        executedTools: result.executedTools,
        ragMetrics: result.ragMetrics,
        conversationId: conv.id,
        error: null,
        _debug: debug,
      };
    }

    return { data: null, error: result.error, conversationId: conv.id, _debug: debug };
  }

  async function getConversations() {
    const result = await apiClient.get('/v1/ai/conversations');
    if (result.data) {
      conversations = result.data;
    }
    return { ...result, _debug: debugReq('GET', '/v1/ai/conversations', result) };
  }

  async function getMessages(conversationId) {
    const path = `/v1/ai/conversations/${conversationId}/messages`;
    const result = await apiClient.get(path);
    return { ...result, _debug: debugReq('GET', path, result) };
  }

  async function getTemplates() {
    const result = await apiClient.get('/v1/ai/templates');
    return { ...result, _debug: debugReq('GET', '/v1/ai/templates', result) };
  }

  async function getProviders() {
    const result = await apiClient.get('/v1/ai/providers');
    return { ...result, _debug: debugReq('GET', '/v1/ai/providers', result) };
  }

  async function getTools() {
    const result = await apiClient.get('/v1/ai/tools');
    return { ...result, _debug: debugReq('GET', '/v1/ai/tools', result) };
  }

  function getCurrentConversationId() {
    return currentConversationId;
  }

  function reset() {
    currentConversationId = null;
  }

  return {
    sendMessage,
    getConversations,
    getMessages,
    getTemplates,
    getProviders,
    getTools,
    getCurrentConversationId,
    ensureConversation,
    reset,
  };
}

export const naeroAI = createNaeroAI();
