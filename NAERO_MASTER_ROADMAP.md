# Naero Master Roadmap

Last updated: 2026-06-28

## Product North Star

Naero should become a privacy-conscious AI integration platform for foreigners, newcomers, migrants, and people living in a new country. The core promise is: "Not a stranger anymore."

## Engineering Priorities

1. Stability
2. Security
3. Performance
4. Scalability
5. User Experience
6. AI Intelligence
7. Production Readiness

## Phase 0: Stabilize the Current Prototype

Status: Mostly complete for internal alpha

Goals:

- Fix known runtime crashes.
- Remove exposed secrets and unsafe signing setup.
- Make current build, lint, and QA checks reliable.
- Document current architecture and technical debt.

Priority tasks:

- Done: Fix `src/screens/ServicesScreen.js` missing `useApp` import.
- Done: Remove hardcoded Gemini API key from client code.
- Done: Remove release keystore/passwords from source control.
- Done: Remove sensitive AI/profile/location logs from AI modules.
- Done: Clean Android manifest permissions.
- Done: Normalize version numbers to `1.1.3`.
- Done: Re-run lint, AI QA, Expo checks, and Android release build.
- Remaining: Rotate any previously exposed external credentials outside this repository.
- Remaining: Run manual device/emulator alpha navigation pass.

## Phase 1: Production Foundation

Status: In progress

Goals:

- Define real backend boundaries.
- Separate prototype mock data from production data.
- Establish CI and release discipline.

Priority tasks:

- Done: Decide production auth/profile model: guest-first mobile UX with Supabase-backed accounts and backend-owned secrets.
- Done: Add backend foundation for health/config/profile route shell.
- Done: Add Supabase profile/settings/consent schema with RLS policies.
- Done: Add unified mobile API client and local auth/profile service seams.
- Remaining: Deploy backend foundation to a real environment.
- Remaining: Apply Supabase migration and configure Supabase Auth providers.
- Remaining: Add backend proxy boundary for AI calls in Sprint 4, after infrastructure is deployed.
- Remaining: Replace Firebase stubs with completed backend integration or remove misleading modules.
- Remaining: Add environment configuration for dev/staging/prod.
- Add CI gates for lint, tests, Expo doctor, dependency check, and Android build.
- Clean generated APK/build artifacts from repository.

## Phase 2: Privacy-First Intelligence

Status: Planned

Goals:

- Make AI useful without exposing users.
- Make location features accurate, explainable, and battery-aware.

Priority tasks:

- Add explicit consent for AI personalization and external provider use.
- Redact sensitive data before AI requests.
- Implement approximate-location mode.
- Add user controls for deleting profile, chat memory, and saved location.
- Add AI response safety guidance for legal, immigration, medical, and safety topics.

## Phase 3: Real Data and Community

Status: Planned

Goals:

- Move beyond static mock data.
- Build trustworthy community features with moderation.

Priority tasks:

- Implement real community posts, comments, reporting, blocking, and moderation.
- Add verified local services and city guide data.
- Add job/housing data ingestion with clear source labels.
- Add admin/moderation tooling before scaling public community content.

## Phase 4: Real-Time and Nearby Features

Status: Planned

Goals:

- Add real-time/location-based features only after security and privacy foundations are ready.

Priority tasks:

- Write threat model for nearby users and location sharing.
- Add push notifications with granular consent.
- Add event/location alerts with strict battery limits.
- Consider nearby people only with opt-in, coarse location, blocking, reporting, and anti-abuse controls.

## Phase 5: Multi-Country Platform

Status: Planned

Goals:

- Generalize Naero beyond a Hungary/Budapest prototype.

Priority tasks:

- Add country/city content packs.
- Localize onboarding, AI prompts, and legal/safety disclaimers.
- Add verified partner/service directories per region.
- Add scalable backend search and ranking.

## Current Release Gate

Naero must not be treated as public-production-ready until:

- No client secrets are present.
- Release signing credentials are secured.
- Lint has zero errors.
- Android release build passes.
- Privacy copy matches actual data flows.
- Auth/data backend strategy is intentionally defined.
- AI data transfer has explicit user consent and server-side controls.

## Sprint 2 Core Platform Backend

Status: Steps 1-4 implemented; AI gateway intentionally postponed pending approval.

Completed:

- Backend scaffold with health/config/profile route shell.
- Supabase foundation schema and RLS model.
- Auth strategy and fail-closed JWT verification primitives.
- Unified mobile API/auth/profile client layer.

Remaining:

- Deploy backend.
- Configure Supabase project secrets outside source control.
- Run database migration in Supabase.
- Wire real mobile auth after credentials are available.

## Sprint 3 Backend Deployment & Infrastructure

Status: Repository-side implementation complete; real remote deployment pending provider, Supabase, DNS, and secret-manager access. AI Gateway explicitly excluded.

Mission:

Deploy the Sprint 2 backend foundation into reliable staging/production-style infrastructure so Naero has a real, secret-managed backend boundary before AI platform work begins.

Scope:

- Done: Add reproducible local backend developer setup.
- Done: Add development/staging/production env examples.
- Done: Add backend startup, healthcheck, and smoke-test scripts.
- Done: Add database migration instructions.
- Done: Add seed-data policy.
- Done: Add Docker backend definition and Render staging blueprint.
- Done: Add staging-first deployment workflow.
- Done: Add structured request logging and request IDs.
- Done: Add optional redacted monitoring webhook hooks.
- Done: Verify local backend health and smoke tests.
- Pending external access: Deploy backend to staging.
- Pending external access: Configure Supabase project.
- Pending external access: Apply database migrations to live Supabase.
- Pending external access: Configure environment secrets in provider.
- Pending external access: Configure HTTPS and health checks in provider.
- Pending external access: Verify deployed backend stability and smoke tests.

Out of scope:

- AI Gateway implementation.
- AI provider integration.
- Prompt routing, redaction, model selection, or AI billing controls.
- New mobile product features unless required for backend smoke testing.

Success criteria:

- Done locally: backend can run from a reproducible developer workflow.
- Done locally: health checks and smoke tests pass.
- Done locally: logs are structured and do not expose sensitive values in tested paths.
- Done locally: staging/production environment separation is documented.
- Pending externally: backend is reachable over HTTPS in the approved environment.
- Pending externally: Supabase project is configured without committing secrets.
- Pending externally: database migrations are applied and RLS is enabled.
- Pending externally: health checks and smoke tests pass against deployed staging.

## Sprint 4 AI Platform

Status: Planned after Sprint 3 infrastructure is verified.

Mission:

Build Naero's secure AI platform on top of the deployed backend boundary.

Planned scope:

- AI Gateway/proxy.
- Server-side provider secret handling.
- Prompt/input redaction.
- AI consent enforcement.
- Rate limiting and abuse prevention.
- AI observability without sensitive logs.
- Mobile AI client integration with safe local fallback.

## CTO Backlog Rule

All improvement ideas must be captured in `NAERO_BACKLOG.md` and categorized as Critical, High Priority, Medium Priority, Low Priority, or Nice to Have. After each completed sprint, the next highest-value task should be recommended from that backlog.
