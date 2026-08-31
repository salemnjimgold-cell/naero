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
const SOURCE_EXTENSIONS = new Set(['.js']);
const CALLER_CLASSIFICATION = Object.freeze({
  'src/screens/HomeScreen.js': { role: 'REACHABLE_PRODUCTION', component: 'HomeScreen', calls: 1 },
  'src/screens/DiscoverScreen.js': { role: 'REACHABLE_PRODUCTION', component: 'DiscoverScreen', calls: 1 },
  'src/screens/ExploreScreen.js': { role: 'UNREACHABLE_LEGACY', component: 'ExploreScreen', calls: 1 },
});

function productionSourcePaths(directory = path.join(root, 'src')) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...productionSourcePaths(absolute));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.relative(root, absolute).replace(/\\/g, '/'));
    }
  }
  return files.sort();
}

function productionSources() {
  return new Map(productionSourcePaths().map((file) => [file, read(file)]));
}

function placeDetailCalls(file, source) {
  const ast = parseSource(source);
  const calls = [];
  walk(ast, (node) => {
    if (!['CallExpression', 'OptionalCallExpression'].includes(node.type)
      || !['MemberExpression', 'OptionalMemberExpression'].includes(node.callee?.type)) return;
    const property = node.callee.computed ? node.callee.property?.value : node.callee.property?.name;
    if (property !== 'navigate' || node.arguments[0]?.type !== 'StringLiteral' || node.arguments[0].value !== 'PlaceDetail') return;
    calls.push({ file, line: node.loc.start.line, column: node.loc.start.column + 1 });
  });
  return calls;
}

function validateGlobalCallerContract(sources, graph) {
  const discovered = [...sources.entries()].flatMap(([file, source]) => placeDetailCalls(file, source));
  const byFile = new Map();
  for (const call of discovered) byFile.set(call.file, [...(byFile.get(call.file) || []), call]);
  assert.deepStrictEqual([...byFile.keys()].sort(), Object.keys(CALLER_CLASSIFICATION).sort());
  const reachableComponents = new Set([...graph.legacy, ...graph.contextual].flatMap((route) => route.components));
  for (const [file, classification] of Object.entries(CALLER_CLASSIFICATION)) {
    const calls = byFile.get(file) || [];
    assert.strictEqual(calls.length, classification.calls, `${file} PlaceDetail call count changed`);
    if (classification.role === 'REACHABLE_PRODUCTION') assert(reachableComponents.has(classification.component), `${file} is not production reachable`);
    else if (classification.role === 'UNREACHABLE_LEGACY') assert(!reachableComponents.has(classification.component), `${file} legacy caller became reachable`);
    else assert.fail(`${file} has an unsupported caller classification`);
  }
  assert.strictEqual(discovered.length, 3);
  return discovered;
}

test('production navigation graph keeps legacy discovery merged into World', () => {
  validateNavigationContract(navigatorSource);
});

test('reachable production PlaceDetail caller set is exactly Home and Discover', () => {
  const graph = validateNavigationContract(navigatorSource);
  const calls = validateGlobalCallerContract(productionSources(), graph);
  assert.deepStrictEqual(calls.map((call) => call.file).sort(), Object.keys(CALLER_CLASSIFICATION).sort());
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

function callerMutationDetected(name, mutateSources) {
  test(`hostile caller mutation detected: ${name}`, () => {
    const sources = productionSources();
    mutateSources(sources);
    assert.throws(() => validateGlobalCallerContract(sources, validateNavigationContract(navigatorSource)));
  });
}

const extraCaller = "export function hostileCaller(navigation, item) { navigation.navigate('PlaceDetail', { item }); }\n";
const optionalObjectCaller = "export function hostileCaller(navigation, item) { navigation?.navigate('PlaceDetail', { item }); }\n";
const optionalMethodCaller = "export function hostileCaller(navigation, item) { navigation.navigate?.('PlaceDetail', { item }); }\n";
const combinedOptionalCaller = "export function hostileCaller(navigation, item) { navigation?.navigate?.('PlaceDetail', { item }); }\n";
callerMutationDetected('out-of-screens component caller', (sources) => sources.set('src/components/HostileCaller.js', extraCaller));
callerMutationDetected('out-of-screens navigation caller', (sources) => sources.set('src/navigation/HostileCaller.js', extraCaller));
callerMutationDetected('other production directory caller', (sources) => sources.set('src/services/HostileCaller.js', extraCaller));
callerMutationDetected('new screens caller', (sources) => sources.set('src/screens/HostileCaller.js', extraCaller));
for (const [name, file] of [
  ['Home caller removal', 'src/screens/HomeScreen.js'],
  ['Discover caller removal', 'src/screens/DiscoverScreen.js'],
  ['Explore caller removal', 'src/screens/ExploreScreen.js'],
]) {
  callerMutationDetected(name, (sources) => sources.set(file, sources.get(file).replace("navigate('PlaceDetail'", "navigate('RemovedPlaceDetail'")));
}
callerMutationDetected('second Home caller', (sources) => sources.set('src/screens/HomeScreen.js', sources.get('src/screens/HomeScreen.js') + extraCaller));
callerMutationDetected('second Discover caller', (sources) => sources.set('src/screens/DiscoverScreen.js', sources.get('src/screens/DiscoverScreen.js') + extraCaller));
callerMutationDetected('unknown canonical caller', (sources) => sources.set('src/components/CanonicalHostileCaller.js', "export function hostileCaller(navigation, canonicalPlace) { navigation.navigate('PlaceDetail', { item: canonicalPlace }); }\n"));
callerMutationDetected('optional object caller', (sources) => sources.set('src/components/OptionalObjectCaller.js', optionalObjectCaller));
callerMutationDetected('optional method caller', (sources) => sources.set('src/components/OptionalMethodCaller.js', optionalMethodCaller));
callerMutationDetected('combined optional caller', (sources) => sources.set('src/components/CombinedOptionalCaller.js', combinedOptionalCaller));
callerMutationDetected('deep optional object caller', (sources) => sources.set('src/features/deep/nested/OptionalObjectCaller.js', optionalObjectCaller));
callerMutationDetected('deep optional method caller', (sources) => sources.set('src/features/deep/nested/OptionalMethodCaller.js', optionalMethodCaller));
callerMutationDetected('optional navigation directory caller', (sources) => sources.set('src/navigation/OptionalCaller.js', optionalObjectCaller));
callerMutationDetected('optional services directory caller', (sources) => sources.set('src/services/OptionalCaller.js', optionalMethodCaller));
callerMutationDetected('unknown canonical optional caller', (sources) => sources.set('src/components/CanonicalOptionalCaller.js', "export function hostileCaller(navigation, canonicalPlace) { navigation?.navigate('PlaceDetail', { item: canonicalPlace }); }\n"));
callerMutationDetected('second optional Home caller', (sources) => sources.set('src/screens/HomeScreen.js', sources.get('src/screens/HomeScreen.js') + optionalObjectCaller));
callerMutationDetected('second optional Discover caller', (sources) => sources.set('src/screens/DiscoverScreen.js', sources.get('src/screens/DiscoverScreen.js') + optionalMethodCaller));
callerMutationDetected('second optional Explore caller', (sources) => sources.set('src/screens/ExploreScreen.js', sources.get('src/screens/ExploreScreen.js') + combinedOptionalCaller));

for (const [name, source, expected] of [
  ['ordinary direct call', extraCaller, 1],
  ['multiline ordinary call', "navigation.navigate(\n  'PlaceDetail',\n  place\n);", 1],
  ['double-quoted ordinary call', 'navigation.navigate("PlaceDetail", place);', 1],
  ['deep ordinary caller', "export const outer = (navigation, place) => () => { navigation.navigate('PlaceDetail', place); };", 1],
  ['alias-object ordinary caller', "router.navigate('PlaceDetail', place);", 1],
  ['same-line ordinary calls', "navigation.navigate('PlaceDetail', a); navigation.navigate('PlaceDetail', b);", 2],
  ['ordinary and optional calls on one line', "navigation.navigate('PlaceDetail', a); navigation?.navigate('PlaceDetail', b);", 2],
  ['two optional calls on one line', "navigation?.navigate('PlaceDetail', a); navigation.navigate?.('PlaceDetail', b);", 2],
  ['comment false positive', "// navigation?.navigate('PlaceDetail', place)", 0],
  ['string false positive', 'const example = "navigation?.navigate(\'PlaceDetail\')";', 0],
  ['non-call optional member access', 'const fn = navigation?.navigate;', 0],
  ['unrelated string constant', "const route = 'PlaceDetail';", 0],
]) {
  test(`caller AST form: ${name}`, () => {
    assert.strictEqual(placeDetailCalls('src/components/Fixture.js', source).length, expected);
  });
}

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
