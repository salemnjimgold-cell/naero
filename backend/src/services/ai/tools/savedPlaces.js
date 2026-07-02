const { PERMISSIONS, checkOwnership } = require('./permissions');

function createSavedPlacesTools(repositories) {
  return {
    getSavedPlaces: {
      async execute(args, userId) {
        if (!userId) {
          return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } };
        }
        const { listName, limit } = args || {};
        return repositories.savedPlaces.listByUser(userId, {
          listName: listName || undefined,
          limit: Math.min(limit || 50, 100),
        });
      },
      permissions: [PERMISSIONS.READ_SAVED],
      rateLimit: 30,
      description: 'Get the authenticated user\'s saved/bookmarked places. Optionally filter by list name.',
      parameters: {
        type: 'object',
        properties: {
          listName: { type: 'string', description: 'Filter by list name (e.g. "default", "want-to-visit", "favorites")' },
          limit: { type: 'number', description: 'Maximum results (default 50, max 100)' },
        },
      },
    },

    savePlace: {
      async execute(args, userId) {
        if (!userId) {
          return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } };
        }
        const { placeId, listName, notes } = args || {};
        if (!placeId) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'placeId is required.' } };
        }

        if (!checkOwnership(PERMISSIONS.WRITE_SAVED, userId, userId)) {
          return { data: null, error: { code: 'FORBIDDEN', message: 'Cannot save places for another user.' } };
        }

        return repositories.savedPlaces.create(
          { place_id: placeId, list_name: listName || 'default', notes: notes || null },
          userId
        );
      },
      permissions: [PERMISSIONS.WRITE_SAVED],
      rateLimit: 20,
      description: 'Save/bookmark a place for the authenticated user. Requires a valid place ID.',
      parameters: {
        type: 'object',
        properties: {
          placeId: { type: 'string', description: 'The UUID of the place to save' },
          listName: { type: 'string', description: 'List name to save under (default: "default")' },
          notes: { type: 'string', description: 'Optional personal notes about this place' },
        },
        required: ['placeId'],
      },
    },
  };
}

module.exports = { createSavedPlacesTools };
