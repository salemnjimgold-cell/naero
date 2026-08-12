# 3D Discover Architecture

Discover is list-first and selected by `newDiscover`. The legacy `DiscoverScreen` remains the OFF path; `ContextualDiscoverScreen` is the ON path. A dedicated `DiscoverDetail` stack route provides progressive disclosure.

Audit disposition:

- KEEP: bounded `/api/v1/nearby` gateway, provider fallback, cache/stale policy, normalization, ranking, deduplication, location service, detail stack navigation, and 3B trust components.
- EVOLVE: context resolution, category hierarchy, search entry, result presentation, provenance mapping, conditional public actions, translated states, and detail presentation.
- REPLACE behind flag: only the product-facing Discover screen.
- RETIRE from the migrated path: mock service aggregation, rating-led cards, generic All/Places/Services filters, and fabricated-looking category presentation. No legacy code was deleted.

Discover does not redesign Home, Plan, My Naero, or the AI conversation.
