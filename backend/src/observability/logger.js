const REDACTED = '[redacted]';
const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'password',
  'token',
  'apikey',
  'api_key',
  'service_role',
  'serviceRoleKey',
  'jwtSecret',
  'email',
  'phone',
  'location',
  'latitude',
  'longitude',
];

function shouldRedact(key) {
  const normalized = String(key).toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive.toLowerCase()));
}

function redact(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      shouldRedact(key) ? REDACTED : redact(entry),
    ])
  );
}

function log(level, message, meta = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redact(meta),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  request: (req, meta = {}) => log('info', 'HTTP request', {
    requestId: req.requestId,
    method: req.method,
    path: req.url,
    ...meta,
  }),
  redact,
};

module.exports = {
  logger,
  redact,
};
