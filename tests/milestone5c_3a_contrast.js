const assert = require('assert');
const { THEMES } = require('../src/theme/foundations');

function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function luminance(hex) { return rgb(hex).map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0); }
function ratio(a, b) { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); }

const pairs = [];
for (const mode of ['dark', 'light']) {
  const c = THEMES[mode].colors;
  pairs.push([`${mode} primary/canvas`, c.text.primary, c.background.canvas, 4.5]);
  pairs.push([`${mode} secondary/canvas`, c.text.secondary, c.background.canvas, 4.5]);
  pairs.push([`${mode} primary/raised`, c.text.primary, c.background.raised, 4.5]);
  pairs.push([`${mode} reading text/reading`, mode === 'dark' ? c.text.inverse : c.text.primary, c.background.reading, 4.5]);
  pairs.push([`${mode} action text/guidance`, c.text.onAction, c.action.primary, 4.5]);
  pairs.push([`${mode} warning/canvas`, c.status.warning, c.background.canvas, 3]);
  pairs.push([`${mode} danger/canvas`, c.status.danger, c.background.canvas, 3]);
}
for (const [name, fg, bg, minimum] of pairs) {
  const value = ratio(fg, bg);
  assert(value >= minimum, `${name} ${value.toFixed(2)} < ${minimum}`);
  console.log(`PASS ${name}: ${value.toFixed(2)}:1`);
}
