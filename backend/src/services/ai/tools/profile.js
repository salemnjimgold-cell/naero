const { PERMISSIONS, checkOwnership } = require('./permissions');

const ALLOWED_PROFILE_FIELDS = [
  'display_name', 'home_country', 'current_city', 'preferred_language',
  'migration_reason', 'arrival_date', 'housing_status', 'work_status',
  'ai_personalization_enabled', 'location_personalization_enabled',
];

const ALLOWED_PREFERENCES = ['locale', 'marketing_opt_in', 'safety_alerts_enabled'];

function sanitizeProfile(input = {}) {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => ALLOWED_PROFILE_FIELDS.includes(key))
  );
}

function sanitizePreferences(input = {}) {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => ALLOWED_PREFERENCES.includes(key))
  );
}

function createProfileTools(repositories, profileStore) {
  return {
    getUserProfile: {
      async execute(args, userId) {
        if (!userId) {
          return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } };
        }
        return profileStore.getProfile(userId);
      },
      permissions: [PERMISSIONS.READ_PROFILE],
      rateLimit: 30,
      description: 'Get the authenticated user\'s profile including display name, location, language, and preferences.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },

    updateUserPreferences: {
      async execute(args, userId) {
        if (!userId) {
          return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } };
        }

        if (!checkOwnership(PERMISSIONS.WRITE_PROFILE, args?.targetUserId || userId, userId)) {
          return { data: null, error: { code: 'FORBIDDEN', message: 'Cannot update another user\'s profile.' } };
        }

        const updates = sanitizeProfile(args || {});
        const prefs = sanitizePreferences(args || {});
        const hasProfileUpdates = Object.keys(updates).length > 0;
        const hasPrefUpdates = Object.keys(prefs).length > 0;

        if (!hasProfileUpdates && !hasPrefUpdates) {
          return { data: null, error: { code: 'INVALID_ARGUMENT', message: 'No valid fields to update. Allowed: ' + [...ALLOWED_PROFILE_FIELDS, ...ALLOWED_PREFERENCES].join(', ') } };
        }

        const results = {};
        if (hasProfileUpdates) {
          results.profile = await profileStore.upsertProfile(userId, updates);
        }

        return { data: results, error: null };
      },
      permissions: [PERMISSIONS.WRITE_PROFILE],
      rateLimit: 10,
      description: 'Update the authenticated user\'s profile fields or preferences. Only allowed fields can be modified.',
      parameters: {
        type: 'object',
        properties: {
          display_name: { type: 'string', description: 'Display name' },
          home_country: { type: 'string', description: 'Home country' },
          current_city: { type: 'string', description: 'Current city of residence' },
          preferred_language: { type: 'string', description: 'Preferred language code (e.g. en, hu)' },
          housing_status: { type: 'string', description: 'Housing status' },
          work_status: { type: 'string', description: 'Work/employment status' },
          migration_reason: { type: 'string', description: 'Reason for migration' },
          locale: { type: 'string', description: 'Locale (e.g. en-US, hu-HU)' },
          marketing_opt_in: { type: 'boolean', description: 'Marketing email opt-in' },
          safety_alerts_enabled: { type: 'boolean', description: 'Safety alerts opt-in' },
        },
      },
    },
  };
}

module.exports = { createProfileTools };
