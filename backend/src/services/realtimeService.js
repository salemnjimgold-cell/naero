function createRealtimeService(env, repositories, fetchImpl = fetch) {
  const { url, serviceRoleKey } = env.supabase;
  const configured = Boolean(url && serviceRoleKey);

  const CHANNELS = {
    NOTIFICATIONS: 'notifications',
    REVIEWS: 'reviews',
    SAVED_PLACES: 'saved-places',
    AI_CONVERSATIONS: 'ai-conversations',
  };

  async function notifyUser(userId, notification, channel = CHANNELS.NOTIFICATIONS) {
    if (!configured) return { data: null, error: { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase admin access is not configured.' } };

    const payload = {
      type: 'broadcast',
      event: 'notification',
      payload: { userId, notification, channel },
    };

    const response = await fetchImpl(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return { data: null, error: { code: 'REALTIME_ERROR', status: response.status, message: text || response.statusText } };
    }

    return { data: { sent: true }, error: null };
  }

  async function notifyReviewChange(placeId, review, eventType = 'updated') {
    return notifyUser(null, {
      type: 'review_change',
      event: eventType,
      placeId,
      reviewId: review.id,
      rating: review.rating,
    }, CHANNELS.REVIEWS);
  }

  async function notifySavedPlaceChange(userId, placeId, eventType = 'saved') {
    return notifyUser(userId, {
      type: 'saved_place_change',
      event: eventType,
      placeId,
    }, CHANNELS.SAVED_PLACES);
  }

  async function notifyAiConversationChange(userId, conversationId, eventType = 'new_message') {
    return notifyUser(userId, {
      type: 'ai_conversation_change',
      event: eventType,
      conversationId,
    }, CHANNELS.AI_CONVERSATIONS);
  }

  return {
    configured,
    CHANNELS,
    notifyUser,
    notifyReviewChange,
    notifySavedPlaceChange,
    notifyAiConversationChange,
  };
}

module.exports = { createRealtimeService };
