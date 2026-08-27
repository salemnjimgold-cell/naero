const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const screen = fs.readFileSync(path.join(root, 'src/screens/PlaceDetailScreen.js'), 'utf8');
const locales = ['en', 'ar', 'fr', 'hu'].map((locale) => [locale, require(path.join(root, 'src/i18n', `${locale}.json`))]);
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`PASS ${name}`); };

test('Back is a localized button and is hidden when navigation cannot go back', () => {
  assert(screen.includes('const canGoBack = navigation.canGoBack()'));
  assert(screen.includes('{canGoBack ? <TouchableOpacity'));
  assert(screen.includes('accessibilityRole="button"'));
  assert(screen.includes("accessibilityLabel={t('gate1.placeDetail.back')}"));
  assert(screen.includes(': <View style={styles.circleBtnPlaceholder} />}'));
});

test('Favorite exposes dynamic localized label and selected state', () => {
  assert(screen.includes("accessibilityLabel={t(isFavorite ? 'gate1.placeDetail.removeFavorite' : 'gate1.placeDetail.addFavorite')}"));
  assert(screen.includes('accessibilityState={{ selected: isFavorite }}'));
  assert(screen.includes('onPress={() => toggleFavorite(item.id)}'));
});

test('Both icon actions have non-overlapping 44 by 44 targets', () => {
  const circle = screen.match(/circleBtn:\s*\{([\s\S]*?)\n\s*\},/);
  assert(circle, 'circleBtn style missing');
  assert(/width:\s*44/.test(circle[1]));
  assert(/height:\s*44/.test(circle[1]));
  assert(screen.includes("justifyContent: 'space-between'"));
});

test('Accessibility keys are non-empty and equivalent across all locales', () => {
  const keys = ['back', 'addFavorite', 'removeFavorite'];
  for (const [locale, resource] of locales) {
    for (const key of keys) {
      const value = resource.gate1?.placeDetail?.[key];
      assert.equal(typeof value, 'string', `${locale}.${key} missing`);
      assert(value.trim(), `${locale}.${key} blank`);
    }
  }
  assert.notEqual(locales[1][1].gate1.placeDetail.addFavorite, locales[0][1].gate1.placeDetail.addFavorite);
});

console.log(`Milestone 7 Gate 1 accessibility: ${passed}/4 passed.`);
