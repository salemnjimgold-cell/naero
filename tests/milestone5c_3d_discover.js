const assert = require('assert');
const fs = require('fs');
const path = require('path');
const core = require('../src/domain/discoverCore');
const flags = require('../src/config/featureFlagsCore');
const strings = require('../src/i18n/compass3d');

const manual = core.resolveDiscoverContext({ onboardingContext: { countryCode: 'AT', country: 'Austria', municipality: 'Vienna', locationMode: 'manual', origin: 'user_selected' }, userLocation: { latitude: 1, longitude: 1 } });
assert.equal(manual.mode, 'manual'); assert.equal(manual.label, 'Vienna, Austria'); assert.equal(manual.showDistance, false); assert.deepEqual(manual.coordinates, core.CITY_ANCHORS['AT:Vienna']);
const device = core.resolveDiscoverContext({ onboardingContext: { countryCode: 'HU', country: 'Hungary', municipality: 'Győr', locationMode: 'device' }, locationState: { mode: 'device', latitude: 47.68, longitude: 17.65, address: { city: 'Győr', country: 'Hungary', countryCode: 'HU' } } });
assert.equal(device.mode, 'device'); assert.equal(device.showDistance, true); assert.equal(device.label, 'Győr, Hungary');
assert.equal(core.resolveDiscoverContext({}).mode, 'unknown');

assert.equal(core.categoryForSearch('nearest Apotheke'), 'pharmacy'); assert.equal(core.categoryForSearch('مستشفى'), 'hospital'); assert.equal(core.categoryForSearch('unknown', 'bank'), 'bank'); assert.equal(core.recognizedSearchCategory('Specific Place Name'), null);
assert.deepEqual(core.CATEGORY_GROUPS.map((g) => g.id), ['essential', 'services', 'support']);
assert(core.CATEGORY_GROUPS.every((g) => g.categories.length <= 4));

const raw = { id: 'osm:1', provider: 'osm', name: 'Real Pharmacy', category: 'pharmacy', latitude: 48.2, longitude: 16.3, distanceMeters: 640, phone: '+43 1 234', website: 'https://example.org', fetchedAt: '2026-08-11T00:00:00Z' };
const cityResult = core.normalizeDiscoverResult(raw, manual); assert.equal(cityResult.distanceMeters, null); assert.equal(cityResult.provenance.trustClass, 'external_provider'); assert.equal(cityResult.provenance.freshness, 'date_unknown');
const deviceResult = core.normalizeDiscoverResult(raw, device); assert.equal(deviceResult.distanceMeters, 640); assert(deviceResult.directionsUrl.startsWith('https://')); assert.equal(deviceResult.phone, '+43 1 234');
const missing = core.normalizeDiscoverResult({ id: 'x', provider: 'osm', name: 'Minimal place' }, device); assert.equal(missing.directionsUrl, null); assert.equal(missing.phone, null); assert.equal(missing.website, null);
const unsafe = core.normalizeDiscoverResult({ id: 'x', provider: 'google', name: 'Unsafe', latitude: 1, longitude: 1, website: 'javascript:alert(1)', phone: 'CALL ME' }, device); assert.equal(unsafe.website, null); assert.equal(unsafe.phone, null);
assert.equal(core.providerTrust({ provider: 'osm', verified: true }), 'external_provider'); assert.equal(core.providerTrust({ provider: 'naero', verified: true }), 'naero_verified'); assert.equal(core.providerTrust({ provider: 'naero', verified: false }), 'external_provider');

assert.equal(core.stateForFailure({ code: 'NETWORK_ERROR' }), 'offline'); assert.equal(core.stateForFailure({ code: 'PROVIDER_TIMEOUT' }), 'provider'); assert.equal(core.stateForFailure({ code: 'LOCATION_REQUIRED' }), 'location'); assert.equal(core.stateForFailure({ code: 'PROVIDER_TIMEOUT' }, true), 'cached');
assert.equal(flags.FLAG_DEFAULTS.newDiscover, false); assert.equal(flags.resolveFeatureFlags({ newDiscover: 'true' }).newDiscover, true);

function keys(value, prefix = '') { return Object.entries(value).flatMap(([key, child]) => child && typeof child === 'object' ? keys(child, `${prefix}${key}.`) : [`${prefix}${key}`]).sort(); }
for (const locale of ['ar', 'fr', 'hu']) assert.deepEqual(keys(strings[locale]), keys(strings.en), `${locale} key parity`);
assert(/[\u0600-\u06FF]/.test(JSON.stringify(strings.ar)), 'Arabic must contain Arabic script');

const navigator = fs.readFileSync(path.join(__dirname, '../src/navigation/AppNavigator.js'), 'utf8');
assert.match(navigator, /featureFlags\.newDiscover \? ContextualDiscoverScreen : DiscoverScreen/); assert.match(navigator, /DiscoverDetail/);
const screen = fs.readFileSync(path.join(__dirname, '../src/screens/ContextualDiscoverScreen.js'), 'utf8');
for (const token of ['FlatList', 'SourceSummary', 'StateView', 'locationState', 'distanceMeters']) assert.match(screen, new RegExp(token));
const detail = fs.readFileSync(path.join(__dirname, '../src/screens/ContextualDiscoverDetailScreen.js'), 'utf8');
for (const token of ['SourceSheet', 'directionsUrl', 'item.phone', 'item.website', 'discoverContext']) assert.match(detail, new RegExp(token.replace('.', '\\.')));
assert.doesNotMatch(screen, /recommended|popularity|open now/i);

console.log('Milestone 5C Part 3D Discover tests passed.');
