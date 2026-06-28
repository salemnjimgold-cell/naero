# Naero Technical Debt

Last updated: 2026-06-28

## Critical Debt

No current critical debt remains from the initial audit after Sprint 1.

## High Priority Debt

- Firebase auth/firestore/storage files are stubs but the app structure implies backend behavior.
- Backend foundation has reproducible local/deployment scaffolding, but is not deployed to a real provider, has no real Supabase credentials, and has not applied migrations to a live project.
- Mobile auth still uses local guest sessions; email/OAuth Supabase auth is not wired yet.
- Exact location and AI profile data are stored in AsyncStorage without encryption.
- Privacy copy does not fully explain external API/provider data flows.
- Navigation does not appear to persist or respect onboarding/auth completion.
- Client Gemini is disabled until a secure backend AI proxy exists.
- Release signing now requires secure external configuration; production signing is not yet configured.
- `npm audit --omit=dev` reports 19 moderate upstream dependency advisories that require a breaking Expo/React Native upgrade path.

## Medium Priority Debt

- Backend uses dependency-light built-in HTTP for Sprint 2/3; before public exposure it still needs rate limiting and stronger schema validation. Request ids, basic structured logs, and optional monitoring hooks now exist.
- `syncEngine.js` uses an incorrect AsyncStorage require shape for sync timestamp persistence.
- "Background sync" is implemented as JS interval/AppState behavior, not OS-level background work.
- `AppContext` owns too many concerns.
- Lint has many warnings around unused imports and hook dependencies.

## Low Priority Debt

- Some strings appear to have encoding corruption.
- Local AI QA test duplicates logic instead of importing production modules.
- Some imports are out of order.
- Several unused variables/imports should be cleaned gradually.

## Debt Management Rule

Every new feature must either reduce this list or explicitly avoid making it worse. If a task introduces debt intentionally, document the reason and a removal plan.
