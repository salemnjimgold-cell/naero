# 3A RTL and Multilingual Foundations

`src/theme/rtl.js` provides logical edge, margin and padding helpers and a canonical icon-mirroring decision. Back/forward/chevron/undo/redo mirror; location, trust, check, media and brand symbols do not.

New components must use logical start/end intent, semantic reading order and script-aware text containers. Arabic text aligns with reading direction. Austrian names, URLs, phone numbers, official identifiers and mixed Arabic/German addresses use isolated spans/components rather than unsafe concatenated strings.

Design assumptions:

- German compounds may expand or wrap; no essential single-line truncation.
- French layouts allow at least 40% expansion.
- Hungarian double accents and full Unicode remain intact.
- Arabic shaping is delegated to mature system fonts and tested at 1×/2×.
- Phone/reference numbers retain source order; locale display numbers follow locale behavior.

Legacy physical-direction styles are inventory items, not silently mass-mirrored in 3A.
