# Deep Sea Migration Plan

## Strategy

Incremental replacement behind stable routes/services; no rewrite and no simultaneous data/visual migration. Every phase is releasable and rollbackable.

1. **Truth baseline:** remove/gate fabricated Home data before visual redesign; inventory hard-coded English and mock-backed prominence.
2. **Foundations:** add semantic mode-aware tokens, dynamic type, logical spacing and compatibility aliases.
3. **Trust/state primitives:** implement badges, source/freshness, jurisdiction and complete state components with tests.
4. **Navigation shell:** introduce four-tab shell behind a feature flag while preserving route adapters/deep links.
5. **Onboarding/context:** language, guest/account, location choice, city confirmation and optional intent.
6. **Discover/detail:** migrate the strongest real capability first; add provenance and list/map parity.
7. **Home:** compose only proven context/data modules after their contracts exist.
8. **My Naero:** consolidate Profile/Settings/Saved/Privacy and guest/account behavior.
9. **Plan:** introduce conceptual data contract, then local governed Austria Settlement Basics pilot; backend sync separately.
10. **Ask Naero:** global compact/contextual surfaces, then full conversation upgrade.
11. **Secondary screens:** notifications, safety, jobs/housing gates, support/about.
12. **Accessibility/RTL/visual QA:** continuous in every slice, with final cross-surface audit—not postponed remediation.

## Dependency rationale

Trust/state components precede screens; Discover proves content contracts before Home recommends them; context precedes Plan; My Naero establishes ownership/control before richer remembering; AI consumes established context and provenance rather than inventing parallel structures.

Rollback uses feature flags and route/component adapters. Existing service/API contracts remain unchanged until a separately accepted data milestone. Old tokens are removed only after repository-wide consumer migration and visual regression approval.
