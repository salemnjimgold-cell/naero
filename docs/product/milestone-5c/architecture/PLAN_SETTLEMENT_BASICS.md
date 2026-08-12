# Plan — Settlement Basics

## Definition

Plan means **things I have chosen to understand or get done**. It is not an immigration-status tracker, universal checklist, score, streak or gamified completion system.

## Start flow

1. Explain Settlement Basics and its limits.
2. Confirm country/city context.
3. Let the user select goals; none are pre-completed or mandatory.
4. Ask eligibility/context questions only when a selected item requires them.
5. Preview selected items and source coverage.
6. User explicitly starts; guest plan is local, account plan may sync.

## Governed sections

- Know your area
- Essential services
- Transport and connectivity
- Healthcare access
- Documents/admin orientation
- Housing orientation
- Work orientation

Sections are containers, not prescribed sequences. Legal/residency flows remain separately governed future modules.

## Plan item anatomy

- User-facing outcome and “why it may matter”
- Applicability statement and editable assumptions
- Trust class, jurisdiction, source and freshness
- Plain-language explanation
- One primary supported action
- Supporting links/documents/places
- Ask Naero about this item
- `Mark complete`, `Not relevant`, `Save for later`; all reversible with history

Progress is `completed applicable items / active applicable items` and appears only after the user starts a plan. Skipped/not-relevant items are not failures. No deadline exists unless a verified source plus user-specific qualifying data supports it; initial release should avoid calculated legal deadlines.

## Context changes

Changing city or country does not silently rewrite the plan. Naero shows affected items, preserves prior completion/history, and asks whether to create a new jurisdiction version, archive the old plan or keep global items. Cross-jurisdiction content never merges without explicit provenance.

## Modes

- Guest: full local plan; clear statement that reinstall/device change may lose it; optional sign-in to sync.
- Authenticated: synchronized plan with conflict-safe updates.
- Location off: selected city/country is enough; no loss of non-proximity content.
- Offline: cached items show age; completion queues safely; external actions explain connectivity requirement.

## Conceptual data requirements

Plan template ID/version; country and jurisdiction scope; item ID/version; goal/section; applicability rules and questions; source references; trust/freshness; action definitions; dependency hints; language; user plan ID; selected/not-relevant/completed state; timestamps; user notes; sync version. Backend implementation is outside Part 2.
