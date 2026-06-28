function getCorsHeaders(req, allowedOrigins) {
  const origin = req.headers.origin;
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,PUT,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-max-age': '86400',
  };
}

module.exports = {
  getCorsHeaders,
};
