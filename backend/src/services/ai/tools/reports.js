const { PERMISSIONS } = require('./permissions');

function createReportsTools(repositories) {
  return {
    createReport: {
      async execute(args, userId) {
        if (!userId) {
          return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } };
        }
        const { reportableType, reportableId, reason, description } = args || {};

        if (!reportableType) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'reportableType is required.' } };
        }
        if (!reportableId) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'reportableId is required.' } };
        }
        if (!reason) {
          return { data: null, error: { code: 'MISSING_ARGUMENT', message: 'reason is required.' } };
        }

        const validTypes = ['review', 'place', 'message', 'user'];
        if (!validTypes.includes(reportableType)) {
          return { data: null, error: { code: 'INVALID_ARGUMENT', message: `reportableType must be one of: ${validTypes.join(', ')}` } };
        }

        return repositories.reports.create({
          reportable_type: reportableType,
          reportable_id: reportableId,
          reason,
          description: description || null,
        }, userId);
      },
      permissions: [PERMISSIONS.WRITE_REPORTS],
      rateLimit: 5,
      description: 'Submit a report/flag for inappropriate content. Requires type, target ID, and reason.',
      parameters: {
        type: 'object',
        properties: {
          reportableType: {
            type: 'string',
            description: 'Type of content being reported: review, place, message, or user',
            enum: ['review', 'place', 'message', 'user'],
          },
          reportableId: { type: 'string', description: 'UUID of the content being reported' },
          reason: { type: 'string', description: 'Reason for the report' },
          description: { type: 'string', description: 'Optional detailed description' },
        },
        required: ['reportableType', 'reportableId', 'reason'],
      },
    },
  };
}

module.exports = { createReportsTools };
