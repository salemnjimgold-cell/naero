# Naero Today vs Target

## Naero Today

- Guest, email and configured OAuth entry.
- Secure persisted Supabase sessions and logout cleanup.
- English, Arabic, French and Hungarian resource files, with incomplete parity/RTL behavior.
- Foreground device location, manual city selection, location-off mode and stored-location clearing.
- Real nearby search through a backend gateway, multiple external providers, caching, attribution metadata and verified-service merging.
- Discover search/category UI and place/service detail structures.
- Local/backend AI conversation with intent routing, contextual inputs, RAG knowledge files, source badges and permissioned tools.
- Favorites, saved jobs, local preferences, sync state, authenticated notifications and realtime hooks.
- Jobs, community, services and safety experiences that are wholly or partly mock/local-data-backed.
- A concept-led Home whose personalization and progress are not backed by real state.

## Naero Target capability map

| Target capability | Classification | What is needed |
|---|---|---|
| Honest contextual Home | Needs UX work | Bind only real city, saved/recent state and supported recommendations; use explicit setup/empty states |
| Intent-first entry | Needs UX work | Short intent selection and resumable intent shortcuts |
| Guest-first value | Already supported / needs UX work | Expose value before auth; explain what requires an account |
| Foreground/manual location | Already supported / needs UX work | Clear purpose, active-use indicator, storage disclosure and easy switching |
| Trusted nearby discovery | Already supported / needs UX work | Source taxonomy, verified badges, freshness, location-off city search |
| Source-aware AI explanation | Already supported / needs UX work | Claims, dates, jurisdiction, confidence and “verify officially” behavior |
| Personal action plans | Needs backend work | Durable tasks, provenance, deadlines, completion and change history |
| Administrative guidance | Needs backend/content work | Jurisdiction-specific reviewed sources, update ownership and legal safety model |
| Saved knowledge and places | Already supported / needs UX work | Unified Library/My Naero and authenticated sync rules |
| Jobs marketplace | Needs backend work | Real listings, provenance, freshness, fraud controls and outbound application flow |
| Housing | Needs backend work | Real supply, verification, scam reporting and legal context; current service/model is insufficient |
| Practical community Q&A | Needs backend work | Durable posts/comments, moderation, identity/reputation and city/language scoping |
| Verified contributors | Needs new infrastructure | Eligibility, review workflow, audit trail and abuse response |
| Events/groups | Needs backend work | Structured entities, moderation, attendance/privacy choices |
| Proactive “what changed” alerts | Needs new infrastructure | Content versioning, notification preferences, jurisdiction subscriptions |
| Translation assistance | Needs UX/backend work | Explicit source/AI labeling, copy action and privacy boundaries |
| Offline essential pack | Needs new infrastructure | Content packaging, expiry, conflict rules and storage controls |
| Background location | Long-term | Separate consent, OS policy, strict minimization and clear benefit; not assumed |
| Nearby users | Long-term | Coarse/opt-in presence, abuse prevention and safety architecture; never precise coordinates |
| Cross-city life history | Long-term | Consent-based city transitions and portable plan model |

The target map is intentionally staged. A screen or data model in the repository does not make a capability production-real.
