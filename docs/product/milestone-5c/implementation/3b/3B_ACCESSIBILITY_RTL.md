# 3B Accessibility and RTL

- Trust and freshness expose localized screen-reader semantics and never rely on color.
- Interactive source/state actions use the 3A minimum 44 target; preferred primary actions use 48.
- Text can wrap and inherits enabled font scaling; components avoid fixed text heights.
- Source Sheet uses header-first logical order, explicit close/link/button roles and a scrollable content body.
- Skeleton shapes are hidden while their section announces loading once.
- Error/status updates use polite live regions.
- Badge, summary and jurisdiction rows reverse under RTL; universal trust, status, location and external-link icons are not mirrored.
- Arabic/German publisher names and dates remain independent text fields, reducing bidirectional corruption.
- Reduced-motion behavior is static by design: no shimmer or decorative animation is present.

Focused tests verify semantic props, touch-target foundation, icon+label structure, Arabic native-script resources and locale key parity.
