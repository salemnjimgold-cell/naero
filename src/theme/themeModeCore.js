const THEME_MODES = Object.freeze(['system', 'light', 'dark']);

function normalizeThemeMode(value) {
  return THEME_MODES.includes(value) ? value : 'system';
}

function resolveThemeMode(preference, systemScheme) {
  const normalized = normalizeThemeMode(preference);
  if (normalized !== 'system') return normalized;
  return systemScheme === 'light' ? 'light' : 'dark';
}

module.exports = { THEME_MODES, normalizeThemeMode, resolveThemeMode };
