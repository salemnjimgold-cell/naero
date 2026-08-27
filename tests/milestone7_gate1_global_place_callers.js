const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getHomeState, normalizePlaceCollection, normalizePlaceDetailParams } = require('../src/domain/coreShell');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const valid = { id: 'osm:1', name: 'Real Hospital', provider: 'osm', category: 'hospital' };
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

test('production PlaceDetail caller set is exactly Home Discover Explore', () => {
  const screens = fs.readdirSync(path.join(root, 'src/screens')).filter((file) => file.endsWith('.js'));
  const callers = screens.filter((file) => /navigate\(\s*['"]PlaceDetail['"]/.test(read(`src/screens/${file}`))).sort();
  assert.deepStrictEqual(callers, ['DiscoverScreen.js', 'ExploreScreen.js', 'HomeScreen.js']);
});

test('Home actionable records satisfy PlaceDetail', () => {
  const places = getHomeState({ auth: { mode: 'guest' }, userLocation: { latitude: 1, longitude: 1 }, nearbyPlaces: [valid] }).places;
  assert.strictEqual(places.length, 1);
  assert(places.every((item) => normalizePlaceDetailParams({ item })));
});

for (const caller of ['Discover', 'Explore']) {
  test(`${caller} actionable records satisfy PlaceDetail`, () => {
    const places = normalizePlaceCollection([valid, { ...valid, id: 'bad', name: {} }]);
    assert.strictEqual(places.length, 1);
    assert(places.every((item) => normalizePlaceDetailParams({ item })));
  });
}

test('all callers consume the shared collection boundary before navigation', () => {
  const home = read('src/domain/coreShell.js');
  const discover = read('src/screens/DiscoverScreen.js');
  const explore = read('src/screens/ExploreScreen.js');
  assert(home.includes('normalizePlaceCollection(nearbyPlaces).slice(0, 3)'));
  assert(discover.includes('normalizePlaceCollection(allPlaces)'));
  assert(explore.includes('normalizePlaceCollection(allPlaces)'));
  for (const source of [discover, explore]) assert(source.includes("navigation.navigate('PlaceDetail', { item })"));
});

console.log(`Milestone 7 global place callers: ${passed} tests passed.`);
