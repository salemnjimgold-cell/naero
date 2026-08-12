# Accessibility and RTL Specification

## Accessibility contract

- WCAG-oriented contrast: 4.5:1 normal text, 3:1 large text and essential graphics; component states are individually tested.
- Controls are 44×44 minimum (48 preferred) with accessible name, role, state and hint only when necessary.
- 200% text scaling preserves all content/actions; reflow replaces truncation for titles, instructions, trust labels and errors.
- Focus order matches visual/semantic order. Modal focus is trapped and restored to its trigger.
- Status, trust, selected and error meanings use text/icon/structure, never color alone.
- Reduced motion removes parallax, ambient loops, shimmer travel and animated compass; opacity/static progress alternatives remain.
- Errors announce once, identify the affected field/operation and recovery. Live AI output uses polite announcements by completed section.
- Hardware keyboard supports tab/shift-tab, activate, escape/close and visible focus on tablets/web where relevant.

## RTL architecture

- Use logical start/end spacing and borders; never encode semantic layout with left/right.
- Navigation history back arrows mirror; external-link, play, check, location pins and brand/trust icons do not.
- Horizontal step sequences follow reading direction; chronological data retains logical order with accessible numbering.
- Arabic paragraph text aligns start/right; Latin Austrian names/URLs/IDs use isolated bidirectional spans.
- Addresses are componentized into name/street/postcode/city/country rather than concatenated strings.
- Western or locale-native numerals follow locale preference, but official reference numbers preserve source representation.
- Mixed Arabic/German labels wrap naturally; avoid ellipsis on authority, source and action names.

## Language stress cases

- Arabic: shaping, diacritics, mixed Vienna/Wien names, URLs and phone numbers.
- German: compound nouns and ≥40% expansion.
- French: accents, apostrophes and longer explanatory phrasing.
- Hungarian: double accents and suffix-heavy place expressions.

## QA later

Automated locale-key parity and accessibility lint; contrast token tests; screenshot matrices for four languages, both modes and 1×/2× text; TalkBack/VoiceOver traversal; keyboard pass; reduced-motion pass; RTL core prototype; small Android and large-device layouts. No screen passes on screenshots alone.
