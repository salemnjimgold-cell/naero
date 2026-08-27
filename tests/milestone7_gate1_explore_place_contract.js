const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { normalizePlaceCollection, normalizePlaceDetailParams } = require('../src/domain/coreShell');

const root = path.resolve(__dirname, '..');
const valid = { id: 'osm:1', name: 'Real Hospital', provider: 'osm', category: 'hospital', description: 'Emergency care', latitude: 48.2, longitude: 16.3 };
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

function rejected(name, item) {
  test(name, () => assert.deepStrictEqual(normalizePlaceCollection([item]), []));
}

test('valid canonical place', () => assert(normalizePlaceCollection([valid])[0]));
test('null-prototype valid place', () => {
  const source = Object.assign(Object.create(null), valid);
  const [item] = normalizePlaceCollection([source]);
  assert(item);
  assert.strictEqual(Object.getPrototypeOf(item), null);
});

for (const [name, item] of [
  ['missing id', { name: 'Place', provider: 'osm' }],
  ['blank id', { ...valid, id: ' ' }],
  ['missing name', { id: '1', provider: 'osm' }],
  ['blank name', { ...valid, name: ' ' }],
  ['object-valued name', { ...valid, name: {} }],
  ['array-valued name', { ...valid, name: ['bad'] }],
  ['Symbol-valued name', { ...valid, name: Symbol('bad') }],
  ['function-valued name', { ...valid, name() {} }],
  ['missing provider', { id: '1', name: 'Place' }],
  ['blank provider', { ...valid, provider: ' ' }],
]) rejected(name, item);

for (const field of ['id', 'name', 'provider']) {
  rejected(`inherited ${field}`, Object.assign(Object.create({ [field]: valid[field] }), Object.fromEntries(Object.entries(valid).filter(([key]) => key !== field))));
}
rejected('inherited optional field', Object.assign(Object.create({ category: 'hospital' }), { id: '1', name: 'Place', provider: 'osm' }));
rejected('Object.create hostile identity', Object.assign(Object.create({ provider: 'osm' }), { id: '1', name: 'Place' }));

test('prototype pollution cannot supply UI fields', () => {
  Object.prototype.category = { polluted: true };
  try {
    const [item] = normalizePlaceCollection([{ id: '1', name: 'Place', provider: 'osm' }]);
    assert(item);
    assert.strictEqual(item.category, undefined);
  } finally {
    delete Object.prototype.category;
  }
});

for (const [name, value] of [['object-valued category', {}], ['array-valued category', ['bad']]]) {
  test(name, () => {
    const [item] = normalizePlaceCollection([{ ...valid, category: value }]);
    assert(item);
    assert.strictEqual(item.category, undefined);
  });
}

for (const field of ['id', 'name', 'provider']) {
  const source = { ...valid };
  Object.defineProperty(source, field, { get() { throw new Error('hostile getter'); } });
  rejected(`throwing ${field} getter`, source);
}

test('throwing optional getter is omitted', () => {
  const source = { ...valid };
  Object.defineProperty(source, 'description', { get() { throw new Error('hostile getter'); } });
  const [item] = normalizePlaceCollection([source]);
  assert(item);
  assert.strictEqual(item.description, undefined);
});

rejected('hostile Proxy get trap', new Proxy(valid, { get() { throw new Error('hostile proxy'); } }));
rejected('hostile Proxy ownership trap', new Proxy(valid, { getOwnPropertyDescriptor() { throw new Error('hostile proxy'); } }));

test('source mutation after normalization cannot alter model', () => {
  const source = { ...valid, tags: ['emergency'] };
  const [item] = normalizePlaceCollection([source]);
  source.name = {};
  source.category = {};
  source.provider = 'hostile';
  source.tags[0] = {};
  assert.strictEqual(item.name, 'Real Hospital');
  assert.strictEqual(item.category, 'hospital');
  assert.strictEqual(item.provider, 'osm');
  assert.deepStrictEqual(item.tags, ['emergency']);
});

test('source mutation after Explore model creation cannot alter navigation', () => {
  const source = { ...valid };
  const [item] = normalizePlaceCollection([source]);
  source.id = 'changed';
  source.name = {};
  assert.strictEqual(item.id, 'osm:1');
  assert.strictEqual(item.name, 'Real Hospital');
  assert(normalizePlaceDetailParams({ item }));
});

test('malformed records mixed with valid records are dropped', () => {
  const items = normalizePlaceCollection([{ id: 'bad', name: {} }, valid, { ...valid, id: 'osm:2' }]);
  assert.deepStrictEqual(items.map((item) => item.id), ['osm:1', 'osm:2']);
});

test('search operates on normalized optional strings', () => {
  const items = normalizePlaceCollection([{ ...valid, description: {}, tags: [{}, 'emergency'] }]);
  assert.doesNotThrow(() => items.filter((item) => item.name.toLowerCase().includes('real') || (item.tags || []).some((tag) => tag.includes('real')) || (item.description || '').toLowerCase().includes('real')));
});

test('category filtering operates on normalized strings', () => {
  const items = normalizePlaceCollection([{ ...valid, id: 'bad', category: {} }, valid]);
  assert.doesNotThrow(() => items.filter((item) => item.category === 'hospital'));
  assert.deepStrictEqual(items.filter((item) => item.category === 'hospital').map((item) => item.id), ['osm:1']);
});

test('sorting operates on normalized finite coordinates', () => {
  const items = normalizePlaceCollection([{ ...valid, id: 'bad', latitude: {}, longitude: {} }, valid]);
  assert.doesNotThrow(() => [...items].sort((a, b) => (a.latitude || 0) - (b.latitude || 0)));
  assert.strictEqual(items[0].latitude, undefined);
});

test('malformed accessibility value cannot enter a label', () => {
  const [item] = normalizePlaceCollection([{ ...valid, category: {} }]);
  const label = `${item.name}, ${item.category || 'place'}`;
  assert(!label.includes('[object Object]'));
  assert.strictEqual(typeof item.name, 'string');
});

test('navigation payload identity satisfies PlaceDetail', () => {
  const [item] = normalizePlaceCollection([valid]);
  assert(normalizePlaceDetailParams({ item }));
  assert.strictEqual(item.id, valid.id);
  assert.strictEqual(item.provider, valid.provider);
});

test('all six exact forensic reproductions are fixed', () => {
  const inherited = Object.assign(Object.create({ provider: 'osm' }), { id: 'i', name: 'Inherited' });
  const getter = { id: 'g', provider: 'osm' };
  Object.defineProperty(getter, 'name', { get() { throw new Error('hostile'); } });
  const proxy = new Proxy(valid, { get() { throw new Error('hostile'); } });
  for (const item of [{ id: 'm', name: 'Missing' }, { ...valid, name: {} }, inherited, getter, proxy]) {
    assert.deepStrictEqual(normalizePlaceCollection([item]), []);
  }
  const source = { ...valid };
  const [item] = normalizePlaceCollection([source]);
  source.name = {};
  assert.strictEqual(item.name, valid.name);
});

test('production Explore normalizes before filter, sort, limit, render, and navigation', () => {
  const source = fs.readFileSync(path.join(root, 'src/screens/ExploreScreen.js'), 'utf8');
  const normalizeAt = source.indexOf('normalizePlaceCollection(allPlaces)');
  assert(normalizeAt > 0 && normalizeAt < source.indexOf('const filteredPlaces'));
  assert(normalizeAt < source.indexOf('const nearbyPlaces'));
  assert(source.includes('let result = canonicalPlaces'));
  assert(source.includes('const sorted = [...canonicalPlaces]'));
  assert(source.indexOf('normalizePlaceCollection(allPlaces)') < source.indexOf('return sorted.slice(0, 4)'));
  assert(source.includes("navigation.navigate('PlaceDetail', { item })"));
});

console.log(`Milestone 7 hostile Explore place contract: ${passed} tests passed.`);
