const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getHomeState, normalizePlaceDetailParams } = require('../src/domain/coreShell');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

test('Home contains no fictional identity, city, progress, places, or people', () => {
  const home = read('src/screens/HomeScreen.js');
  for (const forbidden of ['Ahmed', 'Seattle', 'Week 3', 'STEPS_TOTAL', 'STEPS_DONE', 'const PLACES', 'const PEOPLE']) {
    assert(!home.includes(forbidden), `Home still contains ${forbidden}`);
  }
});

test('Home derives real named and nearby state from supplied application state', () => {
  const state = getHomeState({ auth: { mode: 'authenticated', user: { displayName: 'Real User' } }, userCity: 'Vienna', userLocation: { latitude: 1, longitude: 2 }, nearbyPlaces: [{ id: 'osm:1', name: 'Real Hospital', category: 'hospital' }] });
  assert.equal(state.displayName, 'Real User');
  assert.equal(state.locationLabel, 'Vienna');
  assert.equal(state.places.length, 1);
  assert.equal(state.places[0].id, 'osm:1');
});

test('Home no-location state cannot expose nearby records', () => {
  const state = getHomeState({ auth: { mode: 'guest' }, userCity: 'Typed City', userLocation: null, nearbyPlaces: [] });
  assert.equal(state.hasResolvedLocation, false);
  assert.equal(state.locationLabel, null);
  assert.equal(state.places.length, 0);
});

test('Home passes the canonical PlaceDetail item contract', () => {
  const home = read('src/screens/HomeScreen.js');
  assert(home.includes("navigation.navigate('PlaceDetail', { item: place })"));
  assert(!home.includes("navigation.navigate('PlaceDetail', { placeId"));
});

test('PlaceDetail contract accepts a valid item and rejects malformed params', () => {
  const place = { id: 'provider:1', name: 'Real Place' };
  assert.strictEqual(normalizePlaceDetailParams({ item: place }), place);
  for (const params of [undefined, null, {}, { item: null }, { item: [] }, { item: { id: '1' } }, { item: { name: 'Name' } }]) {
    assert.strictEqual(normalizePlaceDetailParams(params), null);
  }
  assert(read('src/screens/PlaceDetailScreen.js').includes('This place could not be opened safely'));
});

test('Guest success proceeds through the optional location explanation', () => {
  const welcome = read('src/screens/WelcomeScreen.js');
  assert(welcome.includes("navigation.replace('LocationPermission')"));
  const location = read('src/screens/LocationPermissionScreen.js');
  assert(location.includes('Continue without location'));
  assert(location.includes('Choose a city manually'));
  const ai = read('src/screens/AIScreen.js');
  assert(ai.includes('if (!isAuthenticated)'));
  assert(ai.includes('editable={isAuthenticated}'));
});

test('Discover renders only real nearby place results', () => {
  const discover = read('src/screens/DiscoverScreen.js');
  assert(!discover.includes('serviceService.getAll'));
  assert(!discover.includes('allServices.map'));
  assert(discover.includes('placeService.getNearby'));
});

test('Mock-backed primary surfaces are explicitly preview-labelled', () => {
  for (const file of ['CommunityScreen.js', 'JobsScreen.js', 'SafetyScreen.js', 'ServicesScreen.js']) {
    const source = read(`src/screens/${file}`);
    assert(source.includes('PreviewStateScreen'));
    assert(!source.includes('../data/providers/mock'));
  }
  const preview = read('src/components/PreviewStateScreen.js');
  assert(preview.includes('— Preview'));
});

test('Touched primary controls are accessible and RTL remains supported', () => {
  const home = read('src/screens/HomeScreen.js');
  assert((home.match(/accessibilityRole="button"/g) || []).length >= 4);
  assert(home.includes("i18n.language === 'ar'"));
  assert(home.includes("writingDirection: 'rtl'"));
  const location = read('src/screens/LocationPermissionScreen.js');
  assert(location.includes('accessibilityLabel="Continue without location"'));
});

test('No visible primary action is a haptics-only handler', () => {
  const home = read('src/screens/HomeScreen.js');
  assert(!home.includes('Haptics'));
  const community = read('src/screens/CommunityScreen.js');
  assert(!community.includes('impactAsync'));
});

console.log(`Milestone 7 Gate 1 truthful shell: ${passed} tests passed.`);
