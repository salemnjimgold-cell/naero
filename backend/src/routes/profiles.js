const { readJson } = require('../http/respond');

const ALLOWED_PROFILE_FIELDS = [
  'display_name',
  'home_country',
  'current_city',
  'preferred_language',
  'migration_reason',
  'arrival_date',
  'housing_status',
  'work_status',
  'ai_personalization_enabled',
  'location_personalization_enabled',
];

function sanitizeProfile(input = {}) {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => ALLOWED_PROFILE_FIELDS.includes(key))
  );
}

async function getProfile(user, profileStore) {
  return profileStore.getProfile(user.id);
}

async function updateProfile(req, user, profileStore) {
  const body = await readJson(req);
  return profileStore.upsertProfile(user.id, sanitizeProfile(body));
}

module.exports = {
  getProfile,
  updateProfile,
  sanitizeProfile,
  ALLOWED_PROFILE_FIELDS,
};
