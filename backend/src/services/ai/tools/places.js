const { PERMISSIONS } = require('./permissions');

function createPlacesTools(repositories) {
  return {
    searchPlaces: {
      async execute(args, userId) {
        const { city, category, query, limit, offset } = args || {};

        if (query) {
          const result = await repositories.places.search(query);
          return result;
        }

        if (city && category) {
          const result = await repositories.places.listByCityAndCategory(city, category);
          return result;
        }

        const result = await repositories.places.list({
          city: city || undefined,
          category: category || undefined,
          limit: Math.min(limit || 20, 100),
          offset: offset || 0,
        });
        return result;
      },
      permissions: [PERMISSIONS.READ_PLACES],
      rateLimit: 30,
      description: 'Search for places by city, category, or text query. Returns a list of matching places with details.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'Filter by city name (e.g. Budapest, Debrecen)' },
          category: { type: 'string', description: 'Filter by category (e.g. restaurant, hospital, school)' },
          query: { type: 'string', description: 'Free-text search query matching place names' },
          limit: { type: 'number', description: 'Maximum results to return (default 20, max 100)' },
          offset: { type: 'number', description: 'Number of results to skip for pagination' },
        },
      },
    },

    getPlaceDetails: {
      async execute(args, userId) {
        const { placeId } = args || {};
        if (!placeId) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'placeId is required.' } };
        }
        return repositories.places.getById(placeId);
      },
      permissions: [PERMISSIONS.READ_PLACES],
      rateLimit: 60,
      description: 'Get detailed information about a specific place by its ID. Returns full place record including address, contact, and metadata.',
      parameters: {
        type: 'object',
        properties: {
          placeId: {
            type: 'string',
            description: 'The UUID of the place to retrieve',
          },
        },
        required: ['placeId'],
      },
    },
  };
}

module.exports = { createPlacesTools };
