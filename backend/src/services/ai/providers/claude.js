function createClaudeProvider(env, fetchImpl = fetch) {
  const apiKey = env.ai?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '';
  const baseUrl = 'https://api.anthropic.com/v1';
  const configured = Boolean(apiKey);

  const MODELS = {
    'claude-3-5-sonnet-20241022': { maxTokens: 8192, costPer1kPrompt: 0.003, costPer1kCompletion: 0.015 },
    'claude-3-5-haiku-20241022': { maxTokens: 8192, costPer1kPrompt: 0.0008, costPer1kCompletion: 0.004 },
    'claude-3-opus-20240229': { maxTokens: 4096, costPer1kPrompt: 0.015, costPer1kCompletion: 0.075 },
    'claude-3-sonnet-20240229': { maxTokens: 4096, costPer1kPrompt: 0.003, costPer1kCompletion: 0.015 },
    'claude-3-haiku-20240307': { maxTokens: 4096, costPer1kPrompt: 0.00025, costPer1kCompletion: 0.00125 },
  };

  function convertMessages(messages) {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const msgs = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
    return { system, messages: msgs };
  }

  async function chat(messages, options = {}) {
    if (!configured) {
      return { data: null, error: { code: 'AI_NOT_CONFIGURED', message: 'Anthropic API key is not configured.' } };
    }

    const model = options.model || 'claude-3-5-sonnet-20241022';
    const modelConfig = MODELS[model] || MODELS['claude-3-5-sonnet-20241022'];

    const { system, messages: converted } = convertMessages(messages);
    const anthropicVersion = '2023-06-01';

    const requestBody = {
      model,
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      messages: converted,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 1,
    };
    if (system) {
      requestBody.system = system;
    }

    const response = await fetchImpl(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': anthropicVersion,
        'content-type': 'application/json',
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

    const content = body.content?.map(b => b.text).join('') || '';
    const usage = body.usage || {};

    return {
      data: {
        id: body.id,
        provider: 'claude',
        model: body.model,
        message: { role: 'assistant', content },
        usage: {
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
        },
      },
      error: null,
    };
  }

  async function stream(messages, options = {}) {
    return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Streaming not yet supported.' } };
  }

  function estimateCost(model, promptTokens, completionTokens) {
    const modelConfig = MODELS[model] || MODELS['claude-3-5-sonnet-20241022'];
    const promptCost = (promptTokens / 1000) * modelConfig.costPer1kPrompt;
    const completionCost = (completionTokens / 1000) * modelConfig.costPer1kCompletion;
    return promptCost + completionCost;
  }

  return {
    name: 'claude',
    configured,
    chat,
    stream,
    estimateCost,
    models: Object.keys(MODELS),
  };
}

module.exports = { createClaudeProvider };
