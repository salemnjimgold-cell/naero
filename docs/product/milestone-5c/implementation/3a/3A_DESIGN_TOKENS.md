# 3A Design Tokens

## Semantic colors

| Role | Dark | Light |
|---|---|---|
| Canvas | `#0B1220` | `#F6F3EE` |
| Surface | `#121B2B` | `#FFFFFF` |
| Raised | `#182235` | `#ECE7DF` |
| Reading | `#F7F2EA` | `#FFFFFF` |
| Primary text | `#F6F3EE` | `#172033` |
| Secondary text | `#B8C2D1` | `#536174` |
| Guidance | `#19A974` | `#0E7C57` |
| Guidance pressed | `#0E7C57` | `#095E43` |
| User progress/save | `#B98235` | `#8A5B1F` |
| Information | `#3977D6` | `#285FAF` |
| Warning | `#C47A16` | `#8A540B` |
| Danger | `#C84A45` | `#A43632` |
| Default border | `#334158` | `#D8D1C7` |

Action text is deep navy on dark guidance (6.21:1) and white on light guidance (5.20:1).

## Geometry

- Spacing: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64; semantic aliases cover control, component, card, section and page needs.
- Radius: none 0, control 8, card 12, sheet 16, large 24, pill 9999.
- Border widths: 0, 1, 2 selected/focus, 3 urgent.
- Elevation: flat 0, card 1, floating 4, modal 8. Surface contrast and borders lead in dark mode.
- Touch: minimum 44, preferred 48, prominent 56.
- Icons: metadata 16, inline 20, control/navigation 24, prominent 32, empty 48.
- Motion: 0, 120, 200, 300, 400 ms with semantic enter/exit/standard easing; reduced motion is 0 ms with no shimmer/ambient motion.
