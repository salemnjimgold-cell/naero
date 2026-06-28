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
      jwtSecret: mergedSource.SUPABASE_JWT_SECRET || '',
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
  return {
    supabasePublicConfigured: Boolean(env.supabase.url && env.supabase.anonKey),
    supabaseAdminConfigured: Boolean(env.supabase.url && env.supabase.serviceRoleKey),
    jwtVerificationConfigured: Boolean(env.supabase.jwtSecret),
  };
}

module.exports = {
  parseEnvFile,
  readEnv,
  getPublicConfig,
  getConfigStatus,
};
