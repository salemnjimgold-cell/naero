const fs = require('fs');
const path = require('path');

const DEFAULT_CORS_ORIGINS = ['http://localhost:8081', 'http://localhost:19006'];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const separator = line.indexOf('=');
      if (separator === -1) return acc;
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, '');
      if (key) acc[key] = value;
      return acc;
    }, {});
}

function loadLocalEnv(source = process.env) {
  const envFile = source.NAERO_ENV_FILE || path.resolve(__dirname, '../../.env');
  return { ...parseEnvFile(envFile), ...source };
}

function readEnv(source = process.env) {
  const mergedSource = loadLocalEnv(source);
  const port = Number.parseInt(mergedSource.PORT || '8787', 10);
  const corsOrigins = (mergedSource.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const monitoringSampleRate = Number.parseFloat(mergedSource.MONITORING_SAMPLE_RATE || '1');
  const rateLimitWindowMs = Number.parseInt(mergedSource.API_RATE_LIMIT_WINDOW_MS || '60000', 10);
  const rateLimitMax = Number.parseInt(mergedSource.API_RATE_LIMIT_MAX || '60', 10);
  const providerTimeoutMs = Number.parseInt(mergedSource.PROVIDER_TIMEOUT_MS || '8000', 10);
  const nearbyCacheTtlMs = Number.parseInt(mergedSource.NEARBY_CACHE_TTL_MS || '300000', 10);
  const nearbyCacheStaleMs = Number.parseInt(mergedSource.NEARBY_CACHE_STALE_MS || '1800000', 10);
  const nearbyCacheMaxEntries = Number.parseInt(mergedSource.NEARBY_CACHE_MAX_ENTRIES || '250', 10);
  const verifiedCacheTtlMs = Number.parseInt(mergedSource.VERIFIED_SERVICES_CACHE_TTL_MS || '21600000', 10);
  const allowedOrigins = (mergedSource.ALLOWED_ORIGINS || mergedSource.CORS_ORIGINS || '')
    .split(',').map((origin) => origin.trim()).filter(Boolean);

  return {
    nodeEnv: mergedSource.NODE_ENV || 'development',
    serviceEnv: mergedSource.NAERO_SERVICE_ENV || mergedSource.NODE_ENV || 'development',
    port: Number.isFinite(port) ? port : 8787,
    corsOrigins: allowedOrigins.length ? allowedOrigins : (corsOrigins.length ? corsOrigins : DEFAULT_CORS_ORIGINS),
    publicBaseUrl: mergedSource.PUBLIC_BASE_URL || '',
    monitoring: {
      webhookUrl: mergedSource.MONITORING_WEBHOOK_URL || '',
      sampleRate: Number.isFinite(monitoringSampleRate) ? monitoringSampleRate : 1,
    },
    gateway: {
      rateLimit: {
        windowMs: Number.isFinite(rateLimitWindowMs) && rateLimitWindowMs > 0 ? rateLimitWindowMs : 60000,
        max: Number.isFinite(rateLimitMax) && rateLimitMax > 0 ? rateLimitMax : 60,
      },
      providerTimeoutMs: Number.isFinite(providerTimeoutMs) && providerTimeoutMs > 0
        ? Math.min(providerTimeoutMs, 15000) : 8000,
      nearbyCache: {
        ttlMs: Number.isFinite(nearbyCacheTtlMs) && nearbyCacheTtlMs >= 0 ? nearbyCacheTtlMs : 300000,
        staleMs: Number.isFinite(nearbyCacheStaleMs) && nearbyCacheStaleMs >= 0 ? nearbyCacheStaleMs : 1800000,
        maxEntries: Number.isFinite(nearbyCacheMaxEntries) && nearbyCacheMaxEntries > 0
          ? Math.min(nearbyCacheMaxEntries, 2000) : 250,
      },
      verifiedCacheTtlMs: Number.isFinite(verifiedCacheTtlMs) && verifiedCacheTtlMs >= 0
        ? verifiedCacheTtlMs : 21600000,
      debugLocationLogging: mergedSource.DEBUG_LOCATION_LOGGING === 'true' && mergedSource.NODE_ENV !== 'production',
    },
    providers: {
      geoapifyApiKey: mergedSource.GEOAPIFY_API_KEY || '',
      googlePlacesApiKey: mergedSource.GOOGLE_PLACES_API_KEY || '',
      googleMapsApiKey: mergedSource.GOOGLE_MAPS_API_KEY || '',
      nominatimBaseUrl: mergedSource.NOMINATIM_BASE_URL || '',
      overpassApiUrl: mergedSource.OVERPASS_API_URL || '',
    },
    supabase: {
      url: mergedSource.SUPABASE_URL || '',
      anonKey: mergedSource.SUPABASE_ANON_KEY || '',
      serviceRoleKey: mergedSource.SUPABASE_SERVICE_ROLE_KEY || '',
      jwtSecret: mergedSource.SUPABASE_JWT_SECRET || mergedSource.JWT_SECRET || '',
      jwksUrl: mergedSource.SUPABASE_URL ? `${mergedSource.SUPABASE_URL}/auth/v1/.well-known/jwks.json` : '',
    },
    ai: {
      provider: mergedSource.AI_PROVIDER || 'openai',
      model: mergedSource.AI_MODEL || '',
      openaiApiKey: mergedSource.OPENAI_API_KEY || '',
      geminiApiKey: mergedSource.GEMINI_API_KEY || '',
      anthropicApiKey: mergedSource.ANTHROPIC_API_KEY || '',
    },
  };
}

function getPublicConfig(env = readEnv()) {
  return {
    service: 'naero-backend',
    version: '0.1.0',
    environment: env.serviceEnv,
    authProvider: 'supabase',
    profilesEnabled: true,
    aiGatewayEnabled: false,
    supabaseConfigured: Boolean(env.supabase.url && env.supabase.anonKey),
  };
}

function getConfigStatus(env = readEnv()) {
  const jwksConfigured = Boolean(env.supabase.jwksUrl);
  const legacySecretConfigured = Boolean(env.supabase.jwtSecret);
  return {
    supabasePublicConfigured: Boolean(env.supabase.url && env.supabase.anonKey),
    supabaseAdminConfigured: Boolean(env.supabase.url && env.supabase.serviceRoleKey),
    jwtVerificationConfigured: jwksConfigured || legacySecretConfigured,
    jwtVerificationMethod: jwksConfigured ? 'jwks' : (legacySecretConfigured ? 'hs256' : 'none'),
  };
}

const REQUIRED_PRODUCTION_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

function validateEnv(env = readEnv()) {
  const errors = [];
  const isProduction = env.nodeEnv === 'production' || env.serviceEnv === 'production';

  if (isProduction) {
    for (const key of REQUIRED_PRODUCTION_VARS) {
      const value = key === 'SUPABASE_URL' ? env.supabase.url
        : key === 'SUPABASE_ANON_KEY' ? env.supabase.anonKey
        : key === 'SUPABASE_SERVICE_ROLE_KEY' ? env.supabase.serviceRoleKey
        : null;
      if (!value) errors.push(`Missing required environment variable: ${key}`);
    }

    if (!env.publicBaseUrl) errors.push('Missing required environment variable: PUBLIC_BASE_URL');
    if (!env.corsOrigins.length) errors.push('Missing required environment variable: CORS_ORIGINS');

    if (!env.supabase.jwksUrl && !env.supabase.jwtSecret) {
      errors.push('Missing JWT verification configuration: set either SUPABASE_URL (for JWKS) or SUPABASE_JWT_SECRET (legacy)');
    }
  }

  return { valid: errors.length === 0, errors, isProduction };
}

module.exports = {
  parseEnvFile,
  readEnv,
  getPublicConfig,
  getConfigStatus,
  validateEnv,
};
