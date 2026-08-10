# 3A Theme Architecture

`src/theme/foundations.js` defines immutable dark/light semantic themes. `ThemeModeContext` persists only `system | light | dark`, safely normalizes missing/corrupt values, follows `useColorScheme` in system mode, and exposes `{preference, resolvedMode, theme, setPreference}`.

`App.js` initializes the provider without changing current screen styling. New work consumes semantic groups (`background`, `text`, `action`, `progress`, `status`, `border`). Existing exports in `src/theme/index.js` remain the Deep Sea compatibility layer.

Dark is the reference mode; light is structurally equal. The mode provider does not redesign Settings or force current screens to switch before migration.

Theme invariants:

- Mode-aware semantic roles, not raw color lookup by feature.
- Immutable shared geometry/type/motion foundations.
- Invalid preference resolves to `system`; unknown system scheme resolves safely to dark.
- No secrets or remote feature service.
- Current navigation theme and legacy StatusBar remain untouched during 3A.
