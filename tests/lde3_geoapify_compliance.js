/* global __dirname */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { persistenceRecord, normalizeRow } = require('../backend/src/gateway/providers/discoveredPlaces');
const { normalizeResult, deduplicate } = require('../backend/src/gateway/nearbyCore');
const { GEOAPIFY_LICENCE } = require('../backend/src/gateway/providers/geoapifyLicence');
const { PLACE_SOURCE_LINKS, attributionLinks } = require('../src/domain/placeAttribution');

const params = { latitude: 48.2, longitude: 16.3, radius: 1000, limit: 2, category: 'hospital', countryCode: 'AT', language: 'en' };
const raw = { provider: 'geoapify', providerId: 'place-1', name: 'Hospital', latitude: 48.2, longitude: 16.3,
  countryCode: 'AT', sourceAttribution: GEOAPIFY_LICENCE.attribution, sourceLicence: GEOAPIFY_LICENCE, verified: false };
const record = persistenceRecord(raw, params, 0);

assert.deepEqual({ provider: record.provider, licenceId: record.licenceId, licenceUrl: record.licenceUrl,
  osmCopyrightUrl: record.osmCopyrightUrl, providerUrl: record.providerUrl, termsUrl: record.termsUrl,
  sourceAttribution: record.sourceAttribution }, { provider: 'geoapify', licenceId: GEOAPIFY_LICENCE.licenceId,
  licenceUrl: GEOAPIFY_LICENCE.licenceUrl, osmCopyrightUrl: GEOAPIFY_LICENCE.osmCopyrightUrl,
  providerUrl: GEOAPIFY_LICENCE.providerUrl, termsUrl: GEOAPIFY_LICENCE.termsUrl,
  sourceAttribution: GEOAPIFY_LICENCE.attribution });

const retrieved = normalizeRow({ provider: 'geoapify', provider_id: 'place-1', name: 'Hospital', latitude: 48.2,
  longitude: 16.3, country_code: 'AT', source_attribution: GEOAPIFY_LICENCE.attribution,
  licence_id: GEOAPIFY_LICENCE.licenceId, licence_url: GEOAPIFY_LICENCE.licenceUrl,
  osm_copyright_url: GEOAPIFY_LICENCE.osmCopyrightUrl, provider_url: GEOAPIFY_LICENCE.providerUrl,
  terms_url: GEOAPIFY_LICENCE.termsUrl, fetched_at: '2026-08-14T00:00:00.000Z' });
assert.equal(retrieved.verified, false);
assert.deepEqual(retrieved.sourceLicence, GEOAPIFY_LICENCE);

const normalized = normalizeResult(retrieved, params);
assert.equal(normalized.verified, false);
assert.deepEqual(normalized.sourceLicence, GEOAPIFY_LICENCE);
const verified = normalizeResult({ ...raw, provider: 'naero', providerId: 'verified-1', verified: true,
  sourceRole: 'VERIFIED', sourceAttribution: 'Naero verified service', sourceLicence: null }, params);
const [merged] = deduplicate([normalized, verified]);
assert.equal(merged.provider, 'naero');
assert.equal(merged.verified, true);
assert.ok(merged.sourceAttribution.includes('OpenStreetMap'));
assert.ok(merged.sourceLicences.some((entry) => entry.licenceId === 'ODbL-1.0'));

assert.deepEqual(attributionLinks([GEOAPIFY_LICENCE.attribution]), [PLACE_SOURCE_LINKS.osm, PLACE_SOURCE_LINKS.geoapify]);
for (const link of Object.values(PLACE_SOURCE_LINKS)) assert.match(link.url, /^https:\/\//);

const migration = fs.readFileSync(path.join(__dirname, '../backend/db/migrations/006_persistent_discovered_places.sql'), 'utf8');
for (const value of Object.values(GEOAPIFY_LICENCE).filter((item) => typeof item === 'string')) assert.ok(migration.includes(value), value);
assert.match(migration, /force row level security/);
assert.match(migration, /revoke all on public\.discovered_places,public\.discovered_place_sources,public\.discovery_cells from public,anon,authenticated/);

const appFiles = ['src/domain/placeAttribution.js', 'src/components/PlaceAttributionLinks.js', 'src/screens/AboutScreen.js']
  .map((file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')).join('\n');
assert.doesNotMatch(appFiles, /GEOAPIFY_API_KEY|apiKey=/);
assert.match(appFiles, /accessibilityRole="link"/);
assert.match(appFiles, /rtlRow/);

console.log('LDE-3.1 Geoapify/ODbL compliance tests: 19/19 passed');
