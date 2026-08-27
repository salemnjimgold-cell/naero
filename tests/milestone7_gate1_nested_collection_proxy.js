const assert = require('assert');
const { buildDirectionsUrl, buildPhoneUrl, getHomeState, normalizePlaceCollection, normalizePlaceDetailParams } = require('../src/domain/coreShell');

const valid = { id: 'osm:1', name: 'Real Hospital', provider: 'osm', category: 'hospital' };
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

function safelyNormalizeItem(item) {
  let result;
  assert.doesNotThrow(() => { result = normalizePlaceDetailParams({ item }); });
  return result;
}

function safelyNormalizeCollection(items) {
  let result;
  assert.doesNotThrow(() => { result = normalizePlaceCollection(items); });
  return result;
}

test('exact nested tags Proxy get trap is omitted', () => {
  const tags = new Proxy([], { get() { throw new Error('hostile get'); } });
  const item = safelyNormalizeItem({ ...valid, tags });
  assert(item);
  assert.strictEqual(item.tags, undefined);
});

test('nested tags length trap is omitted', () => {
  const tags = new Proxy([], { get(target, key, receiver) { if (key === 'length') throw new Error('hostile length'); return Reflect.get(target, key, receiver); } });
  assert.strictEqual(safelyNormalizeItem({ ...valid, tags }).tags, undefined);
});

test('nested tags numeric get trap is omitted', () => {
  const tags = new Proxy(['safe'], { get(target, key, receiver) { if (key === '0') throw new Error('hostile index'); return Reflect.get(target, key, receiver); } });
  assert.strictEqual(safelyNormalizeItem({ ...valid, tags }).tags, undefined);
});

test('nested tags ownership descriptor trap is omitted', () => {
  const tags = new Proxy(['safe'], { getOwnPropertyDescriptor() { throw new Error('hostile descriptor'); } });
  assert.strictEqual(safelyNormalizeItem({ ...valid, tags }).tags, undefined);
});

test('hostile tag iterator is never read', () => {
  const tags = ['safe'];
  Object.defineProperty(tags, Symbol.iterator, { get() { throw new Error('hostile iterator'); } });
  const item = safelyNormalizeItem({ ...valid, tags });
  assert.deepStrictEqual(item.tags, ['safe']);
});

test('sparse and inherited tag entries cannot become trusted', () => {
  const tags = new Array(3);
  tags[1] = 'own';
  Array.prototype[0] = 'inherited';
  try {
    const item = safelyNormalizeItem({ ...valid, tags });
    assert.deepStrictEqual(item.tags, ['own']);
  } finally {
    delete Array.prototype[0];
  }
});

test('tag mutation during normalization is isolated', () => {
  const target = ['first', 'second'];
  const tags = new Proxy(target, {
    get(value, key, receiver) {
      if (key === '0') value[1] = { hostile: true };
      return Reflect.get(value, key, receiver);
    },
  });
  const item = safelyNormalizeItem({ ...valid, tags });
  target[0] = 'changed';
  assert.deepStrictEqual(item.tags, ['first']);
  assert(Object.isFrozen(item.tags));
});

test('non-primitive and nested tags are omitted', () => {
  const item = safelyNormalizeItem({ ...valid, tags: ['safe', {}, Symbol('bad'), () => {}, 1n, ['nested']] });
  assert.deepStrictEqual(item.tags, ['safe']);
});

test('tag output remains bounded to twelve inspected entries', () => {
  const tags = Array.from({ length: 30 }, (_, index) => `tag-${index}`);
  const item = safelyNormalizeItem({ ...valid, tags });
  assert.strictEqual(item.tags.length, 12);
  assert.strictEqual(item.tags[11], 'tag-11');
});

test('exact nearby collection Proxy get trap fails closed', () => {
  const items = new Proxy([valid], { get() { throw new Error('hostile get'); } });
  assert.deepStrictEqual(safelyNormalizeCollection(items), []);
});

test('revoked collection Proxy fails closed through Home boundary', () => {
  const revocable = Proxy.revocable([valid], {});
  revocable.revoke();
  assert.deepStrictEqual(safelyNormalizeCollection(revocable.proxy), []);
  assert.doesNotThrow(() => {
    const state = getHomeState({ auth: { mode: 'guest' }, userLocation: { latitude: 1, longitude: 1 }, nearbyPlaces: revocable.proxy });
    assert.deepStrictEqual(state.places, []);
  });
});

test('collection length trap fails closed', () => {
  const items = new Proxy([valid], { get(target, key, receiver) { if (key === 'length') throw new Error('hostile length'); return Reflect.get(target, key, receiver); } });
  assert.deepStrictEqual(safelyNormalizeCollection(items), []);
});

test('collection numeric get trap fails closed', () => {
  const items = new Proxy([valid], { get(target, key, receiver) { if (key === '0') throw new Error('hostile index'); return Reflect.get(target, key, receiver); } });
  assert.deepStrictEqual(safelyNormalizeCollection(items), []);
});

test('collection ownership descriptor trap fails closed', () => {
  const items = new Proxy([valid], { getOwnPropertyDescriptor() { throw new Error('hostile descriptor'); } });
  assert.deepStrictEqual(safelyNormalizeCollection(items), []);
});

test('hostile collection iterator is never read', () => {
  const items = [valid];
  Object.defineProperty(items, Symbol.iterator, { get() { throw new Error('hostile iterator'); } });
  assert.strictEqual(safelyNormalizeCollection(items).length, 1);
});

test('sparse and inherited collection entries are skipped', () => {
  const items = new Array(3);
  items[1] = valid;
  Array.prototype[0] = { ...valid, id: 'inherited' };
  try {
    assert.deepStrictEqual(safelyNormalizeCollection(items).map((item) => item.id), ['osm:1']);
  } finally {
    delete Array.prototype[0];
  }
});

test('collection mutation cannot alter normalized output', () => {
  const first = { ...valid };
  const second = { ...valid, id: 'osm:2', name: 'Second' };
  const target = [first, second];
  const items = new Proxy(target, {
    get(value, key, receiver) {
      if (key === '0') second.name = { hostile: true };
      return Reflect.get(value, key, receiver);
    },
  });
  const normalized = safelyNormalizeCollection(items);
  first.name = { hostile: true };
  assert.deepStrictEqual(normalized.map((item) => item.id), ['osm:1']);
  assert.strictEqual(normalized[0].name, 'Real Hospital');
});

test('isolatable malformed items are dropped while valid records survive', () => {
  const hostileItem = new Proxy(valid, { get() { throw new Error('hostile item'); } });
  const items = safelyNormalizeCollection([
    valid,
    { ...valid, id: 'bad-name', name: {} },
    { ...valid, id: 'missing-provider', provider: undefined },
    Object.assign(Object.create({ provider: 'osm' }), { id: 'inherited', name: 'Inherited' }),
    hostileItem,
    { ...valid, id: 'osm:2' },
  ]);
  assert.deepStrictEqual(items.map((item) => item.id), ['osm:1', 'osm:2']);
  for (const item of items) assert(normalizePlaceDetailParams({ item }));
});

test('collection work is bounded to two hundred indices', () => {
  const target = Array.from({ length: 1000 }, (_, index) => ({ ...valid, id: `osm:${index}` }));
  let highestIndex = -1;
  const items = new Proxy(target, {
    get(value, key, receiver) {
      if (/^\d+$/.test(String(key))) highestIndex = Math.max(highestIndex, Number(key));
      return Reflect.get(value, key, receiver);
    },
  });
  const normalized = safelyNormalizeCollection(items);
  assert.strictEqual(normalized.length, 200);
  assert.strictEqual(highestIndex, 199);
});

test('hostile values cannot reach UI navigation or external actions', () => {
  const [item] = safelyNormalizeCollection([{ ...valid, tags: new Proxy([], { get() { throw new Error('hostile'); } }), phone: {}, address: {}, latitude: {}, longitude: {} }]);
  assert(item);
  assert.strictEqual(item.tags, undefined);
  assert.strictEqual(item.phone, undefined);
  assert.strictEqual(item.address, undefined);
  assert.strictEqual(buildPhoneUrl(item), null);
  assert.strictEqual(buildDirectionsUrl(item), null);
  assert(normalizePlaceDetailParams({ item }));
  assert(!`${item.name}, ${item.category || 'place'}`.includes('[object Object]'));
});

console.log(`Milestone 7 nested/collection Proxy: ${passed} tests passed.`);
