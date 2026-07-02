const { PERMISSIONS } = require('./permissions');

function createReviewsTools(repositories) {
  return {
    createReview: {
      async execute(args, userId) {
        if (!userId) {
          return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } };
        }
        const { placeId, rating, title, content, language } = args || {};

        if (!placeId) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'placeId is required.' } };
        }
        if (!rating || rating < 1 || rating > 5) {
          return { data: null, error: { code: 'INVALID_ARGUMENT', message: 'rating must be between 1 and 5.' } };
        }
        if (!content) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'content is required.' } };
        }

        return repositories.reviews.create({
          place_id: placeId,
          rating: Math.round(rating),
          title: title || null,
          content,
          language: language || 'en',
        }, userId);
      },
      permissions: [PERMISSIONS.WRITE_REVIEWS],
      rateLimit: 10,
      description: 'Create a review for a place. Requires a valid place ID, rating (1-5), and content text.',
      parameters: {
        type: 'object',
        properties: {
          placeId: { type: 'string', description: 'The UUID of the place being reviewed' },
          rating: { type: 'number', description: 'Rating from 1 to 5' },
          title: { type: 'string', description: 'Optional review title' },
          content: { type: 'string', description: 'Review content text' },
          language: { type: 'string', description: 'Language code (default: "en")' },
        },
        required: ['placeId', 'rating', 'content'],
      },
    },
  };
}

module.exports = { createReviewsTools };
