const { createProviderFactory } = require('./providers/factory');
const { createAIGateway } = require('./gateway');
const { createPromptService } = require('./prompts/index');
const { createContextBuilder } = require('./context');
const { createMemoryService } = require('./memory');
const { createTrackingService } = require('./tracking');
const { createToolExecutor } = require('./tools/executor');
const { createKnowledgeEngine } = require('./knowledge/index');

function createAIServices(env, repositories, profileStore) {
  const providerFactory = createProviderFactory(env);
  const gateway = createAIGateway(env, providerFactory);
  const prompts = createPromptService();
  const context = createContextBuilder(env, repositories);
  const memory = createMemoryService(env, repositories);
  const tracking = createTrackingService(env);
  const toolExecutor = createToolExecutor(env, repositories, profileStore);
  const knowledgeEngine = createKnowledgeEngine(env, repositories);

  if (repositories?.activityLogs) {
    toolExecutor.setAuditRepositories(null, repositories.activityLogs);
  }

  async function chat(userId, conversationId, message, options = {}) {
    const topic = options.topic || null;
    const useTools = options.tools || null;
    const ragEnabled = options.ragEnabled || false;

    const contextData = await context.buildContext(userId, conversationId, topic);
    let contextStr = context.formatContextForPrompt(contextData);
    let ragMetrics = null;

    if (ragEnabled) {
      const ragResult = await knowledgeEngine.retrieveAndAssemble(message, contextData, {
        ragEnabled: true,
        matchCount: options.ragMatchCount || 5,
        threshold: options.ragThreshold ?? 0.7,
        useHybrid: options.ragHybrid !== undefined ? options.ragHybrid : true,
        sourceType: options.ragSourceType || null,
      });
      if (ragResult.context) {
        contextStr = `${ragResult.context}\n\n${contextStr}`;
      }
      ragMetrics = knowledgeEngine.getMetrics(ragResult);
    }

    const history = await memory.getConversationMemory(conversationId);

    const toolDefinitions = useTools
      ? toolExecutor.registry.getToolDefinitions().filter(t => useTools.includes(t.function.name))
      : null;

    const messages = prompts.buildMessages(topic, message, contextStr, history);
    const startedAt = Date.now();

    const gatewayRequest = gateway.buildRequest({
      messages,
      options: {
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        tools: toolDefinitions || undefined,
      },
      provider: options.provider,
    });

    const result = await gateway.chat(gatewayRequest);
    const latencyMs = Date.now() - startedAt;

    const executedTools = [];

    if (result.data) {
      const { data } = result;

      const toolCalls = gateway.extractToolCalls(data);
      if (toolCalls && toolCalls.length > 0) {
        for (const tc of toolCalls) {
          let args;
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            args = {};
          }
          const toolResult = await toolExecutor.execute(tc.function.name, args, userId);
          executedTools.push(toolResult);
        }
      }

      await memory.addMessage(conversationId, 'user', message, {
        tokensIn: data.usage?.promptTokens,
      });

      const assistantContent = data.message?.content || '';
      await memory.addMessage(conversationId, 'assistant', assistantContent, {
        model: data.model,
        tokensOut: data.usage?.completionTokens,
        latencyMs,
        metadata: {
          provider: data.provider,
          model: data.model,
          usage: data.usage,
          tracking: data.tracking,
          toolCalls: executedTools.length > 0 ? executedTools.map(t => ({ tool: t.tool, success: t.success })) : undefined,
        },
      });

      if (repositories?.aiConversations?.incrementMessageCount) {
        await repositories.aiConversations.incrementMessageCount(conversationId);
      }

      await tracking.record({
        provider: data.provider,
        model: data.model,
        promptTokens: data.usage?.promptTokens || 0,
        completionTokens: data.usage?.completionTokens || 0,
        latencyMs: data.tracking?.latencyMs || latencyMs,
        estimatedCostUsd: data.tracking?.estimatedCostUsd || 0,
        userId,
        conversationId,
        status: 'success',
      });
    } else if (result.error) {
      await memory.addMessage(conversationId, 'user', message);

      await tracking.record({
        provider: options.provider || 'unknown',
        model: options.model || 'unknown',
        latencyMs,
        userId,
        conversationId,
        status: 'error',
        errorMessage: result.error.message,
      });
    }

    const response = {
      ...result,
      executedTools: executedTools.length > 0 ? executedTools : undefined,
    };
    if (ragMetrics) {
      response.ragMetrics = ragMetrics;
    }
    return response;
  }

  async function executeTool(toolName, args, userId) {
    return toolExecutor.execute(toolName, args, userId);
  }

  return {
    gateway,
    prompts,
    context,
    memory,
    tracking,
    providerFactory,
    toolExecutor,
    knowledgeEngine,
    chat,
    executeTool,
  };
}

module.exports = { createAIServices };
