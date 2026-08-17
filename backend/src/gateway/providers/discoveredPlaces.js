const crypto = require('crypto');
const { GatewayError } = require('../errors');
const { getCategory } = require('../categories');
const { cacheDimensions } = require('../cache');
const { GEOAPIFY_LICENCE } = require('./geoapifyLicence');
const { COVERAGE_POLICY_VERSION, COVERAGE_SCHEMA_VERSION } = require('../coverageLifecycle');

const ALLOWED_PERSISTENCE_PROVIDERS = new Set(['geoapify']);
const DISCOVERED_TTL_MS = 7 * 24 * 60 * 60 * 1000;
function clean(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function validCandidate(item, params) {
  return Boolean(ALLOWED_PERSISTENCE_PROVIDERS.has(item?.provider) && clean(item.providerId) && clean(item.name)
    && Number.isFinite(item.latitude) && Math.abs(item.latitude) <= 90
    && Number.isFinite(item.longitude) && Math.abs(item.longitude) <= 180
    && clean(item.countryCode)?.toUpperCase() === clean(params.countryCode)?.toUpperCase()
    && Boolean(getCategory(params.category)) && clean(item.sourceAttribution) && !item.permanentlyClosed);
}
function persistenceRecord(item, params, now = Date.now()) {
  if (!validCandidate(item, params)) return null;
  const fetchedAt = item.fetchedAt || new Date(now).toISOString();
  const fingerprintInput = [item.provider, item.providerId, item.name, item.latitude, item.longitude,
    item.address || '', item.phone || '', item.website || ''].join('|');
  return {
    provider: item.provider, providerId: item.providerId, category: params.category, name: item.name,
    latitude: item.latitude, longitude: item.longitude, address: item.address || null, city: item.city || null,
    district: item.district || null, region: item.region || null, postalCode: item.postalCode || null,
    countryCode: item.countryCode.toUpperCase(), phone: item.phone || null, website: item.website || null,
    openingHours: item.openingHours || null, sourceAttribution: GEOAPIFY_LICENCE.attribution,
    licenceId: GEOAPIFY_LICENCE.licenceId, licenceUrl: GEOAPIFY_LICENCE.licenceUrl,
    osmCopyrightUrl: GEOAPIFY_LICENCE.osmCopyrightUrl, providerUrl: GEOAPIFY_LICENCE.providerUrl,
    termsUrl: GEOAPIFY_LICENCE.termsUrl, fetchedAt, expiresAt: new Date(now + DISCOVERED_TTL_MS).toISOString(),
    contentFingerprint: crypto.createHash('sha256').update(fingerprintInput).digest('hex'),
  };
}
function normalizeRow(row) {
  return {
    provider: row.provider, providerId: row.provider_id, name: row.name,
    latitude: Number(row.latitude), longitude: Number(row.longitude), address: row.address || null,
    city: row.city || null, district: row.district || null, region: row.region || null,
    postalCode: row.postal_code || null, countryCode: row.country_code || null, phone: row.phone || null,
    website: row.website || null, openingHours: row.opening_hours || null, fetchedAt: row.fetched_at || null,
    verified: false, permanentlyClosed: false, sourceAttribution: row.source_attribution || null,
    sourceLicence: { provider: row.provider, licenceId: row.licence_id, licenceUrl: row.licence_url,
      osmCopyrightUrl: row.osm_copyright_url, providerUrl: row.provider_url, termsUrl: row.terms_url,
      attribution: row.source_attribution },
    sourceRole: 'DISCOVERED',
  };
}
function createDiscoveredPlacesProvider(env, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const configured = env.gateway?.discoveredStoreEnabled === true
    && Boolean(env.supabase.url && env.supabase.serviceRoleKey);
  const persistenceEnabled = configured && env.gateway?.discoveredPersistenceEnabled === true
    && Boolean(env.supabase.serviceRoleKey);
  const coverageEnabled = configured && env.gateway?.coverageIntelligenceEnabled === true;
  const demandRefreshEnabled = coverageEnabled && env.gateway?.demandRefreshEnabled === true;
  function coverageDimensions(params) {
    const dimensions = cacheDimensions(params);
    if (!dimensions.radiusBucket) return null;
    return { cellId: dimensions.cell.id, category: dimensions.category,
      radiusBucket: dimensions.radiusBucket, countryCode: dimensions.countryCode,
      language: dimensions.language, sourcePolicyVersion: COVERAGE_POLICY_VERSION,
      schemaVersion: COVERAGE_SCHEMA_VERSION };
  }
  async function manageCoverage(operation, params, outcome = {}) {
    if (!coverageEnabled) return operation === 'read' ? { state: 'UNSEEN' } : { enabled: false };
    const dimensions = coverageDimensions(params);
    if (!dimensions) return operation === 'read' ? { state: 'UNSEEN' } : { enabled: false };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.gateway.providerTimeoutMs);
    try {
      const response = await fetchImpl(`${env.supabase.url}/rest/v1/rpc/manage_discovery_coverage`, {
        method: 'POST', headers: { apikey: env.supabase.serviceRoleKey,
          authorization: `Bearer ${env.supabase.serviceRoleKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ p_operation: operation, p_dimensions: dimensions, p_outcome: outcome }),
        signal: controller.signal,
      });
      if (!response.ok) throw new GatewayError('PERSISTENCE_FAILED', 'Coverage lifecycle operation failed.');
      const payload = await response.json();
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new GatewayError('PERSISTENCE_FAILED', 'Coverage lifecycle returned an invalid response.');
      }
      return payload;
    } catch (error) {
      if (error instanceof GatewayError) throw error;
      throw new GatewayError('PERSISTENCE_FAILED', 'Coverage lifecycle operation failed.');
    } finally { clearTimeout(timer); }
  }
  async function rpc(params, includeStale) {
    if (!configured) throw new GatewayError('PROVIDER_NOT_CONFIGURED', 'Persistent discovery is not configured.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.gateway.providerTimeoutMs);
    try {
      const response = await fetchImpl(`${env.supabase.url}/rest/v1/rpc/nearby_discovered_places`, {
        method: 'POST',
        headers: { apikey: env.supabase.serviceRoleKey,
          authorization: `Bearer ${env.supabase.serviceRoleKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ p_latitude: params.latitude, p_longitude: params.longitude,
          p_radius_meters: params.radius, p_category_key: params.category,
          p_filter_country_code: params.countryCode || null, p_result_limit: params.limit,
          p_include_stale: includeStale }), signal: controller.signal,
      });
      if (!response.ok) throw new GatewayError('PROVIDER_UNAVAILABLE', 'Persistent discovery is unavailable.');
      const data = await response.json();
      if (!Array.isArray(data)) throw new GatewayError('PROVIDER_UNAVAILABLE', 'Persistent discovery returned an invalid response.');
      return data.filter((row) => !includeStale || row.stale === true).map(normalizeRow)
        .filter((item) => item.providerId && item.name
          && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    } catch (error) {
      if (error instanceof GatewayError) throw error;
      if (error?.name === 'AbortError') throw new GatewayError('PROVIDER_TIMEOUT', 'Persistent discovery timed out.');
      throw new GatewayError('PROVIDER_UNAVAILABLE', 'Persistent discovery is unavailable.');
    } finally { clearTimeout(timer); }
  }
  return {
    name: 'discovered', sourceRole: 'DISCOVERED', configured, persistenceEnabled,
    coverageEnabled, demandRefreshEnabled,
    readCoverage: (params) => manageCoverage('read', params),
    claimRefresh: (params) => manageCoverage('claim', params),
    completeRefresh: (params, outcome) => manageCoverage('complete', params, outcome),
    failRefresh: (params, outcome) => manageCoverage('fail', params, outcome),
    searchNearby: (params) => rpc(params, false), searchStale: (params) => rpc(params, true),
    async persist(items, params) {
      if (!persistenceEnabled) return { enabled: false, persisted: 0 };
      const records = items.map((item) => persistenceRecord(item, params)).filter(Boolean);
      let persisted = 0;
      for (const record of records) {
        const response = await fetchImpl(`${env.supabase.url}/rest/v1/rpc/upsert_discovered_place`, {
          method: 'POST', headers: { apikey: env.supabase.serviceRoleKey,
            authorization: `Bearer ${env.supabase.serviceRoleKey}`, 'content-type': 'application/json' },
          body: JSON.stringify({ p_record: record }),
        });
        if (!response.ok) throw new GatewayError('PERSISTENCE_FAILED', 'Persistent discovery write failed.');
        persisted += 1;
      }
      if (records.length && !coverageEnabled) {
        const dimensions = cacheDimensions(params);
        if (dimensions.radiusBucket) {
          const expiresAt = records.reduce((earliest, record) => (
            record.expiresAt < earliest ? record.expiresAt : earliest), records[0].expiresAt);
          const response = await fetchImpl(`${env.supabase.url}/rest/v1/discovery_cells?on_conflict=cell_id,category_key,radius_bucket,country_code,language`, {
            method: 'POST', headers: { apikey: env.supabase.serviceRoleKey,
              authorization: `Bearer ${env.supabase.serviceRoleKey}`, 'content-type': 'application/json',
              prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify([{ cell_id: dimensions.cell.id, category_key: dimensions.category,
              radius_bucket: dimensions.radiusBucket, country_code: dimensions.countryCode,
              language: dimensions.language, last_successful_refresh: new Date().toISOString(),
              expires_at: expiresAt, result_count: records.length,
              source_policy_version: 'lde-3', schema_version: 'discovered-v1' }]),
          });
          if (!response.ok) throw new GatewayError('PERSISTENCE_FAILED', 'Persistent discovery coverage write failed.');
        }
      }
      return { enabled: true, persisted };
    },
  };
}
module.exports = { ALLOWED_PERSISTENCE_PROVIDERS, DISCOVERED_TTL_MS,
  createDiscoveredPlacesProvider, normalizeRow, persistenceRecord, validCandidate };
