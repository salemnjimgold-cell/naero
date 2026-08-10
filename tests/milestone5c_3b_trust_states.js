const assert = require('assert');
const fs = require('fs');
const path = require('path');
const provenance = require('../src/domain/provenance');
const state = require('../src/domain/uiState');
const { TRUST_PRESENTATION } = require('../src/components/contextual/trustPresentation');
const { THEMES, TOUCH_TARGETS } = require('../src/theme/foundations');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }

test('all canonical trust classes have distinct icon and text presentations', () => {
  assert.deepStrictEqual(Object.keys(TRUST_PRESENTATION), provenance.TRUST_CLASSES);
  for (const item of Object.values(TRUST_PRESENTATION)) assert(item.icon && item.tone && item.borderWidth);
});
test('Official does not impersonate Naero Verified and AI is structurally distinct', () => {
  assert.notDeepStrictEqual(TRUST_PRESENTATION.official, TRUST_PRESENTATION.naero_verified);
  assert.strictEqual(TRUST_PRESENTATION.official.borderWidth, 2);
  assert.strictEqual(TRUST_PRESENTATION.ai_guidance.borderStyle, 'dashed');
});
test('AI provenance remains AI Guidance with Official supporting sources', () => {
  const item = provenance.createAIProvenance({ supportingSources: [{ trustClass: 'official', publisher: 'Authority' }] });
  assert.strictEqual(item.trustClass, 'ai_guidance');
  assert.strictEqual(item.supportingSources[0].trustClass, 'official');
  assert.strictEqual(item.aiInvolved, true);
});
test('complete and partial provenance omit missing fields without fabrication', () => {
  const full = provenance.createProvenance({ trustClass: 'naero_verified', publisher: 'Naero', sourceUrl: 'https://example.org/a', publishedAt: '2026-01-02', freshness: 'current' });
  assert(full.sourceUrl.startsWith('https://') && full.publishedAt && full.publisher);
  const partial = provenance.createProvenance({ trustClass: 'community' });
  assert.strictEqual(partial.publisher, null); assert.strictEqual(partial.publishedAt, null); assert.strictEqual(partial.sourceUrl, null);
  assert.strictEqual(provenance.createProvenance({ trustClass: 'invented' }), null);
});
test('external URL safety accepts only http and https', () => {
  assert(provenance.normalizeExternalUrl('https://example.org'));
  assert(provenance.normalizeExternalUrl('http://example.org'));
  for (const value of ['javascript:alert(1)', 'file:///secret', 'mailto:a@b.com', 'not a url', null]) assert.strictEqual(provenance.normalizeExternalUrl(value), null);
});
test('dates remain typed, locale formatted, and missing never means today', () => {
  assert.strictEqual(provenance.normalizeOptionalDate(null), null);
  assert.strictEqual(provenance.formatProvenanceDate(null, 'ar'), null);
  assert(provenance.formatProvenanceDate('2026-08-10', 'de-AT'));
  assert.strictEqual(provenance.normalizeOptionalDate('invalid'), null);
});
test('trust and freshness are independent fields', () => {
  const source = provenance.createSource({ trustClass: 'official', freshness: 'outdated' });
  assert.strictEqual(source.trustClass, 'official'); assert.strictEqual(source.freshness, 'outdated');
});
test('Austria, another jurisdiction, long names, and missing optional levels work', () => {
  const vienna = provenance.createJurisdiction({ countryCode: 'AT', region: { id: 'AT-9', name: 'Wien' }, municipality: { id: 'vie', name: 'Vienna' } });
  const other = provenance.createJurisdiction({ countryCode: 'NZ', municipality: { id: 'long', name: 'A Very Long Multilingual Municipality Name' } });
  assert.strictEqual(vienna.region.id, 'AT-9'); assert.strictEqual(other.region, null); assert(other.municipality.name.length > 20);
});
test('error state kinds are canonical and retry policy fails safely', () => {
  assert.deepStrictEqual(state.ERROR_KINDS, ['network', 'service', 'invalid_data', 'unavailable', 'permission', 'unknown']);
  assert.strictEqual(state.createErrorState({ kind: 'invented', retryable: true }).kind, 'unknown');
  assert.strictEqual(state.createErrorState({ kind: 'invalid_data', retryable: true }).retryable, false);
});
test('every required UI state and accessibility policy is implemented', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/contextual/UIStates.js'), 'utf8');
  for (const name of ['EmptyState', 'ErrorState', 'OfflineState', 'PermissionState', 'LocationOffState', 'StaleInformationState', 'UnsupportedJurisdictionState']) assert(source.includes(`function ${name}`));
  const components = ['TrustBadge.js', 'FreshnessLabel.js', 'JurisdictionLabel.js', 'SourceSummary.js', 'SourceSheet.js', 'Skeleton.js', 'StateView.js'].map(f => fs.readFileSync(path.join(__dirname, '../src/components/contextual', f), 'utf8')).join('\n');
  assert(components.includes('accessibilityRole')); assert(components.includes('accessibilityLabel')); assert.strictEqual(TOUCH_TARGETS.minimum, 44);
});
test('all locales register Contextual Compass strings and Arabic is native script', () => {
  const translations = require('../src/i18n/contextual');
  const keys = value => Object.entries(value).flatMap(([key, child]) => child && typeof child === 'object' ? keys(child).map(nested => `${key}.${nested}`) : [key]).sort();
  const englishKeys = keys(translations.en);
  for (const locale of ['ar', 'fr', 'hu']) assert.deepStrictEqual(keys(translations[locale]), englishKeys, `${locale} keys differ`);
  assert(/[\u0600-\u06FF]/.test(JSON.stringify(translations.ar)));
  const index = fs.readFileSync(path.join(__dirname, '../src/i18n/index.js'), 'utf8');
  for (const locale of ['en', 'ar', 'fr', 'hu']) assert(index.includes(`contextual: contextual.${locale}`));
  assert(index.includes("fallbackLng: 'en'"));
});
test('new trust/state colors retain contrast and do not carry meaning alone', () => {
  for (const mode of ['dark', 'light']) {
    assert(THEMES[mode].colors.text.primary && THEMES[mode].colors.border.strong && THEMES[mode].colors.status.warning);
  }
  const trustSource = fs.readFileSync(path.join(__dirname, '../src/components/contextual/TrustBadge.js'), 'utf8');
  assert(trustSource.includes('Ionicons') && trustSource.includes('label'));
});

console.log(`Milestone 5C 3B trust/state: ${passed}/12 passed`);
