const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getHomeState, normalizePlaceDetailParams } = require('../src/domain/coreShell');

const root = path.resolve(__dirname, '..');
const valid = { id: 'osm:1', name: 'Real Hospital', provider: 'osm', category: 'hospital', address: 'Main Street 1' };
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

function home(nearbyPlaces) {
  return getHomeState({
    auth: { mode: 'guest' },
    userCity: 'Vienna',
    userLocation: { latitude: 48.2, longitude: 16.3 },
    nearbyPlaces,
  }).places;
}

function rejected(name, item) {
  test(name, () => assert.deepStrictEqual(home([item]), []));
}

for (const [name, item] of [
  ['missing provider identity', { id: '1', name: 'Place' }],
  ['missing id', { name: 'Place', provider: 'osm' }],
  ['missing name', { id: '1', provider: 'osm' }],
  ['blank id', { ...valid, id: '   ' }],
  ['blank name', { ...valid, name: '   ' }],
  ['blank provider', { ...valid, provider: '   ' }],
  ['object-valued name', { ...valid, name: { hostile: true } }],
  ['array-valued name', { ...valid, name: ['hostile'] }],
]) rejected(name, item);

test('object-valued optional category is dropped', () => {
  const [item] = home([{ ...valid, category: { hostile: true } }]);
  assert(item);
  assert.strictEqual(item.category, undefined);
});

for (const field of ['id', 'name', 'provider']) {
  rejected(`inherited ${field}`, Object.assign(Object.create({ [field]: valid[field] }), Object.fromEntries(Object.entries(valid).filter(([key]) => key !== field))));
}

test('inherited optional fields on a hostile prototype reject the record', () => {
  const source = Object.assign(Object.create({ category: { hostile: true }, address: 'Inherited address' }), valid);
  delete source.category;
  delete source.address;
  assert.deepStrictEqual(home([source]), []);
});

rejected('Object.create hostile prototype', Object.assign(Object.create({ provider: 'osm' }), { id: '1', name: 'Place' }));

test('prototype pollution cannot enter normalized record', () => {
  Object.prototype.category = { polluted: true };
  try {
    const [item] = home([{ id: '1', name: 'Place', provider: 'osm' }]);
    assert(item);
    assert.strictEqual(item.category, undefined);
    assert.strictEqual(Object.getPrototypeOf(item), null);
  } finally {
    delete Object.prototype.category;
  }
});

for (const field of ['id', 'name', 'provider']) {
  const source = { ...valid };
  Object.defineProperty(source, field, { get() { throw new Error('hostile required getter'); } });
  rejected(`throwing required getter ${field}`, source);
}

test('throwing optional getter is dropped', () => {
  const source = { ...valid };
  Object.defineProperty(source, 'category', { get() { throw new Error('hostile optional getter'); } });
  const [item] = home([source]);
  assert(item);
  assert.strictEqual(item.category, undefined);
});

rejected('hostile Proxy get trap', new Proxy(valid, { get() { throw new Error('hostile get'); } }));
rejected('hostile Proxy ownership trap', new Proxy(valid, { getOwnPropertyDescriptor() { throw new Error('hostile descriptor'); } }));

test('null-prototype valid record is accepted and controlled', () => {
  const source = Object.assign(Object.create(null), valid);
  const [item] = home([source]);
  assert(item);
  assert.strictEqual(Object.getPrototypeOf(item), null);
  assert.notStrictEqual(item, source);
});

test('source mutation cannot alter Home card or navigation item', () => {
  const source = { ...valid, tags: ['emergency'] };
  const [item] = home([source]);
  source.name = { hostile: true };
  source.category = { hostile: true };
  source.tags[0] = { hostile: true };
  assert.strictEqual(item.name, 'Real Hospital');
  assert.strictEqual(item.category, 'hospital');
  assert.deepStrictEqual(item.tags, ['emergency']);
  assert.notStrictEqual(item.tags, source.tags);
});

test('malformed records are dropped before three-card limit', () => {
  const places = home([
    { id: 'bad:1', name: { hostile: true }, provider: 'osm' },
    { id: 'bad:2', name: 'Missing provider' },
    { ...valid, id: 'osm:a', name: 'Valid A' },
    { ...valid, id: 'osm:b', name: 'Valid B' },
    { ...valid, id: 'osm:c', name: 'Valid C' },
    { ...valid, id: 'osm:d', name: 'Valid D' },
  ]);
  assert.deepStrictEqual(places.map((place) => place.name), ['Valid A', 'Valid B', 'Valid C']);
});

test('every Home-admitted record satisfies actual PlaceDetail contract', () => {
  const places = home([
    valid,
    { ...valid, id: 'osm:2', name: 'Second', source: 'osm', provider: undefined },
    { ...valid, id: 'osm:3', name: 'Third', category: Symbol('hostile') },
  ]);
  assert.strictEqual(places.length, 3);
  for (const item of places) assert(normalizePlaceDetailParams({ item }));
});

test('Home-rendered nearby fields are controlled strings only', () => {
  const hostileValues = [{}, [], Symbol('x'), () => {}, new String('wrapped')];
  for (const value of hostileValues) {
    const [item] = home([{ ...valid, category: value, address: value }]);
    assert(item);
    assert.strictEqual(item.category, undefined);
    assert.strictEqual(item.address, undefined);
    assert.strictEqual(typeof item.name, 'string');
  }
});

test('Home renders and navigates with its normalized place model', () => {
  const source = fs.readFileSync(path.join(root, 'src/screens/HomeScreen.js'), 'utf8');
  assert(source.includes('view.places.map((place)'));
  assert(source.includes('>{place.name}</Text>'));
  assert(source.includes("navigation.navigate('PlaceDetail', { item: place })"));
  assert(!source.includes("navigation.navigate('PlaceDetail', { item: app.nearbyPlaces"));
});

console.log(`Milestone 7 hostile Home place contract: ${passed} tests passed.`);
