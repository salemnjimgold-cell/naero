const assert = require('assert');
const fs = require('fs');
const path = require('path');
const i18next = require('i18next');

const root = path.resolve(__dirname, '..');
const localeNames = ['en', 'ar', 'fr', 'hu'];
const locales = localeNames.map((locale) => [locale, require(path.join(root, 'src', 'i18n', `${locale}.json`))]);
const flatten = (value, prefix = '', out = {}) => {
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, next, out);
    else out[next] = child;
  }
  return out;
};
const translator = (locale, resource) => {
  const instance = i18next.createInstance();
  instance.init({ lng: locale, fallbackLng: false, initImmediate: false, resources: { [locale]: { translation: resource } } });
  return instance;
};
const assertResolvedText = (instance, key, locale) => {
  const value = instance.t(key);
  assert.equal(typeof value, 'string', `${locale}.${key} must resolve to text`);
  assert(value.trim(), `${locale}.${key} must not be blank`);
  assert.notEqual(value, key, `${locale}.${key} leaked its raw key`);
  assert(!Array.isArray(value), `${locale}.${key} must not resolve to an array`);
  return value;
};

const expectedGate1 = Object.keys(flatten(locales[0][1].gate1)).sort();
for (const [locale, resource] of locales) {
  const values = flatten(resource.gate1);
  assert.deepStrictEqual(Object.keys(values).sort(), expectedGate1, `${locale} Gate 1 key parity`);
  const instance = translator(locale, resource);
  for (const key of expectedGate1) assertResolvedText(instance, `gate1.${key}`, locale);
}
assert(locales.find(([locale]) => locale === 'ar')[1].gate1.location.title !== locales[0][1].gate1.location.title);

const placeDetailKeys = [
  'gate1.placeDetail.back',
  'gate1.placeDetail.addFavorite',
  'gate1.placeDetail.removeFavorite',
  'places.reviews',
  'places.description',
  'places.hours',
  'places.contact',
  'places.call',
  'places.directions',
];
for (const [locale, resource] of locales) {
  const instance = translator(locale, resource);
  for (const key of placeDetailKeys) assertResolvedText(instance, key, locale);
}

const productionFiles = [
  'src/screens/WelcomeScreen.js',
  'src/screens/LocationPermissionScreen.js',
  'src/screens/HomeScreen.js',
  'src/screens/DiscoverScreen.js',
  'src/screens/ExploreScreen.js',
  'src/screens/PlaceDetailScreen.js',
  'src/screens/CommunityScreen.js',
  'src/screens/JobsScreen.js',
  'src/screens/ServicesScreen.js',
  'src/screens/SafetyScreen.js',
  'src/screens/AIScreen.js',
  'src/navigation/AppNavigator.js',
];
const gate1ProductionKeys = new Set();
for (const relative of productionFiles) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
    const key = match[1];
    if (!key.startsWith('compass3') && !key.startsWith('contextual.')) gate1ProductionKeys.add(key);
  }
}
const unresolvedProductionKeys = [];
for (const [locale, resource] of locales) {
  const instance = translator(locale, resource);
  for (const key of [...gate1ProductionKeys].sort()) {
    const value = instance.t(key);
    if (typeof value !== 'string' || !value.trim() || value === key || Array.isArray(value)) {
      unresolvedProductionKeys.push(`${locale}.${key}`);
    }
  }
}
assert.deepStrictEqual(unresolvedProductionKeys, [], `unresolved Gate 1 production keys: ${unresolvedProductionKeys.join(', ')}`);

console.log(`Milestone 7 localization: ${expectedGate1.length} Gate 1 keys and ${gate1ProductionKeys.size} production lookups x ${locales.length} locales passed.`);
