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

  return {
    nodeEnv: mergedSource.NODE_ENV || 'development',
    serviceEnv: mergedSource.NAERO_SERVICE_ENV || mergedSource.NODE_ENV || 'development',
    port: Number.isFinite(port) ? port : 8787,
    corsOrigins: corsOrigins.length ? corsOrigins : DEFAULT_CORS_ORIGINS,
    publicBaseUrl: mergedSource.PUBLIC_BASE_URL || '',
    monitoring: {
      webhookUrl: mergedSource.MONITORING_WEBHOOK_URL || '',
      sampleRate: Number.isFinite(monitoringSampleRate) ? monitoringSampleRate : 1,
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
