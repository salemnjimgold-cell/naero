# Current UX Audit

## Evidence reviewed

The audit covered `App.js`, the navigator and AppContext, every screen and shared component, all four locale files, theme tokens, auth/location/nearby/AI/data services, backend AI tools and knowledge sources, product/design documents, color studies, Home concepts, recovery reports, and the only archived runtime screenshot. The screenshot is effectively black and supplies no usable visual evidence; code and design artifacts are therefore the reliable sources.

## Product structure today

The app launches through Splash and Welcome, supports guest entry plus email and configured social auth, initializes foreground/manual/off location, and enters three tabs: **Home / World / People**. Profile, settings, notifications, AI, jobs, safety, and detail screens are stack destinations.

Genuinely supported foundations include secure Supabase auth persistence, guest mode, foreground/manual city selection, real nearby gateway queries, verified-service infrastructure, search/filtering, saved favorites/jobs, notifications, realtime hooks, local and backend-assisted AI, four locales, cache/sync infrastructure, and defensive empty/error components.

## Screen findings

| Surface | Current reality | UX finding |
|---|---|---|
| Splash/Welcome/Auth | Guest, email and configured OAuth paths exist | Guest is valuable, but language is not an explicit first decision and terms links appear non-functional |
| Location permission | Foreground request, manual city and skip are supported | Alternatives are strong; explanation is generic and does not state storage/sharing details |
| Home | Deep Sea composition with greeting, next step, progress, nearby, people and AI input | Nearly all meaningful Home content is hard-coded (`Ahmed`, Seattle, Week 3, 3/12, places, people). It promises a product that does not yet exist |
| Discover/World | Search, tabs/categories, real nearby place gateway, services and detail routes | Most credible everyday value, but sources and service/place authority are not consistently legible; service data can fall back to mocks |
| AI | Conversation, local intent routing, backend AI/RAG, source badges and context hooks | Strong technical base; currently still reads as a destination chatbot and needs explicit uncertainty/source behavior |
| Community | Post list/detail/comment UI | Mock-backed, creation/like/comment behavior is not durable; cannot yet support “people like you” claims |
| Profile | Guest/auth identity, saved counts, notifications, location controls, settings/about | Useful controls mixed with identity and feature links; it is closer to a settings drawer than a personal command center |
| Jobs | Browse, filter/save and detail over service abstraction | Current default data is mock-backed; no trustworthy application pipeline |
| Housing | Model/provider/service exist | No routed production screen; future capability, not a current product promise |
| Safety | Tips and emergency contacts via local/mock service | Useful structure, but source/date/country authority and real emergency validation need stronger treatment |
| Services | Browse/filter/detail screens and models exist | Not in the current navigator; data can be mock-backed |
| Notifications | Authenticated list, mark-read, read-all, delete and realtime plumbing | Functional foundation; authorization and contract are stabilized |
| Loading/empty/error | Shared components exist and several screens use them | Coverage and recovery actions are inconsistent; some screens show spinners rather than content-shaped states |

## Design generations

1. **Early feature MVP:** many cards, categories and standalone screens. Philosophy: prove breadth. Result: capability fragments without a unifying job.
2. **Premium AI Companion / visual identity studies:** dark, polished, AI-present, with gradients/orb/mascot explorations. Philosophy: make intelligence memorable. Risk: AI becomes the hero and warmth becomes decoration.
3. **Guided Compass:** warm darkness, cream type, emerald guidance, amber investment, restrained motion. Philosophy: calm professional companionship and a single next step. Strong emotional semantics; too prescriptive in rejecting blue and assumes journey data not yet supported.
4. **Implemented Deep Sea:** navy canvas, blue accent, cool near-white type, restrained borders, three-tab Home/World/People model. Philosophy: calm technical trust and scalable product polish. Strong foundation; visually familiar and emotionally cool.
5. **Current Home concept:** user-story hero, next step, progress, nearby and people. Philosophy: “your life, not the AI.” It is strategically strongest but implemented with fabricated content, which damages trust.

## Why it lacks soul

- **Emotional gap:** copy and surfaces say “companion,” but the app rarely recognizes a real, consented user context.
- **Product gap:** no durable newcomer task model turns information into progress.
- **Truth gap:** mock content is presented with the intimacy of live personalization.
- **Visual gap:** Deep Sea is coherent but resembles premium technology products generally; the meaning of colors and surfaces is weak.
- **Interaction gap:** many cards lead to content, but few interactions complete a real-world task or clearly record an outcome.
- **Personalization gap:** hard-coded personalization substitutes for actual preferences, location, saved items, and history.
- **Story gap:** the product has nouns (jobs, safety, services, people) but lacks a dependable arc from need to action to return.

## Accessibility and international audit

Four locale resources exist (English, Arabic, French, Hungarian), but `discover` keys are absent outside English and substantial screen copy is hard-coded in English. Arabic is loaded but the app does not establish a complete RTL strategy; many physical left/right margins remain. Current type sizes and touch handling are inconsistent, screen-reader metadata is incomplete, animated loops do not consistently honor reduced motion, and large-text layouts have not been designed as a system.

## Strategic conclusion

The current code provides credible foundations, especially location, nearby discovery, auth, AI orchestration, and verified services. The future product should reuse these foundations while refusing to surface unsupported personalization. Product truth—not a palette change—is the first design requirement.
