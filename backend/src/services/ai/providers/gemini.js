function createGeminiProvider(env, fetchImpl = fetch) {
  const apiKey = env.ai?.geminiApiKey || process.env.GEMINI_API_KEY || '';
  const configured = Boolean(apiKey);

  const MODELS = {
    'gemini-2.0-flash': { maxTokens: 8192, costPer1kPrompt: 0.0001, costPer1kCompletion: 0.0004 },
    'gemini-2.0-pro': { maxTokens: 8192, costPer1kPrompt: 0.001, costPer1kCompletion: 0.002 },
    'gemini-1.5-flash': { maxTokens: 8192, costPer1kPrompt: 0.000075, costPer1kCompletion: 0.0003 },
    'gemini-1.5-pro': { maxTokens: 8192, costPer1kPrompt: 0.00125, costPer1kCompletion: 0.005 },
  };

  function convertMessages(messages) {
    const systemInstruction = messages.find(m => m.role === 'system');
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    return { systemInstruction, contents };
  }

  async function chat(messages, options = {}) {
    if (!configured) {
      return { data: null, error: { code: 'AI_NOT_CONFIGURED', message: 'Gemini API key is not configured.' } };
    }

    const model = options.model || 'gemini-2.0-flash';
    const modelConfig = MODELS[model] || MODELS['gemini-2.0-flash'];

    const { systemInstruction, contents } = convertMessages(messages);

    const requestBody = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens || modelConfig.maxTokens,
        topP: options.topP ?? 1,
      },
    };
    if (systemInstruction) {
      requestBody.systemInstruction = { parts: [{ text: systemInstruction.content }] };
    }

    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const response = await fetchImpl(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const body = await response.json();
    if (!response.ok) {
      return {
        data: null,
        error: { code: 'AI_PROVIDER_ERROR', status: response.status, message: body.error?.message || response.statusText },
      };
    }

    const candidate = body.candidates?.[0];
    if (!candidate) {
      return { data: null, error: { code: 'AI_EMPTY_RESPONSE', message: 'Provider returned no candidates.' } };
    }

    const content = candidate.content?.parts?.map(p => p.text).join('') || '';
    const usage = body.usageMetadata || {};

    return {
      data: {
        id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        provider: 'gemini',
        model: body.model || model,
        message: { role: 'assistant', content },
        usage: {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
        },
      },
      error: null,
    };
  }

  async function stream(messages, options = {}) {
    return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Streaming not yet supported.' } };
  }

  function estimateCost(model, promptTokens, completionTokens) {
    const modelConfig = MODELS[model] || MODELS['gemini-2.0-flash'];
    const promptCost = (promptTokens / 1000) * modelConfig.costPer1kPrompt;
    const completionCost = (completionTokens / 1000) * modelConfig.costPer1kCompletion;
    return promptCost + completionCost;
  }

  return {
    name: 'gemini',
    configured,
    chat,
    stream,
    estimateCost,
    models: Object.keys(MODELS),
  };
}

module.exports = { createGeminiProvider };
