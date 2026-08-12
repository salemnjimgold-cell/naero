function getCorsHeaders(req, allowedOrigins) {
  const origin = req.headers.origin;
  const headers = {
    'access-control-allow-methods': 'GET,PUT,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,x-request-id',
    'access-control-max-age': '86400',
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers.vary = 'origin';
  }
  return headers;
}

module.exports = {
  getCorsHeaders,
};
