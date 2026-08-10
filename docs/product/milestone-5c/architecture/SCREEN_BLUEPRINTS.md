# Screen Blueprints

Each blueprint lists: purpose; hierarchy; primary/secondary action; data/trust; guest/state behavior; accessibility/RTL.

1. **Splash** — Fast initialization and brand recognition; mark/name then progress/error fallback; no action unless retry; app readiness only; same for guests; announced once, no perpetual animation.
2. **Welcome** — State promise; concise benefits, Explore as guest, account option, language; primary guest; no personal data; retry for auth configuration separately; text reflows and order mirrors.
3. **Language** — Choose interface language with native names/scripts; list and continue; preference local; available to all; selected state announced, mixed scripts isolated.
4. **Guest/Auth choice** — Explain local versus synced continuity; guest primary, sign-in secondary; auth capability; no fear messaging; comparison reads as one accessible group.
5. **Authentication** — Sign in/create/reset; fields then provider options and legal links; submit; Supabase/provider state; recoverable errors; correct input semantics and RTL-safe icons.
6. **Location choice** — Explain benefit/privacy; device location, manual city, not now; foreground only; all modes equal; permission denial returns choices; purpose precedes OS prompt.
7. **City confirmation** — Confirm/correct country, Land and municipality; continue/change; geocode or selection source; external result label where applicable; searchable without account; names/addresses handle bidi.
8. **Intent selection** — Optional focus: help now/understand/find/do/settle/belong/explore; choose/skip; selection only; honest neutral Home if skipped; choice cards reflow.
9. **Home** — Orient and continue; Context, Help, Next, Ask, Useful, Continue; next action; real context and classified content; guest/local/offline variants per Home spec; semantic heading order.
10. **Discover** — Understand/navigate; context, search, intents, essentials, nearby/guides; search; provider/verified data; public guest access; list alternative to map.
11. **Search** — Find across typed content; query, scope, filters, grouped results; open result; trust per item; empty/error suggestions; accessible result counts.
12. **Category results** — Compare one practical domain; scope/filter/list-map; open result; provider/source metadata; no-results radius/city recovery; filter states announced.
13. **Place/service detail** — Decide and act; identity, trust, essential facts, source, actions, explanation; directions/call/official site; save/ask; missing facts explicit; guest local save; logical address layout.
14. **Source Sheet** — Inspect provenance; class definition, publisher, jurisdiction, dates, languages, AI/uncertainty, report; open original; complete metadata; missing date visible; modal focus/flexible height.
15. **Plan** — View user-chosen work; active plan, status, start choices, archived plans; resume/start; versioned governed content; local guest plan; honest empty setup; progress text not color-only.
16. **Settlement Basics** — Select/navigate goals; context, sections/items, source coverage; open item; governed template; guest/offline supported; no forced order; headings and state labels.
17. **Plan item detail** — Understand and act; applicability, explanation, source, action, Ask, status controls; supported action; classified sources; reversible completion; screen-reader status history.
18. **My Naero** — Context/continuity/control; context, activity, preferences, account, support; edit context; local/remote state; guest explanation; grouped semantic lists.
19. **Saved** — Retrieve chosen content; filters by place/guidance/plan, source/freshness; open; local/synced origin; honest empty; stale indicators labeled.
20. **Notifications** — Review meaningful updates; grouped unread/read with source and action; open/mark all; authenticated remote data; guest explains account need without blocking app; stable accessible actions.
21. **Settings** — Configure product; language, accessibility, location, AI, notifications, display; edit; preference state; hide unsupported rows; switch labels announce state.
22. **Privacy** — Understand/control data; location, AI context/history, local/synced data, export/delete; inspect/change; policy/account capabilities; guest local controls; destructive confirmation and focus.
23. **Ask Naero compact** — Resolve scoped question; context row, prompt, short answer/actions; ask; current content/sources; guest rate/capability stated; keyboard/screen-reader safe sheet.
24. **Ask Naero conversation** — Multi-turn help; context, transcript, composer, sources; send/cancel; AI/RAG; offline/error preserves draft; speaker/source regions and bidi content.
25. **AI contextual explanation** — Explain current item; source statement, assumptions, plain explanation, verify/action; open source; inherits only visible context; no-content/uncertainty fallback; heading/focus returns to origin.
26. **Safety/help access** — Reach verified urgent help without AI; emergency distinction, official contacts, location/country context, non-urgent resources; call/open official source; official content only for critical actions; guest/offline cached with freshness; 56 targets and no animation delay.
