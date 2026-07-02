function createContextBuilder(env, repositories) {
  const MAX_HISTORY_MESSAGES = 20;
  const MAX_HISTORY_TOKENS = 4000;

  async function buildContext(userId, conversationId, topic) {
    const context = {
      user: null,
      location: null,
      history: [],
      savedPlaces: [],
      relevantData: null,
      topic: topic || null,
    };

    const [profileResult, settingsResult, historyResult, savedResult] = await Promise.all([
      fetchUserProfile(userId),
      fetchUserSettings(userId),
      fetchConversationHistory(conversationId),
      fetchSavedPlaces(userId),
    ]);

    context.user = profileResult || null;
    context.location = buildLocation(profileResult, settingsResult);
    context.history = historyResult || [];
    context.savedPlaces = savedResult || [];

    return context;
  }

  async function fetchUserProfile(userId) {
    try {
      if (!repositories?.profiles) return null;
      const result = await repositories.profiles.getById(userId);
      if (result.data && result.data.length > 0) {
        const p = result.data[0];
        return {
          displayName: p.display_name,
          homeCountry: p.home_country,
          currentCity: p.current_city,
          preferredLanguage: p.preferred_language,
          housingStatus: p.housing_status,
          workStatus: p.work_status,
          migrationReason: p.migration_reason,
          arrivalDate: p.arrival_date,
        };
      }
    } catch {
      // silently fail
    }
    return null;
  }

  async function fetchUserSettings(userId) {
    try {
      if (!repositories?.settings) return null;
      const result = await repositories.settings.getById(userId);
      if (result.data && result.data.length > 0) {
        return result.data[0];
      }
    } catch {
      // silently fail
    }
    return null;
  }

  async function fetchConversationHistory(conversationId) {
    if (!conversationId) return [];
    try {
      if (!repositories?.aiMessages) return [];
      const result = await repositories.aiMessages.listByConversation(conversationId, {
        limit: MAX_HISTORY_MESSAGES,
      });
      if (result.data) {
        return result.data.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content_redacted ? '[Content redacted]' : m.content,
          createdAt: m.created_at,
        }));
      }
    } catch {
      // silently fail
    }
    return [];
  }

  async function fetchSavedPlaces(userId) {
    try {
      if (!repositories?.savedPlaces) return [];
      const result = await repositories.savedPlaces.listByUser(userId);
      if (result.data) {
        return result.data.map(s => ({
          id: s.place_id,
          name: s.place?.name || 'Unknown',
          category: s.place?.category || 'Unknown',
          city: s.place?.city || '',
          listName: s.list_name,
        }));
      }
    } catch {
      // silently fail
    }
    return [];
  }

  function buildLocation(profile, settings) {
    if (!profile) return null;
    return {
      country: profile.homeCountry || null,
      city: profile.currentCity || null,
      preferredLanguage: profile.preferredLanguage || 'en',
    };
  }

  function formatContextForPrompt(context) {
    const parts = [];

    if (context.user) {
      parts.push(`User Profile:
- Name: ${context.user.displayName || 'Not set'}
- Home Country: ${context.user.homeCountry || 'Not set'}
- Current City: ${context.user.currentCity || 'Not set'}
- Language: ${context.user.preferredLanguage || 'en'}
- Migration Reason: ${context.user.migrationReason || 'Not specified'}
- Housing Status: ${context.user.housingStatus || 'Not specified'}
- Work Status: ${context.user.workStatus || 'Not specified'}`);
    }

    if (context.savedPlaces && context.savedPlaces.length > 0) {
      parts.push(`\nSaved Places (${context.savedPlaces.length}):
${context.savedPlaces.map(p => `- ${p.name} (${p.category})${p.city ? ` in ${p.city}` : ''}`).join('\n')}`);
    }

    if (context.topic) {
      parts.push(`\nCurrent Topic: ${context.topic}`);
    }

    return parts.join('\n');
  }

  function formatHistoryForPrompt(history) {
    if (!history || history.length === 0) return '';
    return history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  }

  return {
    buildContext,
    formatContextForPrompt,
    formatHistoryForPrompt,
  };
}

module.exports = { createContextBuilder };
