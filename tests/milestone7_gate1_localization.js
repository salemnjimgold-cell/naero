const assert = require('assert');
const path = require('path');
const locales = ['en', 'ar', 'fr', 'hu'].map((locale) => [locale, require(path.join('..', 'src', 'i18n', `${locale}.json`))]);
const flatten = (value, prefix = '', out = {}) => { for (const [key, child] of Object.entries(value)) { const next = prefix ? `${prefix}.${key}` : key; if (child && typeof child === 'object') flatten(child, next, out); else out[next] = child; } return out; };
const expected = Object.keys(flatten(locales[0][1].gate1)).sort();
for (const [locale, resource] of locales) {
  const values = flatten(resource.gate1);
  assert.deepStrictEqual(Object.keys(values).sort(), expected, `${locale} Gate 1 key parity`);
  for (const key of expected) {
    assert.equal(typeof values[key], 'string', `${locale}.${key}`);
    assert(values[key].trim(), `${locale}.${key} blank`);
  }
}
assert(locales.find(([locale]) => locale === 'ar')[1].gate1.location.title !== locales[0][1].gate1.location.title);
console.log(`Milestone 7 localization: ${expected.length} keys x ${locales.length} locales passed.`);
