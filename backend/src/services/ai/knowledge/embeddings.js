function createEmbeddingsService(env, fetchImpl = fetch) {
  const provider = (env.ai?.embeddingsProvider || env.ai?.provider || 'openai').toLowerCase();
  const openaiKey = env.ai?.openaiApiKey || process.env.OPENAI_API_KEY || '';
  const geminiKey = env.ai?.geminiApiKey || process.env.GEMINI_API_KEY || '';

  const DIMENSIONS = {
    openai: 1536,
    gemini: 768,
  };

  const MODELS = {
    openai: 'text-embedding-3-small',
    gemini: 'text-embedding-004',
  };

  function getDimension() {
    return DIMENSIONS[provider] || 1536;
  }

  async function embed(text) {
    if (!text || text.trim().length === 0) {
      return { data: null, error: { code: 'EMPTY_TEXT', message: 'Cannot embed empty text.' } };
    }

    const trimmed = text.trim().slice(0, 8191);

    if (provider === 'openai') {
      return embedOpenAI(trimmed);
    }
    if (provider === 'gemini') {
      return embedGemini(trimmed);
    }
    return { data: null, error: { code: 'UNKNOWN_PROVIDER', message: `Unknown embedding provider: ${provider}` } };
  }

  async function embedBatch(texts) {
    if (!texts || texts.length === 0) {
      return { data: null, error: { code: 'EMPTY_BATCH', message: 'Cannot embed empty batch.' } };
    }

    const valid = texts.filter(t => t && t.trim().length > 0).map(t => t.trim().slice(0, 8191));
    if (valid.length === 0) {
      return { data: null, error: { code: 'EMPTY_BATCH', message: 'No valid texts to embed.' } };
    }

    if (provider === 'openai') {
      return embedBatchOpenAI(valid);
    }
    if (provider === 'gemini') {
      return embedBatchGemini(valid);
    }
    return { data: null, error: { code: 'UNKNOWN_PROVIDER', message: `Unknown embedding provider: ${provider}` } };
  }

  async function embedOpenAI(text) {
    if (!openaiKey) {
      return { data: null, error: { code: 'NOT_CONFIGURED', message: 'OpenAI API key not configured for embeddings.' } };
    }

    const response = await fetchImpl('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.openai,
        input: text,
        dimensions: DIMENSIONS.openai,
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      return { data: null, error: { code: 'EMBEDDING_ERROR', status: response.status, message: body.error?.message || response.statusText } };
    }

    return {
      data: {
        vector: body.data[0].embedding,
        dimension: DIMENSIONS.openai,
        model: body.model,
        tokens: body.usage?.total_tokens || 0,
      },
      error: null,
    };
  }

  async function embedBatchOpenAI(texts) {
    if (!openaiKey) {
      return { data: null, error: { code: 'NOT_CONFIGURED', message: 'OpenAI API key not configured for embeddings.' } };
    }

    const response = await fetchImpl('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.openai,
        input: texts,
        dimensions: DIMENSIONS.openai,
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      return { data: null, error: { code: 'EMBEDDING_ERROR', status: response.status, message: body.error?.message || response.statusText } };
    }

    const vectors = body.data.map(d => d.embedding);
    return {
      data: {
        vectors,
        count: vectors.length,
        dimension: DIMENSIONS.openai,
        model: body.model,
        tokens: body.usage?.total_tokens || 0,
      },
      error: null,
    };
  }

  async function embedGemini(text) {
    if (!geminiKey) {
      return { data: null, error: { code: 'NOT_CONFIGURED', message: 'Gemini API key not configured for embeddings.' } };
    }

    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:embedContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${MODELS.gemini}`,
          content: { parts: [{ text }] },
        }),
      }
    );

    const body = await response.json();
    if (!response.ok) {
      return { data: null, error: { code: 'EMBEDDING_ERROR', status: response.status, message: body.error?.message || response.statusText } };
    }

    return {
      data: {
        vector: body.embedding?.values || [],
        dimension: DIMENSIONS.gemini,
        model: MODELS.gemini,
        tokens: 0,
      },
      error: null,
    };
  }

  async function embedBatchGemini(texts) {
    if (!geminiKey) {
      return { data: null, error: { code: 'NOT_CONFIGURED', message: 'Gemini API key not configured for embeddings.' } };
    }

    const results = [];
    let total = 0;
    for (const text of texts) {
      const result = await embedGemini(text);
      if (result.error) return result;
      results.push(result.data.vector);
      total += result.data.tokens || 0;
    }

    return {
      data: { vectors: results, count: results.length, dimension: DIMENSIONS.gemini, model: MODELS.gemini, tokens: total },
      error: null,
    };
  }

  function estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  function chunkText(text, maxTokens = 500) {
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const chunks = [];
    let current = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = estimateTokens(sentence);
      if (currentTokens + sentenceTokens > maxTokens && current) {
        chunks.push(current.trim());
        current = sentence;
        currentTokens = sentenceTokens;
      } else {
        current += (current ? ' ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }
    return chunks;
  }

  return {
    embed,
    embedBatch,
    getDimension,
    estimateTokens,
    chunkText,
    provider,
    dimension: DIMENSIONS[provider],
    configured: provider === 'openai' ? Boolean(openaiKey) : Boolean(geminiKey),
  };
}

module.exports = { createEmbeddingsService };
