function createOpenAIProvider(env, fetchImpl = fetch) {
  const apiKey = env.ai?.openaiApiKey || process.env.OPENAI_API_KEY || '';
  const baseUrl = 'https://api.openai.com/v1';
  const configured = Boolean(apiKey);

  const MODELS = {
    'gpt-4o': { maxTokens: 16384, costPer1kPrompt: 0.0025, costPer1kCompletion: 0.01, supportsTools: true },
    'gpt-4o-mini': { maxTokens: 16384, costPer1kPrompt: 0.00015, costPer1kCompletion: 0.0006, supportsTools: true },
    'gpt-4-turbo': { maxTokens: 4096, costPer1kPrompt: 0.01, costPer1kCompletion: 0.03, supportsTools: true },
    'gpt-3.5-turbo': { maxTokens: 4096, costPer1kPrompt: 0.0005, costPer1kCompletion: 0.0015, supportsTools: true },
  };

  async function chat(messages, options = {}) {
    if (!configured) {
      return { data: null, error: { code: 'AI_NOT_CONFIGURED', message: 'OpenAI API key is not configured.' } };
    }

    const model = options.model || 'gpt-4o-mini';
    const modelConfig = MODELS[model] || MODELS['gpt-4o-mini'];

    const requestBody = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      top_p: options.topP ?? 1,
    };

    if (options.tools && options.tools.length > 0 && modelConfig.supportsTools) {
      requestBody.tools = options.tools;
    }

    const response = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const body = await response.json();
    if (!response.ok) {
      return {
        data: null,
        error: { code: 'AI_PROVIDER_ERROR', status: response.status, message: body.error?.message || response.statusText },
      };
    }

    const choice = body.choices?.[0];
    if (!choice) {
      return { data: null, error: { code: 'AI_EMPTY_RESPONSE', message: 'Provider returned no choices.' } };
    }

    const message = choice.message || {};
    const toolCalls = message.tool_calls || null;

    const result = {
      id: body.id,
      provider: 'openai',
      model: body.model,
      message: {
        role: 'assistant',
        content: message.content || '',
      },
      usage: {
        promptTokens: body.usage?.prompt_tokens || 0,
        completionTokens: body.usage?.completion_tokens || 0,
        totalTokens: body.usage?.total_tokens || 0,
      },
    };

    if (toolCalls && toolCalls.length > 0) {
      result.toolCalls = toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function?.name || '',
          arguments: tc.function?.arguments || '{}',
        },
      }));
    }

    return { data: result, error: null };
  }

  async function stream(messages, options = {}) {
    return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Streaming not yet supported.' } };
  }

  function estimateCost(model, promptTokens, completionTokens) {
    const modelConfig = MODELS[model] || MODELS['gpt-4o-mini'];
    const promptCost = (promptTokens / 1000) * modelConfig.costPer1kPrompt;
    const completionCost = (completionTokens / 1000) * modelConfig.costPer1kCompletion;
    return promptCost + completionCost;
  }

  return {
    name: 'openai',
    configured,
    chat,
    stream,
    estimateCost,
    models: Object.keys(MODELS),
  };
}

module.exports = { createOpenAIProvider };
