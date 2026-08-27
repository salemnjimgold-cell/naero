const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { normalizePlaceCollection, normalizePlaceDetailParams } = require('../src/domain/coreShell');
const { categoriesMatch } = require('../src/services/nearbyClientCore');

const root = path.resolve(__dirname, '..');
const valid = { id: 'osm:1', name: 'Real Hospital', provider: 'osm', category: 'hospital', description: 'Emergency care', tags: ['emergency'] };
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

function rejected(name, item) {
  test(name, () => assert.deepStrictEqual(normalizePlaceCollection([item]), []));
}

for (const [name, item] of [
  ['missing provider', { id: '1', name: 'Place', category: 'hospital' }],
  ['missing id', { name: 'Place', provider: 'osm' }],
  ['missing name', { id: '1', provider: 'osm' }],
  ['blank id', { ...valid, id: ' ' }],
  ['blank name', { ...valid, name: ' ' }],
  ['blank provider', { ...valid, provider: ' ' }],
  ['object name', { ...valid, name: {} }],
  ['array name', { ...valid, name: ['bad'] }],
  ['Symbol name', { ...valid, name: Symbol('bad') }],
  ['function name', { ...valid, name() {} }],
]) rejected(name, item);

for (const [name, value] of [['object category', {}], ['array category', ['bad']]]) {
  test(name, () => {
    const [item] = normalizePlaceCollection([{ ...valid, category: value }]);
    assert(item);
    assert.strictEqual(item.category, undefined);
  });
}

for (const field of ['id', 'name', 'provider']) {
  rejected(`inherited ${field}`, Object.assign(Object.create({ [field]: valid[field] }), Object.fromEntries(Object.entries(valid).filter(([key]) => key !== field))));
}

rejected('inherited optional display fields', Object.assign(Object.create({ description: 'Inherited' }), { id: '1', name: 'Place', provider: 'osm' }));
rejected('Object.create hostile prototype', Object.assign(Object.create({ provider: 'osm' }), { id: '1', name: 'Place' }));

test('prototype-polluted object cannot inherit display data', () => {
  Object.prototype.description = { polluted: true };
  try {
    const [item] = normalizePlaceCollection([{ id: '1', name: 'Place', provider: 'osm' }]);
    assert(item);
    assert.strictEqual(item.description, undefined);
    assert.strictEqual(Object.getPrototypeOf(item), null);
  } finally {
    delete Object.prototype.description;
  }
});

for (const field of ['id', 'name', 'provider']) {
  const source = { ...valid };
  Object.defineProperty(source, field, { get() { throw new Error('hostile required getter'); } });
  rejected(`throwing ${field} getter`, source);
}

test('throwing optional getter is omitted', () => {
  const source = { ...valid };
  Object.defineProperty(source, 'description', { get() { throw new Error('hostile optional getter'); } });
  const [item] = normalizePlaceCollection([source]);
  assert(item);
  assert.strictEqual(item.description, undefined);
});

rejected('hostile Proxy get trap', new Proxy(valid, { get() { throw new Error('hostile get'); } }));
rejected('hostile Proxy ownership trap', new Proxy(valid, { getOwnPropertyDescriptor() { throw new Error('hostile descriptor'); } }));

test('null-prototype valid record is accepted', () => {
  const source = Object.assign(Object.create(null), valid);
  const [item] = normalizePlaceCollection([source]);
  assert(item);
  assert.strictEqual(Object.getPrototypeOf(item), null);
  assert.notStrictEqual(item, source);
});

test('source mutation cannot alter Discover model, filtering, or navigation identity', () => {
  const source = { ...valid, tags: ['emergency'] };
  const [item] = normalizePlaceCollection([source]);
  source.name = { hostile: true };
  source.category = 'pharmacy';
  source.provider = 'hostile';
  source.tags[0] = { hostile: true };
  assert.strictEqual(item.name, 'Real Hospital');
  assert.strictEqual(item.category, 'hospital');
  assert.strictEqual(item.provider, 'osm');
  assert.deepStrictEqual(item.tags, ['emergency']);
  assert(categoriesMatch(item.category, 'hospitals'));
  assert(normalizePlaceDetailParams({ item }));
});

test('malformed records mixed with valid records are dropped', () => {
  const items = normalizePlaceCollection([{ id: 'bad', name: {} }, valid, { ...valid, id: 'osm:2', name: 'Second' }]);
  assert.deepStrictEqual(items.map((item) => item.id), ['osm:1', 'osm:2']);
});

test('category filtering consumes only canonical strings', () => {
  const items = normalizePlaceCollection([{ ...valid, id: 'bad', category: {} }, valid]);
  assert.doesNotThrow(() => items.filter((item) => categoriesMatch(item.category, 'hospitals')));
  assert.deepStrictEqual(items.filter((item) => categoriesMatch(item.category, 'hospitals')).map((item) => item.id), ['osm:1']);
});

test('search filtering consumes only canonical strings and string tags', () => {
  const items = normalizePlaceCollection([{ ...valid, id: 'safe', description: {}, tags: [{}, 'emergency'] }]);
  assert.doesNotThrow(() => items.filter((item) => item.name.toLowerCase().includes('real') || (item.tags || []).some((tag) => tag.toLowerCase().includes('real')) || (item.description || '').toLowerCase().includes('real')));
  assert.deepStrictEqual(items[0].tags, ['emergency']);
  assert.strictEqual(items[0].description, undefined);
});

test('accessibility inputs are strings and cannot stringify hostile values', () => {
  const [item] = normalizePlaceCollection([{ ...valid, category: { hostile: true } }]);
  assert.strictEqual(typeof item.name, 'string');
  assert.strictEqual(item.category, undefined);
  const label = `${item.name}, ${item.category || 'place'}`;
  assert(!label.includes('[object Object]'));
});

test('every Discover-admitted record satisfies actual PlaceDetail contract', () => {
  const items = normalizePlaceCollection([valid, { ...valid, id: 'osm:2', provider: undefined, source: 'osm' }]);
  assert.strictEqual(items.length, 2);
  for (const item of items) assert(normalizePlaceDetailParams({ item }));
});

test('exact missing-provider forensic reproduction is fixed', () => {
  const raw = { id: 'x', name: 'Missing Provider', category: 'hospital' };
  assert(categoriesMatch(raw.category, 'hospitals'));
  assert.deepStrictEqual(normalizePlaceCollection([raw]), []);
});

test('exact object-name forensic reproduction is fixed', () => {
  const raw = { id: 'y', name: { hostile: true }, provider: 'osm', category: 'hospital' };
  assert(categoriesMatch(raw.category, 'hospitals'));
  assert.deepStrictEqual(normalizePlaceCollection([raw]), []);
});

test('production Discover normalizes before filters, render, and navigation', () => {
  const source = fs.readFileSync(path.join(root, 'src/screens/DiscoverScreen.js'), 'utf8');
  const normalizeAt = source.indexOf('normalizePlaceCollection(allPlaces)');
  const filterAt = source.indexOf('const filteredData');
  assert(normalizeAt > 0 && normalizeAt < filterAt);
  assert(source.includes('let results = canonicalPlaces'));
  assert(source.includes('data={filteredData}'));
  assert(source.includes("navigation.navigate('PlaceDetail', { item })"));
  assert(!source.includes('allPlaces.map((p) => ({ ...p'));
});

console.log(`Milestone 7 hostile Discover place contract: ${passed} tests passed.`);
