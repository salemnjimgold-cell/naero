# Design Tokens

## Implementation-ready scale

### Color

Use the semantic palettes in `CONTEXTUAL_COMPASS_DESIGN_SYSTEM.md`, implemented as mode-aware roles rather than screen-level hex values. Required roles: canvas, surface, surfaceRaised, surfaceReading, textPrimary, textSecondary, textDisabled, guidance/default/pressed/subtle, investment/default/subtle, information, success, warning, danger, borderSubtle/default/focus, overlay and scrim.

### Typography

| Token | Size/line | Weight | Use |
|---|---|---:|---|
| display | 32/38 | 700 | Rare launch/hero phrase |
| title1 | 28/34 | 700 | Screen title |
| title2 | 22/28 | 650 | Major section |
| title3 | 18/24 | 600 | Card/detail title |
| bodyLarge | 17/26 | 400 | Important explanation |
| body | 16/24 | 400 | Default reading/UI |
| bodyStrong | 16/24 | 600 | Emphasis/action |
| label | 14/20 | 600 | Controls and tabs |
| caption | 13/18 | 400 | Metadata |
| micro | 12/16 | 600 | Badges only; never essential prose |

All tokens scale with platform Dynamic Type/fontScale; fixed-height text containers are prohibited.

### Geometry

- Spacing: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
- Radius: `0, 8, 12, 16, 24, full`.
- Page margins: 20 compact; 24 medium; centered max content width 720 for reading and 960 for list/map layouts.
- Grid: 4 dp base; one column on phones; adaptive split list/map at ≥840 logical px.
- Touch: 44 minimum, 48 preferred, 56 primary/urgent.
- Icons: 16 metadata, 20 inline, 24 standard, 32 feature, 48 empty state.
- Borders: 1 standard, 2 focus/selected, 3 urgent emphasis maximum.
- Elevation: level 0 flat; level 1 card/sheet edge; level 2 floating navigation/compact AI; level 3 modal. Prefer tonal separation to shadow.
- Motion: instant 0, fast 120 ms, standard 200 ms, deliberate 300 ms, context 400 ms; no UI transition beyond 500 ms.
- Bottom navigation: 64 content height plus safe inset; four equal destinations; icon+label always shown; primary targets ≥48.

## Font strategy

Use platform/system families initially because they provide mature Arabic and Latin shaping: SF Arabic/SF Pro on iOS where available; Noto Sans Arabic plus Roboto/Noto Sans on Android. If a custom family is evaluated later, require comparable Arabic weights, Latin extended coverage (French/Hungarian), tabular numerals and tested fallback metrics. Never force Latin Inter onto Arabic text.

## Current theme classification

| Current family | Decision | Treatment |
|---|---|---|
| `SPACING`/`spacing` | KEEP/MODIFY | Preserve 4 dp scale; unify duplicate naming |
| `RADIUS`/`radii` | KEEP/MODIFY | Consolidate to six semantic radii |
| `MOTION`/`motion` | MODIFY | Remove looping ambient defaults; add reduced-motion tokens |
| `DEPTH` | MODIFY | Map to mode-aware canvas/surfaces |
| `ACCENT` | DEPRECATE | Replace generic accent with semantic guidance roles |
| `WARM` | MODIFY | Rename investment; saved/user progress only |
| `TEXT` | MODIFY | Mode-aware roles and verified contrast pairs |
| `BORDER` | MODIFY | Mode-aware subtle/default/focus roles |
| `STATUS` | KEEP/MODIFY | Separate success from guidance; accessible variants |
| `COLORS`/`colors` compatibility aliases | DEPRECATE gradually | Migrate consumers before removal |
| `GRADIENTS` | DEPRECATE mostly | Retain only explicit brand/hero use if approved |
| `FONTS`/`type` | MODIFY | 16 px default, dynamic scale, script-aware families |
| `SHADOWS`/`shadows` | MODIFY | Four restrained elevation levels |
| `layout`, `hitSlop` | KEEP/MODIFY | Add adaptive widths, logical directions and 44/48 targets |
| Trust, jurisdiction, source tokens | ADD | Five class structures, freshness and focus semantics |
| Light-mode semantic roles | ADD | Equal support, not an afterthought |
