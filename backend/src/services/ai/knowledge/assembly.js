function createContextAssembly(embeddingsService, retrievalService) {
  const MAX_RAG_CHARS = 6000;
  const MAX_HISTORY_CHARS = 3000;

  async function assemble(query, contextData, options = {}) {
    const ragEnabled = options.ragEnabled !== undefined ? options.ragEnabled : true;
    const retrievalOptions = {
      matchCount: options.matchCount || 5,
      threshold: options.threshold ?? 0.7,
      useHybrid: options.useHybrid !== undefined ? options.useHybrid : true,
      sourceType: options.sourceType || null,
    };

    let ragResult = null;
    let ragText = '';
    let ragMetrics = null;

    if (ragEnabled) {
      ragResult = await retrievalService.retrieve(query, retrievalOptions);
      if (ragResult.data && ragResult.data.length > 0) {
        ragText = retrievalService.formatDocuments(ragResult.data, MAX_RAG_CHARS);
        ragMetrics = ragResult.metrics;
      }
    }

    const contextParts = [];

    if (contextData.user) {
      contextParts.push(buildUserSection(contextData.user));
    }

    if (contextData.location) {
      contextParts.push(buildLocationSection(contextData.location));
    }

    if (ragText) {
      contextParts.push(`## Retrieved Knowledge\n${ragText}`);
    }

    if (contextData.savedPlaces && contextData.savedPlaces.length > 0) {
      contextParts.push(buildSavedPlacesSection(contextData.savedPlaces));
    }

    if (contextData.history && contextData.history.length > 0) {
      contextParts.push(buildHistorySection(contextData.history, MAX_HISTORY_CHARS));
    }

    return {
      context: contextParts.join('\n\n'),
      ragMetrics,
      hasRag: Boolean(ragText),
      documentCount: ragResult?.data?.length || 0,
      sections: contextParts.length,
      query,
    };
  }

  async function assembleForPrompt(query, contextData, options = {}) {
    const assembly = await assemble(query, contextData, options);

    let prompt = '';

    if (assembly.context) {
      prompt += `## User Information\n${assembly.context}`;
    }

    if (assembly.ragMetrics) {
      prompt += `\n\n[Note: Retrieved ${assembly.documentCount} relevant documents with ${Math.round(assembly.ragMetrics.confidence * 100)}% average relevance in ${assembly.ragMetrics.latencyMs}ms]`;
    }

    return prompt;
  }

  function buildUserSection(user) {
    const parts = ['### User Profile'];
    if (user.displayName) parts.push(`- Name: ${user.displayName}`);
    if (user.preferredLanguage) parts.push(`- Language: ${user.preferredLanguage}`);
    if (user.migrationReason) parts.push(`- Migration Reason: ${user.migrationReason}`);
    if (user.housingStatus) parts.push(`- Housing Status: ${user.housingStatus}`);
    if (user.workStatus) parts.push(`- Work Status: ${user.workStatus}`);
    if (user.arrivalDate) parts.push(`- Arrival: ${user.arrivalDate}`);
    return parts.join('\n');
  }

  function buildLocationSection(location) {
    const parts = ['### Location'];
    if (location.country) parts.push(`- Country: ${location.country}`);
    if (location.city) parts.push(`- City: ${location.city}`);
    if (location.preferredLanguage) parts.push(`- Language: ${location.preferredLanguage}`);
    return parts.join('\n');
  }

  function buildSavedPlacesSection(savedPlaces) {
    const parts = [`### Saved Places (${savedPlaces.length})`];
    for (const p of savedPlaces.slice(0, 10)) {
      parts.push(`- ${p.name} (${p.category})${p.city ? ` in ${p.city}` : ''}`);
    }
    if (savedPlaces.length > 10) {
      parts.push(`- ... and ${savedPlaces.length - 10} more`);
    }
    return parts.join('\n');
  }

  function buildHistorySection(history, maxChars) {
    const parts = ['### Conversation History'];
    let chars = 0;
    for (const h of history.slice(-10)) {
      const line = `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`;
      if (chars + line.length > maxChars) {
        parts.push('... [history truncated]');
        break;
      }
      parts.push(line);
      chars += line.length;
    }
    return parts.join('\n');
  }

  function getRetrievalMetrics(assembly) {
    if (!assembly.ragMetrics) return null;
    return {
      latencyMs: assembly.ragMetrics.latencyMs,
      retrievedCount: assembly.ragMetrics.retrievedCount,
      confidence: assembly.ragMetrics.confidence,
      embedTokens: assembly.ragMetrics.embedTokens,
      strategy: assembly.ragMetrics.strategy,
      threshold: assembly.ragMetrics.threshold,
    };
  }

  return {
    assemble,
    assembleForPrompt,
    getRetrievalMetrics,
  };
}

module.exports = { createContextAssembly };
