# 3A Deep Sea Compatibility

Current screens import uppercase `DEPTH`, `ACCENT`, `TEXT`, `BORDER`, `STATUS`, `COLORS`, `FONTS`, `SPACING`, `RADIUS`, `SHADOWS`, and legacy lowercase `colors`, `spacing`, `radii`, `type`, `motion`, `shadows`, `layout`, `hitSlop`.

All remain exported unchanged. Contextual Compass is additive through `semanticThemes`, `semanticTypography`, `semanticSpacing`, `semanticRadius`, `semanticBorders`, `semanticElevation`, `touchTargets`, `iconSizes`, and `semanticMotion`.

Compatibility policy:

- Existing consumers receive no mass color/spacing migration in 3A.
- New Contextual Compass components must use semantic themes.
- Compatibility aliases are transitional and removed only after repository-wide consumer migration and regression review.
- App provider initialization adds mode infrastructure but does not switch legacy navigation or screens from Deep Sea.
- Feature flags default off, so no future surface activates accidentally.

Automated tests assert the major legacy exports remain present.
