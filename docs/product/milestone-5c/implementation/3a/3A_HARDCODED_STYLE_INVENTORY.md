# 3A Hard-coded Style Inventory

## Compatibility impact

The repository uses theme tokens broadly but also embeds raw colors, opacity strings, physical direction and fixed dimensions in screens/components. These were inventoried, not mass-rewritten.

## Priority

| Priority | Areas | Reason/action |
|---|---|---|
| P0 | `App.js`, `src/theme/index.js`, future Contextual Compass primitives | Foundation/mode boundary; addressed additively in 3A |
| P0 | Current `HomeScreen` hard-coded name, city/week, progress, places and people | Blocks truth; remove/gate when Contextual Home slice starts, without redesign in 3A |
| P1 | Navigator colors/status bar; Home, Discover, AI, Profile, auth/onboarding, details | Migrate with owning screen slice using semantic roles |
| P1 | Buttons, Input, Card, ListingCard, state components, AIFloatingButton | Evolve/consolidate before new screens consume them |
| P1 | `marginLeft/right`, `paddingLeft/right`, absolute left/right across screens/components | Convert to logical direction during each component/screen migration |
| P1 | Fixed heights and `numberOfLines` in controls/cards | Validate at 200% during owning slice |
| P2 | Legacy aliases, gradients, shadows, decorative ambient colors | Remove only after all consumers migrate |
| P2 | About, older utility/detail styling and unused/retired screen artifacts | Clean during secondary-surface phase |

Hard-coded functional provider/category colors require semantic review rather than mechanical replacement. Status and trust must never be inferred from arbitrary color.
