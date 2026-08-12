# Proposed Part 3 Implementation Slices

No slice is authorized by this document.

## 5C Part 3A — Truth and foundations

Scope: remove/gate fabricated Home presentation; semantic tokens, modes, dynamic type, logical layout adapters. Acceptance: no fake user facts; current flows pass; token contrast tests; Arabic smoke. Tests: lint/type/core/security, token/unit/screenshot. Rollback: compatibility theme exports and Home feature flag.

## 5C Part 3B — Trust and state system

Scope: TrustBadge, SourceSummary/Sheet, freshness/jurisdiction, loading/empty/error/offline/permission states. Acceptance: five classes structurally distinct and screen-reader legible. Tests: component states, missing metadata, 200%/RTL. Rollback: isolated component package.

## 5C Part 3C — Navigation and onboarding context

Scope: four-tab flag, language, guest/account, location/manual city, confirmation, intent. Acceptance: deep-link/back preservation; guest and location-off value; no early permission. Tests: navigation/state matrix and auth/location regression. Rollback: switch to existing navigator.

## 5C Part 3D — Discover and details

Scope: intent categories, search, list/map, typed results and provenance-aware details. Acceptance: real data only, honest missing fields, source parity, map alternative. Tests: provider/API contracts, stale/offline, Arabic/200%. Rollback: route adapters to current Discover.

## 5C Part 3E — Contextual Home

Scope: finite six-module Home using approved data contracts. Acceptance: all state combinations; no fabricated modules; Help now ≤2 interactions. Tests: module eligibility/reason tests, snapshot/state/accessibility. Rollback: Home feature flag.

## 5C Part 3F — My Naero

Scope: context, Saved, preferences, privacy, account/security and notification entry. Acceptance: guest/local versus sync is explicit; logout/security unchanged. Tests: auth storage, data clearing, settings/a11y/RTL. Rollback: retain Profile/Settings routes.

## 5C Part 3G — Austria Settlement Basics pilot

Scope: approved governed content pack and local user-started Plan; no legal-status engine. Acceptance: versioned sources, applicability, reversible completion, context change handling. Tests: content schema/governance, progress truth, guest/offline. Rollback: disable Plan destination/show Saved.

## 5C Part 3H — Ask Naero surfaces

Scope: compact/global/context controls, sourced answers and structured actions. Acceptance: visible/excludable context; uncertainty rules; no sensitive silent action. Tests: prompt/context leakage, trust composition, AI errors/offline/a11y. Rollback: retain existing AI route.

## 5C Part 3I — Secondary surfaces and release QA

Scope: safety, notifications, support; complete locale parity, RTL, modes and device matrix. Acceptance: all quality gates and security regression pass. Tests: full Milestone 5B regression plus product acceptance suite. Rollback: per-route feature flags.

## Universal quality gate

Every slice requires no fabricated data; trust classification; loading/empty/error/offline as relevant; guest/manual/off location; Arabic RTL; 200% text; labels/focus; no hard-coded English; no security or API regression; documented rollback.
