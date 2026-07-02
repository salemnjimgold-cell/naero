const { createPlacesRepository } = require('./placesRepository');
const { createReviewsRepository } = require('./reviewsRepository');
const { createReportsRepository } = require('./reportsRepository');
const { createAiConversationsRepository } = require('./aiConversationsRepository');
const { createAiMessagesRepository } = require('./aiMessagesRepository');
const { createSavedPlacesRepository } = require('./savedPlacesRepository');
const { createNotificationsRepository } = require('./notificationsRepository');
const { createActivityLogsRepository } = require('./activityLogsRepository');
const { createModerationRepository } = require('./moderationRepository');

function createRepositories(env, fetchImpl) {
  const baseUrl = env.supabase?.url;
  const serviceRoleKey = env.supabase?.serviceRoleKey;

  return {
    places: createPlacesRepository(baseUrl, serviceRoleKey, fetchImpl),
    reviews: createReviewsRepository(baseUrl, serviceRoleKey, fetchImpl),
    reports: createReportsRepository(baseUrl, serviceRoleKey, fetchImpl),
    aiConversations: createAiConversationsRepository(baseUrl, serviceRoleKey, fetchImpl),
    aiMessages: createAiMessagesRepository(baseUrl, serviceRoleKey, fetchImpl),
    savedPlaces: createSavedPlacesRepository(baseUrl, serviceRoleKey, fetchImpl),
    notifications: createNotificationsRepository(baseUrl, serviceRoleKey, fetchImpl),
    activityLogs: createActivityLogsRepository(baseUrl, serviceRoleKey, fetchImpl),
    moderation: createModerationRepository(baseUrl, serviceRoleKey, fetchImpl),
  };
}

module.exports = { createRepositories };
