const assert = require('assert');
const fs = require('fs');
const path = require('path');
const context = require('../src/domain/onboardingContextCore');
const flags = require('../src/config/featureFlagsCore');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

assert.strictEqual(flags.FLAG_DEFAULTS.newNavigation, false, 'new navigation must default off');
assert.strictEqual(flags.FLAG_DEFAULTS.newOnboarding, false, 'new onboarding must default off');
assert.strictEqual(flags.resolveFeatureFlags({ newNavigation: 'true' }).newNavigation, true);
assert.strictEqual(flags.resolveFeatureFlags({ newOnboarding: '1' }).newOnboarding, true);

const manual = context.normalizeContext({ completed: true, language: 'ar', countryCode: 'AT', country: 'Austria', region: 'Vienna Land', municipality: 'Vienna', origin: 'user_selected', locationMode: 'manual', intents: ['oriented', 'work', 'not-real'] });
assert.deepStrictEqual(manual.intents, ['oriented', 'work']);
assert.strictEqual(manual.origin, 'user_selected');
assert.strictEqual(manual.municipality, 'Vienna');
assert.strictEqual(context.parseStoredContext(context.serializeContext(manual)).region, 'Vienna Land');

const nonAustria = context.normalizeContext({ completed: true, language: 'hu', countryCode: 'HU', country: 'Hungary', region: 'Central Hungary', municipality: 'Budapest', origin: 'user_selected', locationMode: 'manual' });
assert.strictEqual(nonAustria.countryCode, 'HU', 'architecture must not be Austria-only');
assert.strictEqual(nonAustria.municipality, 'Budapest');

const unknown = context.normalizeContext({ completed: true, country: 'Austria', municipality: 'Vienna', origin: 'permission_derived', locationMode: 'device' });
assert.strictEqual(unknown.country, null, 'partial place must not become known');
assert.strictEqual(unknown.origin, 'unknown', 'unknown must remain unknown');
assert.strictEqual(context.parseStoredContext('{broken'), null, 'corrupted state must be rejected');
assert.strictEqual(context.parseStoredContext(JSON.stringify({ version: 99, completed: true })), null, 'unknown versions must be rejected');

assert.strictEqual(context.resolveInitialRoute({ newOnboarding: false, hasLaunched: false, storedContext: null }), 'Welcome');
assert.strictEqual(context.resolveInitialRoute({ newOnboarding: true, hasLaunched: false, storedContext: null }), 'ContextualOnboarding');
assert.strictEqual(context.resolveInitialRoute({ newOnboarding: true, hasLaunched: true, storedContext: null }), 'Main', 'existing users must not be forced through onboarding');
assert.strictEqual(context.resolveInitialRoute({ newOnboarding: true, hasLaunched: false, storedContext: manual }), 'Main', 'completed onboarding must survive restart');

const navigator = read('src/navigation/AppNavigator.js');
for (const route of ['Home', 'Discover', 'Plan', 'MyNaero']) assert(navigator.includes(`name="${route}"`), `missing new destination ${route}`);
assert(!navigator.includes('name="AI" component={AIScreen} options={{ tabBar'), 'Ask Naero must not be a fifth tab');
assert(navigator.includes('featureFlags.newNavigation ? ContextualTabNavigator : TabNavigator'), 'rollback boundary missing');
assert(navigator.includes('name="Community"'), 'Community stack route missing');
assert(read('src/screens/MyNaeroShellScreen.js').includes("navigation.navigate('Community')"), 'Community migration access missing');

const onboarding = read('src/screens/ContextualOnboardingScreen.js');
for (const step of ['welcome', 'language', 'account', 'location', 'city', 'confirm', 'intent']) assert(onboarding.includes(`'${step}'`), `missing onboarding step ${step}`);
assert(onboarding.includes("origin: 'user_selected'") || onboarding.includes("setOrigin('user_selected')"));
assert(onboarding.includes("setOrigin('permission_derived')"));
assert(onboarding.includes('StateView'), '3B state system must be used');

const translations = read('src/i18n/compass3c.js');
for (const language of ['const en =', 'const ar =', 'const fr =', 'const hu =']) assert(translations.includes(language), `missing ${language}`);
assert(translations.includes('افهم مكانك الجديد'), 'Arabic production copy missing');
assert(onboarding.includes("i18n.language === 'ar'"), 'Arabic RTL handling missing');

console.log('Milestone 5C Part 3C navigation/onboarding tests passed.');
