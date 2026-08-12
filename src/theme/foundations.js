const DARK_COLORS = Object.freeze({
  background: Object.freeze({ canvas: '#0B1220', surface: '#121B2B', raised: '#182235', reading: '#F7F2EA', overlay: 'rgba(4,9,17,0.72)' }),
  text: Object.freeze({ primary: '#F6F3EE', secondary: '#B8C2D1', disabled: '#78869A', inverse: '#172033', onAction: '#0B1220' }),
  action: Object.freeze({ primary: '#19A974', primaryPressed: '#0E7C57', subtle: 'rgba(25,169,116,0.14)' }),
  progress: Object.freeze({ user: '#B98235', subtle: 'rgba(185,130,53,0.14)' }),
  status: Object.freeze({ info: '#3977D6', success: '#19A974', warning: '#C47A16', danger: '#C84A45' }),
  border: Object.freeze({ subtle: '#26344A', default: '#334158', strong: '#52627A', focus: '#19A974' }),
});

const LIGHT_COLORS = Object.freeze({
  background: Object.freeze({ canvas: '#F6F3EE', surface: '#FFFFFF', raised: '#ECE7DF', reading: '#FFFFFF', overlay: 'rgba(23,32,51,0.48)' }),
  text: Object.freeze({ primary: '#172033', secondary: '#536174', disabled: '#7B8797', inverse: '#F6F3EE', onAction: '#FFFFFF' }),
  action: Object.freeze({ primary: '#0E7C57', primaryPressed: '#095E43', subtle: 'rgba(14,124,87,0.12)' }),
  progress: Object.freeze({ user: '#8A5B1F', subtle: 'rgba(138,91,31,0.12)' }),
  status: Object.freeze({ info: '#285FAF', success: '#0E7C57', warning: '#8A540B', danger: '#A43632' }),
  border: Object.freeze({ subtle: '#E5DFD6', default: '#D8D1C7', strong: '#A99F92', focus: '#0E7C57' }),
});

const TYPOGRAPHY = Object.freeze({
  display: Object.freeze({ fontSize: 32, lineHeight: 38, fontWeight: '700', maxFontSizeMultiplier: 2 }),
  titleLarge: Object.freeze({ fontSize: 28, lineHeight: 34, fontWeight: '700', maxFontSizeMultiplier: 2 }),
  title: Object.freeze({ fontSize: 22, lineHeight: 28, fontWeight: '600', maxFontSizeMultiplier: 2 }),
  titleSmall: Object.freeze({ fontSize: 18, lineHeight: 24, fontWeight: '600', maxFontSizeMultiplier: 2 }),
  bodyLarge: Object.freeze({ fontSize: 17, lineHeight: 26, fontWeight: '400', maxFontSizeMultiplier: 2 }),
  body: Object.freeze({ fontSize: 16, lineHeight: 24, fontWeight: '400', maxFontSizeMultiplier: 2 }),
  bodyStrong: Object.freeze({ fontSize: 16, lineHeight: 24, fontWeight: '600', maxFontSizeMultiplier: 2 }),
  label: Object.freeze({ fontSize: 14, lineHeight: 20, fontWeight: '600', maxFontSizeMultiplier: 2 }),
  caption: Object.freeze({ fontSize: 13, lineHeight: 18, fontWeight: '400', maxFontSizeMultiplier: 2 }),
  micro: Object.freeze({ fontSize: 12, lineHeight: 16, fontWeight: '600', maxFontSizeMultiplier: 2 }),
  families: Object.freeze({ ios: 'System', android: 'sans-serif', androidArabic: 'sans-serif' }),
});

const SPACING_SCALE = Object.freeze({ none: 0, xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, section: 40, page: 48, huge: 64 });
const RADIUS_SCALE = Object.freeze({ none: 0, control: 8, card: 12, sheet: 16, large: 24, pill: 9999 });
const BORDER_WIDTHS = Object.freeze({ none: 0, hairline: 1, selected: 2, urgent: 3 });
const ELEVATION = Object.freeze({ flat: 0, card: 1, floating: 4, modal: 8 });
const TOUCH_TARGETS = Object.freeze({ minimum: 44, preferred: 48, prominent: 56 });
const ICON_SIZES = Object.freeze({ metadata: 16, inline: 20, control: 24, navigation: 24, prominent: 32, empty: 48 });
const MOTION_TOKENS = Object.freeze({
  duration: Object.freeze({ instant: 0, fast: 120, standard: 200, deliberate: 300, context: 400 }),
  easing: Object.freeze({ standard: 'ease-in-out', enter: 'ease-out', exit: 'ease-in' }),
  reduced: Object.freeze({ duration: 0, allowEssentialOnly: true, shimmer: false, ambient: false }),
});

const THEMES = Object.freeze({
  dark: Object.freeze({ mode: 'dark', colors: DARK_COLORS, typography: TYPOGRAPHY, spacing: SPACING_SCALE, radius: RADIUS_SCALE, borders: BORDER_WIDTHS, elevation: ELEVATION, touchTargets: TOUCH_TARGETS, icons: ICON_SIZES, motion: MOTION_TOKENS }),
  light: Object.freeze({ mode: 'light', colors: LIGHT_COLORS, typography: TYPOGRAPHY, spacing: SPACING_SCALE, radius: RADIUS_SCALE, borders: BORDER_WIDTHS, elevation: ELEVATION, touchTargets: TOUCH_TARGETS, icons: ICON_SIZES, motion: MOTION_TOKENS }),
});

module.exports = { DARK_COLORS, LIGHT_COLORS, TYPOGRAPHY, SPACING_SCALE, RADIUS_SCALE, BORDER_WIDTHS, ELEVATION, TOUCH_TARGETS, ICON_SIZES, MOTION_TOKENS, THEMES };
