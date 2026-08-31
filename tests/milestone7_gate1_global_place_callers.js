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

function parseSource(source) {
  return babel.parseSync(source, {
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

function navigatorRoutes(ast, navigatorName, navigatorObject) {
  const fn = functionNode(ast, navigatorName);
  assert(fn, `missing ${navigatorName}`);
  const routes = [];
  walk(fn, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    const tag = node.name;
    if (tag.type !== 'JSXMemberExpression' || tag.object.name !== navigatorObject || tag.property.name !== 'Screen') return;
    routes.push({
      name: literalAttribute(jsxAttribute(node, 'name')),
      components: componentNames(jsxAttribute(node, 'component')),
    });
  });
  return routes;
}

function allScreenRegistrations(ast) {
  const routes = [];
  walk(ast, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    const tag = node.name;
    if (tag.type !== 'JSXMemberExpression' || tag.property.name !== 'Screen') return;
    routes.push({
      navigator: tag.object.name,
      name: literalAttribute(jsxAttribute(node, 'name')),
      components: componentNames(jsxAttribute(node, 'component')),
    });
  });
  return routes;
}

function validateNavigationContract(source, flagDefaults = FLAG_DEFAULTS) {
  const navigator = parseSource(source);
  const legacy = navigatorRoutes(navigator, 'TabNavigator', 'Tab');
  const contextual = navigatorRoutes(navigator, 'ContextualTabNavigator', 'Tab');
  const stack = navigatorRoutes(navigator, 'AppNavigator', 'Stack');
  assert.deepStrictEqual(legacy, [
    { name: 'Home', components: ['HomeScreen'] },
    { name: 'World', components: ['DiscoverScreen'] },
    { name: 'People', components: ['CommunityScreen'] },
  ]);
  assert.deepStrictEqual(contextual, [
    { name: 'Home', components: ['ContextualHomeBridgeScreen'] },
    { name: 'Discover', components: ['ContextualDiscoverScreen', 'DiscoverScreen'] },
    { name: 'Plan', components: ['PlanShellScreen'] },
    { name: 'MyNaero', components: ['MyNaeroShellScreen'] },
  ]);
  const placeDetail = stack.filter((route) => route.name === 'PlaceDetail');
  assert.deepStrictEqual(placeDetail, [{ name: 'PlaceDetail', components: ['PlaceDetailScreen'] }]);
  const registrations = allScreenRegistrations(navigator);
  assert(!registrations.some((route) => route.name === 'Explore' || route.components.includes('ExploreScreen')), 'legacy Explore became reachable without authorization');
  assert.strictEqual(flagDefaults.newNavigation, false);
  return { legacy, contextual, stack, registrations };
}

const navigatorSource = read('src/navigation/AppNavigator.js');

test('production navigation graph keeps legacy discovery merged into World', () => {
  validateNavigationContract(navigatorSource);
});

test('reachable production PlaceDetail caller set is exactly Home and Discover', () => {
  const graph = validateNavigationContract(navigatorSource);
  const reachableComponents = new Set([
    ...graph.legacy,
    ...graph.contextual,
  ].flatMap((route) => route.components));
  const screens = fs.readdirSync(path.join(root, 'src/screens')).filter((file) => file.endsWith('.js'));
  const sourceCallers = screens.filter((file) => /navigate\(\s*['"]PlaceDetail['"]/.test(read(`src/screens/${file}`))).sort();
  const reachableCallers = sourceCallers.filter((file) => reachableComponents.has(path.basename(file, '.js')));
  assert.deepStrictEqual(sourceCallers, ['DiscoverScreen.js', 'ExploreScreen.js', 'HomeScreen.js']);
  assert.deepStrictEqual(reachableCallers, ['DiscoverScreen.js', 'HomeScreen.js']);
  assert(!reachableComponents.has('ExploreScreen'), 'legacy Explore became reachable without authorization');
  assert(graph.stack.some((route) => route.name === 'PlaceDetail' && route.components.length === 1 && route.components[0] === 'PlaceDetailScreen'));
});

function mutationDetected(name, mutateSource, flagDefaults = FLAG_DEFAULTS) {
  test(`hostile navigation mutation detected: ${name}`, () => {
    assert.throws(() => validateNavigationContract(mutateSource(navigatorSource), flagDefaults));
  });
}

const remove = (fragment) => (source) => {
  assert(source.includes(fragment), `mutation fixture missing: ${fragment}`);
  return source.replace(fragment, '');
};
const replace = (before, after) => (source) => {
  assert(source.includes(before), `mutation fixture missing: ${before}`);
  return source.replace(before, after);
};

mutationDetected('legacy Home removal', remove('<Tab.Screen\n        name="Home"\n        component={HomeScreen}\n        options={{ tabBarLabel: t(\'nav.home\') }}\n        listeners={{ tabPress: () => Haptics.selectionAsync().catch(() => {}) }}\n      />'));
mutationDetected('legacy World removal', remove('<Tab.Screen\n        name="World"\n        component={DiscoverScreen}\n        options={{ tabBarLabel: t(\'nav.world\') }}\n        listeners={{ tabPress: () => Haptics.selectionAsync().catch(() => {}) }}\n      />'));
mutationDetected('legacy People removal', remove('<Tab.Screen\n        name="People"\n        component={CommunityScreen}\n        options={{ tabBarLabel: t(\'nav.people\') }}\n        listeners={{ tabPress: () => Haptics.selectionAsync().catch(() => {}) }}\n      />'));
mutationDetected('legacy Home misbind', replace('name="Home"\n        component={HomeScreen}', 'name="Home"\n        component={CommunityScreen}'));
mutationDetected('legacy World misbind', replace('name="World"\n        component={DiscoverScreen}', 'name="World"\n        component={HomeScreen}'));
mutationDetected('legacy People misbind', replace('name="People"\n        component={CommunityScreen}', 'name="People"\n        component={HomeScreen}'));

mutationDetected('contextual Home removal', remove('<Tab.Screen name="Home" component={ContextualHomeBridgeScreen} options={{ tabBarLabel: t(\'nav.home\') }} />'));
mutationDetected('contextual Discover removal', remove('<Tab.Screen name="Discover" component={featureFlags.newDiscover ? ContextualDiscoverScreen : DiscoverScreen} options={{ tabBarLabel: t(\'compass3c.nav.discover\') }} />'));
mutationDetected('contextual Plan removal', remove('<Tab.Screen name="Plan" component={PlanShellScreen} options={{ tabBarLabel: t(\'compass3c.nav.plan\') }} />'));
mutationDetected('contextual My Naero removal', remove('<Tab.Screen name="MyNaero" component={MyNaeroShellScreen} options={{ tabBarLabel: t(\'compass3c.nav.myNaero\') }} />'));
mutationDetected('contextual Home misbind', replace('component={ContextualHomeBridgeScreen}', 'component={PlanShellScreen}'));
mutationDetected('contextual Discover misbind', replace('component={featureFlags.newDiscover ? ContextualDiscoverScreen : DiscoverScreen}', 'component={PlanShellScreen}'));
mutationDetected('contextual Plan misbind', replace('component={PlanShellScreen}', 'component={MyNaeroShellScreen}'));
mutationDetected('contextual My Naero misbind', replace('component={MyNaeroShellScreen}', 'component={PlanShellScreen}'));

const beforeLegacyClose = '    </Tab.Navigator>\n  );\n}\n\nfunction ContextualTabNavigator';
mutationDetected('Explore legacy fourth tab', replace(beforeLegacyClose, '      <Tab.Screen name="Explore" component={ExploreScreen} />\n' + beforeLegacyClose));
mutationDetected('ExploreScreen renamed legacy tab', replace(beforeLegacyClose, '      <Tab.Screen name="Places" component={ExploreScreen} />\n' + beforeLegacyClose));
const beforeContextualClose = '  </Tab.Navigator><Pressable';
mutationDetected('Explore contextual tab', replace(beforeContextualClose, '    <Tab.Screen name="Explore" component={ExploreScreen} />\n' + beforeContextualClose));
mutationDetected('ExploreScreen renamed contextual tab', replace(beforeContextualClose, '    <Tab.Screen name="Places" component={ExploreScreen} />\n' + beforeContextualClose));
const beforeStackClose = '      </Stack.Navigator>';
mutationDetected('Explore stack route', replace(beforeStackClose, '        <Stack.Screen name="Explore" component={ExploreScreen} />\n' + beforeStackClose));
mutationDetected('ExploreScreen renamed stack route', replace(beforeStackClose, '        <Stack.Screen name="Places" component={ExploreScreen} />\n' + beforeStackClose));

mutationDetected('PlaceDetail removal', (source) => source.replace(/\s*<Stack\.Screen\s+name="PlaceDetail"[\s\S]*?\/>/, ''));
mutationDetected('PlaceDetail misbind', replace('name="PlaceDetail"\n          component={PlaceDetailScreen}', 'name="PlaceDetail"\n          component={ServiceDetailScreen}'));
mutationDetected('PlaceDetail duplicate', replace(beforeStackClose, '        <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />\n' + beforeStackClose));
mutationDetected('newNavigation default change', (source) => source, { ...FLAG_DEFAULTS, newNavigation: true });

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
