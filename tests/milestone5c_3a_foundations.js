const assert = require('assert');
const foundations = require('../src/theme/foundations');
const modes = require('../src/theme/themeModeCore');
const rtl = require('../src/theme/rtl');
const context = require('../src/domain/contextFoundation');
const flags = require('../src/config/featureFlagsCore');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }

test('dark and light semantic theme roles are complete', () => {
  for (const mode of ['dark', 'light']) {
    const colors = foundations.THEMES[mode].colors;
    for (const group of ['background', 'text', 'action', 'progress', 'status', 'border']) assert(colors[group]);
    assert(colors.background.canvas && colors.text.primary && colors.action.primary);
  }
});
test('theme preference resolves system light and dark safely', () => {
  assert.strictEqual(modes.resolveThemeMode('system', 'light'), 'light');
  assert.strictEqual(modes.resolveThemeMode('system', 'dark'), 'dark');
  assert.strictEqual(modes.resolveThemeMode('corrupt', 'light'), 'light');
  assert.strictEqual(modes.resolveThemeMode('dark', 'light'), 'dark');
});
test('legacy aliases required by current screens remain exported', () => {
  const source = require('fs').readFileSync(require('path').join(__dirname, '../src/theme/index.js'), 'utf8');
  for (const name of ['COLORS', 'DEPTH', 'ACCENT', 'TEXT', 'BORDER', 'STATUS', 'FONTS', 'SPACING', 'RADIUS', 'colors', 'spacing', 'radii', 'type']) {
    assert(new RegExp(`export const ${name}\\b`).test(source), `${name} missing`);
  }
});
test('unknown context remains unknown and never gains a placeholder', () => {
  assert.deepStrictEqual(context.createContextValue('Vienna', 'unknown'), { value: null, origin: 'unknown', isKnown: false });
  assert.strictEqual(context.contextValueOrNull(context.createContextValue(null, 'user_selected')), null);
  assert.strictEqual(context.contextValueOrNull(context.createContextValue('Vienna', 'user_selected')), 'Vienna');
});
test('Austria and another country share the jurisdiction schema', () => {
  const vienna = context.createJurisdiction({ countryCode: 'AT', region: { id: 'AT-9', name: 'Vienna' }, municipality: { id: 'vie', name: 'Vienna' } });
  const paris = context.createJurisdiction({ countryCode: 'FR', region: { id: 'FR-IDF', name: 'Île-de-France' }, municipality: { id: 'paris', name: 'Paris' } });
  assert.deepStrictEqual(Object.keys(vienna), Object.keys(paris));
  assert.strictEqual(vienna.region.level, 'region');
});
test('only canonical trust classes are accepted', () => {
  for (const item of context.TRUST_CLASSES) assert.strictEqual(context.normalizeTrustClass(item), item);
  assert.strictEqual(context.normalizeTrustClass('government-ish'), null);
});
test('freshness remains distinct and missing dates stay unknown', () => {
  assert.strictEqual(context.deriveFreshness(), 'date_unknown');
  assert.strictEqual(context.normalizeFreshness('fresh'), 'date_unknown');
  assert.strictEqual(context.deriveFreshness({ updatedAt: '2026-01-01', reviewDueAt: '2026-12-01', now: Date.parse('2026-08-10') }), 'current');
  assert.strictEqual(context.deriveFreshness({ reviewDueAt: '2026-08-20', now: Date.parse('2026-08-10') }), 'review_due');
  assert.strictEqual(context.deriveFreshness({ reviewDueAt: '2026-08-01', now: Date.parse('2026-08-10') }), 'outdated');
});
test('feature flags default off, accept valid overrides and ignore invalid values', () => {
  assert(Object.values(flags.FLAG_DEFAULTS).every((value) => value === false));
  const result = flags.resolveFeatureFlags({ contextualHome: 'true', newNavigation: 'perhaps', unknown: true });
  assert.strictEqual(result.contextualHome, true);
  assert.strictEqual(result.newNavigation, false);
  assert.strictEqual(result.unknown, undefined);
});
test('RTL helpers swap logical edges and mirror directional icons only', () => {
  assert.deepStrictEqual(rtl.logicalMargin(false, 8, 16), { marginLeft: 8, marginRight: 16 });
  assert.deepStrictEqual(rtl.logicalMargin(true, 8, 16), { marginLeft: 16, marginRight: 8 });
  assert.strictEqual(rtl.shouldMirrorIcon('back'), true);
  assert.strictEqual(rtl.shouldMirrorIcon('location'), false);
});
test('touch, body text and reduced-motion foundations meet policy', () => {
  assert.strictEqual(foundations.TOUCH_TARGETS.minimum, 44);
  assert.strictEqual(foundations.TOUCH_TARGETS.preferred, 48);
  assert.deepStrictEqual([foundations.TYPOGRAPHY.body.fontSize, foundations.TYPOGRAPHY.body.lineHeight], [16, 24]);
  assert.strictEqual(foundations.MOTION_TOKENS.reduced.duration, 0);
});
test('legacy application shell and routes remain present behind the additive provider', () => {
  const fs = require('fs');
  const path = require('path');
  const app = fs.readFileSync(path.join(__dirname, '../App.js'), 'utf8');
  const navigator = fs.readFileSync(path.join(__dirname, '../src/navigation/AppNavigator.js'), 'utf8');
  assert(app.includes('<ThemeModeProvider>') && app.includes('<AppProvider>') && app.includes('<AppNavigator />'));
  for (const route of ['Home', 'World', 'People', 'Auth', 'LocationPermission', 'Main', 'AI', 'Profile']) {
    assert(navigator.includes(`name="${route}"`), `${route} route missing`);
  }
});

console.log(`Milestone 5C 3A foundations: ${passed}/11 passed`);
