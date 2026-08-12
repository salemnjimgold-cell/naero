function metaFor(req, extra = {}) {
  return {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

function success(req, data, options = {}) {
  return {
    status: options.status || 200,
    body: {
      success: true,
      data,
      meta: metaFor(req, {
        source: options.source || 'naero',
        cached: Boolean(options.cached),
        ...(options.extraMeta || {}),
      }),
    },
  };
}

function failure(req, error) {
  return {
    status: error.statusCode || 500,
    body: {
      success: false,
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Unexpected server error.' },
      meta: metaFor(req),
    },
  };
}

module.exports = { success, failure };
