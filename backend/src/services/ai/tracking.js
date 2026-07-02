function createTrackingService(env) {
  const DEFAULT_REPOSITORY = null;

  let repository = DEFAULT_REPOSITORY;

  function setRepository(repo) {
    repository = repo;
  }

  async function record(entry) {
    const record = {
      provider: entry.provider,
      model: entry.model,
      prompt_tokens: entry.promptTokens || 0,
      completion_tokens: entry.completionTokens || 0,
      total_tokens: (entry.promptTokens || 0) + (entry.completionTokens || 0),
      latency_ms: entry.latencyMs || 0,
      estimated_cost_usd: entry.estimatedCostUsd || 0,
      user_id: entry.userId || null,
      conversation_id: entry.conversationId || null,
      endpoint: entry.endpoint || 'chat',
      status: entry.status || 'success',
      error_message: entry.errorMessage || null,
      created_at: new Date().toISOString(),
    };

    if (repository && repository.createTrackingRecord) {
      try {
        return await repository.createTrackingRecord(record);
      } catch {
        // silently fail — tracking should never block the response
      }
    }

    return { data: record, error: null };
  }

  function calculateCost(provider, model, promptTokens, completionTokens) {
    const costTable = {
      openai: {
        'gpt-4o': { prompt: 0.0025, completion: 0.01 },
        'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
        'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
        'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
      },
      gemini: {
        'gemini-2.0-flash': { prompt: 0.0001, completion: 0.0004 },
        'gemini-2.0-pro': { prompt: 0.001, completion: 0.002 },
        'gemini-1.5-flash': { prompt: 0.000075, completion: 0.0003 },
        'gemini-1.5-pro': { prompt: 0.00125, completion: 0.005 },
      },
      claude: {
        'claude-3-5-sonnet-20241022': { prompt: 0.003, completion: 0.015 },
        'claude-3-5-haiku-20241022': { prompt: 0.0008, completion: 0.004 },
        'claude-3-opus-20240229': { prompt: 0.015, completion: 0.075 },
        'claude-3-sonnet-20240229': { prompt: 0.003, completion: 0.015 },
        'claude-3-haiku-20240307': { prompt: 0.00025, completion: 0.00125 },
      },
    };

    const providerCosts = costTable[provider];
    if (!providerCosts) return 0;

    const modelCosts = providerCosts[model];
    if (!modelCosts) return 0;

    const promptCost = (promptTokens / 1000) * modelCosts.prompt;
    const completionCost = (completionTokens / 1000) * modelCosts.completion;
    return Math.round((promptCost + completionCost) * 1e6) / 1e6;
  }

  return {
    setRepository,
    record,
    calculateCost,
  };
}

module.exports = { createTrackingService };
