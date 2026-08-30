const assert = require('assert');
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const { getHomeState, normalizePlaceCollection, normalizePlaceDetailParams } = require('../src/domain/coreShell');
const { FLAG_DEFAULTS } = require('../src/config/featureFlagsCore');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const valid = { id: 'osm:1', name: 'Real Hospital', provider: 'osm', category: 'hospital' };
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

function parse(file) {
  return babel.parseSync(read(file), {
    babelrc: false,
    configFile: false,
    parserOpts: { sourceType: 'module', plugins: ['jsx'] },
  });
}

function walk(node, visitor) {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((entry) => walk(entry, visitor));
    else if (value && typeof value === 'object' && typeof value.type === 'string') walk(value, visitor);
  }
}

function functionNode(ast, name) {
  let result = null;
  walk(ast, (node) => {
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) result = node;
  });
  return result;
}

function jsxAttribute(opening, name) {
  return opening.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === name)?.value;
}

function literalAttribute(value) {
  return value?.type === 'StringLiteral' ? value.value : null;
}

function componentNames(value) {
  if (value?.type !== 'JSXExpressionContainer') return [];
  const names = [];
  walk(value.expression, (node) => {
    if (node.type === 'Identifier' && /Screen$/.test(node.name)) names.push(node.name);
  });
  return [...new Set(names)];
}

function tabRoutes(ast, navigatorName) {
  const fn = functionNode(ast, navigatorName);
  assert(fn, `missing ${navigatorName}`);
  const routes = [];
  walk(fn, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    const tag = node.name;
    if (tag.type !== 'JSXMemberExpression' || tag.object.name !== 'Tab' || tag.property.name !== 'Screen') return;
    routes.push({
      name: literalAttribute(jsxAttribute(node, 'name')),
      components: componentNames(jsxAttribute(node, 'component')),
    });
  });
  return routes;
}

test('production navigation graph keeps legacy discovery merged into World', () => {
  const navigator = parse('src/navigation/AppNavigator.js');
  const legacy = tabRoutes(navigator, 'TabNavigator');
  const contextual = tabRoutes(navigator, 'ContextualTabNavigator');
  assert.deepStrictEqual(legacy, [
    { name: 'Home', components: ['HomeScreen'] },
    { name: 'World', components: ['DiscoverScreen'] },
    { name: 'People', components: ['CommunityScreen'] },
  ]);
  assert.deepStrictEqual(contextual.map((route) => route.name), ['Home', 'Discover', 'Plan', 'MyNaero']);
  assert(contextual.find((route) => route.name === 'Discover').components.includes('DiscoverScreen'));
  assert(![...legacy, ...contextual].some((route) => route.name === 'Explore' || route.components.includes('ExploreScreen')));
  assert.strictEqual(FLAG_DEFAULTS.newNavigation, false);
});

test('reachable production PlaceDetail caller set is exactly Home and Discover', () => {
  const navigator = parse('src/navigation/AppNavigator.js');
  const reachableComponents = new Set([
    ...tabRoutes(navigator, 'TabNavigator'),
    ...tabRoutes(navigator, 'ContextualTabNavigator'),
  ].flatMap((route) => route.components));
  const screens = fs.readdirSync(path.join(root, 'src/screens')).filter((file) => file.endsWith('.js'));
  const sourceCallers = screens.filter((file) => /navigate\(\s*['"]PlaceDetail['"]/.test(read(`src/screens/${file}`))).sort();
  const reachableCallers = sourceCallers.filter((file) => reachableComponents.has(path.basename(file, '.js')));
  assert.deepStrictEqual(sourceCallers, ['DiscoverScreen.js', 'ExploreScreen.js', 'HomeScreen.js']);
  assert.deepStrictEqual(reachableCallers, ['DiscoverScreen.js', 'HomeScreen.js']);
  assert(!reachableComponents.has('ExploreScreen'), 'legacy Explore became reachable without authorization');
});

test('Home actionable records satisfy PlaceDetail', () => {
  const places = getHomeState({ auth: { mode: 'guest' }, userLocation: { latitude: 1, longitude: 1 }, nearbyPlaces: [valid] }).places;
  assert.strictEqual(places.length, 1);
  assert(places.every((item) => normalizePlaceDetailParams({ item })));
});

for (const caller of ['Discover', 'legacy Explore source']) {
  test(`${caller} actionable records satisfy PlaceDetail`, () => {
    const places = normalizePlaceCollection([valid, { ...valid, id: 'bad', name: {} }]);
    assert.strictEqual(places.length, 1);
    assert(places.every((item) => normalizePlaceDetailParams({ item })));
  });
}

test('reachable callers and legacy Explore source consume the shared collection boundary', () => {
  const home = read('src/domain/coreShell.js');
  const discover = read('src/screens/DiscoverScreen.js');
  const explore = read('src/screens/ExploreScreen.js');
  assert(home.includes('normalizePlaceCollection(nearbyPlaces).slice(0, 3)'));
  assert(discover.includes('normalizePlaceCollection(allPlaces)'));
  assert(explore.includes('normalizePlaceCollection(allPlaces)'));
  for (const source of [discover, explore]) assert(source.includes("navigation.navigate('PlaceDetail', { item })"));
});

console.log(`Milestone 7 global place callers: ${passed} tests passed.`);
