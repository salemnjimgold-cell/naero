function createRetrievalService(embeddingsService, vectorStore) {
  const DEFAULT_MATCH_COUNT = 5;
  const DEFAULT_THRESHOLD = 0.7;

  async function retrieve(query, options = {}) {
    const startedAt = Date.now();
    const matchCount = options.matchCount || DEFAULT_MATCH_COUNT;
    const threshold = options.threshold ?? DEFAULT_THRESHOLD;
    const sourceType = options.sourceType || null;
    const metadata = options.metadata || null;
    const useHybrid = options.useHybrid !== undefined ? options.useHybrid : true;

    const embedResult = await embeddingsService.embed(query);
    if (embedResult.error) {
      return {
        data: null,
        error: embedResult.error,
        metrics: { latencyMs: Date.now() - startedAt, embedTokens: 0, retrievedCount: 0 },
      };
    }

    const { vector, tokens: embedTokens } = embedResult.data;

    let searchResult;
    if (useHybrid) {
      searchResult = await vectorStore.hybridSearch(vector, query, {
        matchCount,
        threshold,
        sourceType,
        vectorWeight: options.vectorWeight ?? 0.7,
        keywordWeight: options.keywordWeight ?? 0.3,
      });
    } else {
      searchResult = await vectorStore.semanticSearch(vector, {
        matchCount,
        threshold,
        sourceType,
        metadata,
      });
    }

    const latencyMs = Date.now() - startedAt;

    if (searchResult.error) {
      return {
        data: null,
        error: searchResult.error,
        metrics: { latencyMs, embedTokens, retrievedCount: 0 },
      };
    }

    const documents = (searchResult.data || []).map(d => ({
      id: d.id,
      sourceType: d.source_type,
      sourceId: d.source_id,
      content: d.content,
      metadata: d.metadata || {},
      tokenCount: d.token_count || 0,
      similarity: d.similarity || 0,
      createdAt: d.created_at,
    }));

    const confidence = documents.length > 0
      ? documents.reduce((sum, d) => sum + d.similarity, 0) / documents.length
      : 0;

    return {
      data: documents,
      error: null,
      metrics: {
        latencyMs,
        embedTokens,
        retrievedCount: documents.length,
        confidence: Math.round(confidence * 1000) / 1000,
        threshold,
        strategy: useHybrid ? 'hybrid' : 'semantic',
      },
      metadata: {
        query,
        matchCount,
        threshold,
        sourceType,
        useHybrid,
      },
    };
  }

  async function retrieveBySourceType(query, sourceType, options = {}) {
    return retrieve(query, { ...options, sourceType });
  }

  async function retrieveByMetadata(query, metadata, options = {}) {
    return retrieve(query, { ...options, metadata, useHybrid: false });
  }

  function formatDocuments(documents, maxChars = 4000) {
    if (!documents || documents.length === 0) return '';

    let result = '';
    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      const header = `[${d.sourceType}${d.metadata?.name ? `: ${d.metadata.name}` : ''}] (relevance: ${Math.round(d.similarity * 100)}%)`;
      const entry = `\n${i + 1}. ${header}\n   ${d.content}\n`;
      if (result.length + entry.length > maxChars) {
        result += `\n${i + 1}. ${header}\n   [Content truncated...]\n`;
        break;
      }
      result += entry;
    }
    return result;
  }

  return {
    retrieve,
    retrieveBySourceType,
    retrieveByMetadata,
    formatDocuments,
  };
}

module.exports = { createRetrievalService };
