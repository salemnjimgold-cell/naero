# Contextual Compass UX Architecture

## Product loop

| Stage | Product behavior | Required evidence | Output |
|---|---|---|---|
| Orient | Establish selected country, jurisdiction/city, location mode, language and immediate intent | User selection, permission state, device result or stored preference | A visible, editable context—not an inference presented as fact |
| Explain | Translate unfamiliar concepts into plain language while separating authority and uncertainty | Classified sources, jurisdiction, freshness, language and assumptions | Short explanation with source summary and optional detail |
| Act | Offer the smallest legitimate next action | Capability-supported action and eligibility/context constraints | Call, directions, official link, save, user-started task, document note or appointment link when supported |
| Remember | Preserve only continuity the user created or consented to | Explicit save/start/complete action or stated preference | City/language, saved content, user-started plans, completion, preferences and useful recent activity |

Naero never infers arrival date, legal status, deadlines, tasks, progress or social proximity. Recommendations must expose their reason: selected intent, selected city, current foreground location, saved item, started plan, or verified content update.

## Experience principles

1. Context is always visible and editable.
2. One dominant action per screen.
3. Consequential information exposes authority before persuasion.
4. Conversation resolves ambiguity; structured UI completes actions.
5. Guest and location-off modes remain useful.
6. Progress equals explicit user action only.
7. Sparse data produces honest setup or empty states.
8. Austria is configured content, never embedded product logic.

## Current implementation disposition

- **Reuse:** secure auth/session, guest mode, foreground/manual location, nearby gateway, provider normalization, verified-services model, notifications, caching/sync, AI gateway/RAG/tools, saved-state concepts.
- **Evolve:** theme primitives, Button/Card/Text/state components, Discover, AI conversation, detail screens, Settings and Notifications.
- **Replace:** hard-coded Home content and feature-centric hierarchy.
- **Create:** Plan domain, jurisdiction context, trust/provenance components, Context Header, Source Sheet, My Naero information architecture and global Ask Naero interaction shell.

## Global behavioral contracts

- The current context tuple is `{country, subdivision?, municipality?, locationMode, language}`; every element may be unknown.
- Context-dependent modules declare prerequisites and render a remedy when unmet.
- Every content item declares `trustClass`, jurisdiction scope, source identity and freshness state.
- Every AI request shows and permits editing of the context it will use.
- Every remembered item records its origin and whether it is local guest state or account-synced state.
- Safety and privacy routes are reachable without AI.
