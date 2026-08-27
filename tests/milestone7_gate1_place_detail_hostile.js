const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildDirectionsUrl, buildPhoneUrl, normalizePlaceDetailParams } = require('../src/domain/coreShell');

let passed = 0;
const valid = { id: 'osm:node/1', name: 'General Hospital', provider: 'osm' };
const check = (name, fn) => { assert.doesNotThrow(fn, name); fn(); passed += 1; };
const invalid = (name, params) => check(name, () => assert.strictEqual(normalizePlaceDetailParams(params), null));
const dropped = (name, field, value) => check(name, () => assert.strictEqual(normalizePlaceDetailParams({ item: { ...valid, [field]: value } })[field], undefined));

invalid('params undefined', undefined); invalid('item undefined', {}); invalid('item null', { item: null });
invalid('primitive item', { item: 1 }); invalid('array item', { item: [] }); invalid('empty object', { item: {} });
invalid('missing id', { item: { name: 'x', provider: 'osm' } }); invalid('object id', { item: { ...valid, id: {} } });
invalid('blank name', { item: { ...valid, name: ' ' } }); invalid('object name', { item: { ...valid, name: {} } });
invalid('missing provider identity', { item: { id: '1', name: 'x' } }); invalid('object provider identity', { item: { ...valid, provider: {} } });
invalid('hostile getter on required identity', { item: Object.defineProperty({ ...valid }, 'id', { get() { throw new Error('hostile'); } }) });
dropped('phone object', 'phone', {}); dropped('phone array', 'phone', []); dropped('blank phone', 'phone', ' '); dropped('phone sanitizes empty', 'phone', '---');
check('hostile phone getter', () => { const item = Object.defineProperty({ ...valid }, 'phone', { get() { throw new Error('hostile'); } }); assert(!normalizePlaceDetailParams({ item }).phone); });
dropped('address object', 'address', {}); dropped('address array', 'address', []); dropped('blank address', 'address', ' ');
check('hostile address getter', () => { const item = Object.defineProperty({ ...valid }, 'address', { get() { throw new Error('hostile'); } }); assert(!normalizePlaceDetailParams({ item }).address); });
for (const [name, field, value] of [['latitude NaN','latitude',NaN],['longitude NaN','longitude',NaN],['latitude Infinity','latitude',Infinity],['longitude Infinity','longitude',Infinity],['latitude 91','latitude',91],['latitude -91','latitude',-91],['longitude 181','longitude',181],['longitude -181','longitude',-181]]) {
  check(name, () => { const out = normalizePlaceDetailParams({ item: { ...valid, latitude: 1, longitude: 1, [field]: value } }); assert.strictEqual(out.latitude, undefined); assert.strictEqual(out.longitude, undefined); });
}
check('coordinates 999/999', () => assert.strictEqual(buildDirectionsUrl(normalizePlaceDetailParams({ item: { ...valid, latitude: 999, longitude: 999 } })), null));
check('valid coordinates', () => assert(buildDirectionsUrl(normalizePlaceDetailParams({ item: { ...valid, latitude: 48.2, longitude: 16.3 } }))));
check('valid address without coordinates', () => assert(buildDirectionsUrl(normalizePlaceDetailParams({ item: { ...valid, address: 'Main Street 1' } }))));
check('valid phone', () => assert.strictEqual(buildPhoneUrl(normalizePlaceDetailParams({ item: { ...valid, phone: '+43 1 234 567' } })), 'tel:+431234567'));
dropped('malformed description object', 'description', {}); dropped('malformed category object', 'category', {}); dropped('malformed hours object', 'hours', {});
check('malformed optional hostile getter', () => { const item = Object.defineProperty({ ...valid }, 'description', { get() { throw new Error('hostile'); } }); assert(!normalizePlaceDetailParams({ item }).description); });
check('external actions reject empty targets', () => { assert.strictEqual(buildPhoneUrl(valid), null); assert.strictEqual(buildDirectionsUrl(valid), null); });
check('all PlaceDetail callers use one item contract', () => {
  const root = path.resolve(__dirname, '..');
  const hits = ['HomeScreen.js', 'DiscoverScreen.js', 'ExploreScreen.js'].map((file) => fs.readFileSync(path.join(root, 'src/screens', file), 'utf8'));
  assert(hits.every((source) => source.includes("navigate('PlaceDetail', { item")));
});

const validPhones = new Map([
  ['123', 'tel:123'], ['123456', 'tel:123456'], ['+4312345678', 'tel:+4312345678'],
  ['+43 1 234 5678', 'tel:+4312345678'], ['+43 (1) 234-5678', 'tel:+4312345678'],
  ['01 234 5678', 'tel:012345678'], ['(01) 234-5678', 'tel:012345678'],
  ['+36 30 123 4567', 'tel:+36301234567'], ['+216 71 123 456', 'tel:+21671123456'],
  ['12345678901234567890', 'tel:12345678901234567890'],
]);
for (const [phone, expected] of validPhones) {
  check(`valid phone ${phone}`, () => {
    const item = normalizePlaceDetailParams({ item: { ...valid, phone } });
    assert(item.phoneTarget, 'Call must be exposed');
    assert.strictEqual(buildPhoneUrl(item), expected);
  });
}

const invalidPhones = [
  '', ' ', '+', '++43123', '43+123', '+43+123', 'abc', 'abc123', '123abc', 'call-me-123',
  'http://example.com/123', 'https://example.com/123', 'tel:123', 'mailto:123', '123@456',
  '123/456', '123\\456', '123?456', '123#456', '123&456', '123=456', '123%456',
  '123:456', '123;456', '12\n34', '12\r34', '12\t34', `12${String.fromCharCode(0)}34`,
  '12\u200b34', '123😀456', {}, [], 123, true, null, undefined, '12',
  '123456789012345678901', '9'.repeat(81),
];
for (const phone of invalidPhones) {
  check('invalid phone fails closed', () => {
    const item = normalizePlaceDetailParams({ item: { ...valid, phone } });
    assert.strictEqual(item.phone, undefined);
    assert.strictEqual(item.phoneTarget, undefined);
    assert.strictEqual(buildPhoneUrl(item), null);
  });
}
check('hostile phone getter remains fail closed', () => {
  const item = Object.defineProperty({ ...valid }, 'phone', { get() { throw new Error('hostile'); } });
  const normalized = normalizePlaceDetailParams({ item });
  assert.strictEqual(normalized.phoneTarget, undefined);
  assert.strictEqual(buildPhoneUrl(normalized), null);
});
console.log(`Milestone 7 hostile PlaceDetail: ${passed} tests passed.`);
