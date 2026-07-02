import { apiClient } from '../apiClient';
import { API_BASE_URL } from '../../config/api';

const defaultNaeroApi = {
  ...apiClient,
  post: (path, body, options) => apiClient.request(path, { ...options, method: 'POST', body }),
};

function firstConversation(candidate) {
  if (!candidate) return null;
  if (Array.isArray(candidate)) return candidate.find(item => item?.id) || null;
  if (candidate.id) return candidate;
  return null;
}

function extractConversation(result) {
  const candidates = [
    result?.data,
    result?.data?.conversation,
    result?.data?.data,
    result?.data?.data?.conversation,
    result?.body,
    result?.body?.data,
    result?.body?.conversation,
    result?.body?.data?.conversation,
    result?.conversation,
  ];

  for (const candidate of candidates) {
    const conversation = firstConversation(candidate);
    if (conversation) return conversation;
  }

  return null;
}

export function createNaeroAI(apiClient = defaultNaeroApi) {
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
    console.log('[AI_DEBUG] create conversation raw response:', JSON.stringify(result, null, 2));
    const conversation = extractConversation(result);
    if (conversation?.id) {
      currentConversationId = conversation.id;
      conversations.push(conversation);
      return { id: conversation.id, existing: false, _debug: debugReq('POST', '/v1/ai/conversations', result) };
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
