# Contextual Compass Design System

## Philosophy

Contextual Compass combines calm structure, humane reading comfort and semantic direction. It is neither a recolored Deep Sea nor Guided Compass copied wholesale. Dark and light modes are equal products: dark supports calm focus; light supports daytime reading, maps, documents and accessibility preference.

## Core dark palette

| Role | Token | Value |
|---|---|---|
| Canvas | `canvas` | `#0B1220` |
| Elevated surface | `surfaceRaised` | `#182235` |
| Reading surface | `surfaceReading` | `#F7F2EA` |
| Primary text on dark | `textOnDark` | `#F6F3EE` |
| Secondary text on dark | `textMutedOnDark` | `#B8C2D1` |
| Primary text on light | `textOnLight` | `#172033` |
| Guidance/action | `guidance` | `#19A974` |
| Guidance pressed | `guidanceStrong` | `#0E7C57` |
| Progress/save | `investment` | `#B98235` |
| Information | `information` | `#3977D6` |
| Warning | `warning` | `#C47A16` |
| Danger | `danger` | `#C84A45` |
| Subtle dark border | `borderDark` | `#334158` |
| Subtle light border | `borderLight` | `#D8D1C7` |
| Overlay | `overlay` | `rgba(4,9,17,0.72)` |

## Light palette

Canvas `#F6F3EE`; base surface `#FFFFFF`; raised surface `#ECE7DF`; primary text `#172033`; secondary text `#536174`. Guidance uses `#0E7C57` for accessible text/actions; investment `#8A5B1F`; information `#285FAF`; warning `#8A540B`; danger `#A43632`; border `#D8D1C7`.

Exact component contrast must be tested; tokens do not waive state-specific WCAG checks.

## Semantic rules

- Guidance green means recommended/user-initiated forward action and Naero Verified—not generic decoration.
- Investment amber means saved, user-owned or completed—not warnings.
- Blue means neutral information/external data—not primary brand competition.
- Warning and danger never decorate categories.
- Trust class always combines icon, label and structure.
- Reading surfaces may be light inside dark mode for long official/guidance content; transitions must remain visually calm.

## Surfaces and imagery

Use pages for flows, cards for discrete records/actions, inset reading surfaces for long guidance, and sheets for contextual detail. Avoid universal card grids, glassmorphism and decorative gradients. Photography is used only for place recognition or authentic editorial context; maps orient; diagrams explain; abstract graphics are reserved for brand/empty states. No stereotypical stock imagery of distressed newcomers.

## Icon and motion philosophy

Use one consistent rounded-outline family, 2 px optical stroke at 24 px. Directional icons mirror in RTL; universal symbols do not. The compass is a state marker for guidance/thinking, never ambient decoration. No perpetual motion. Motion communicates route continuity, expansion, save/completion and context change.

## Motion specification

| Event | Standard behavior | Reduced-motion equivalent |
|---|---|---|
| Stack navigation | 300 ms horizontal transition following reading direction | Instant content swap with focus restoration |
| Modal/source sheet | 300 ms rise plus scrim fade | Instant sheet and scrim |
| Ask Naero expansion | 200 ms shared-container expansion from trigger | Instant full surface |
| Plan completion | 200 ms state crossfade and check reveal; no celebration | Immediate text/icon state |
| Save | 120 ms press plus 200 ms icon/state crossfade | Immediate saved label |
| Loading | Content-shaped low-contrast pulse, 1.5 s | Static skeleton |
| Location/context change | 200 ms content crossfade after new context label is committed | Immediate update plus status announcement |

Navigation motion preserves origin and direction; it never delays urgent actions. Maximum concurrent animated regions is one foreground transition plus one loading indicator.
