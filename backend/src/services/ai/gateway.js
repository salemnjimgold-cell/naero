function createAIGateway(env, providerFactory) {
  function buildRequest({ messages, provider, model, temperature, maxTokens, topP, tools }) {
    return {
      messages: messages || [],
      options: {
        model: model || env.ai?.model || undefined,
        temperature: temperature ?? undefined,
        maxTokens: maxTokens ?? undefined,
        topP: topP ?? undefined,
        tools: tools || undefined,
      },
      provider: provider || undefined,
    };
  }

  async function chat(request) {
    const { messages, options, provider: preferredProvider } = request;

    const provider = preferredProvider
      ? providerFactory.getProvider(preferredProvider)
      : providerFactory.getDefaultProvider();

    if (!provider) {
      return {
        data: null,
        error: { code: 'AI_NOT_AVAILABLE', message: 'No AI provider is configured and available.' },
      };
    }

    if (!provider.configured) {
      return {
        data: null,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: `Provider "${provider.name}" is not configured. Check API keys in environment.`,
        },
      };
    }

    const startedAt = Date.now();
    const result = await provider.chat(messages, options);
    const latencyMs = Date.now() - startedAt;

    if (result.error) {
      return {
        data: null,
        error: { ...result.error, provider: provider.name, latencyMs },
      };
    }

    const { data } = result;
    const estimatedCost = provider.estimateCost(
      data.model,
      data.usage.promptTokens,
      data.usage.completionTokens
    );

    const response = {
      ...data,
      tracking: {
        latencyMs,
        estimatedCostUsd: Math.round(estimatedCost * 1e6) / 1e6,
      },
    };

    if (data.toolCalls && data.toolCalls.length > 0) {
      response.toolCalls = data.toolCalls;
    }

    return {
      data: response,
      error: null,
    };
  }

  function extractToolCalls(responseData) {
    if (responseData.toolCalls && responseData.toolCalls.length > 0) {
      return responseData.toolCalls;
    }
    return [];
  }

  return {
    chat,
    buildRequest,
    extractToolCalls,
  };
}

module.exports = { createAIGateway };
