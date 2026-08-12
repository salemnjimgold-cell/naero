# Naero Sprint 3 Plan - Backend Deployment & Infrastructure (Database Sprint 1)

Date: 2026-06-29

## Status

In progress. Database schema implementation completed (Migration 002). Repository layer, seed data, and database documentation completed. External deployment pending provider, Supabase, DNS, and secret-manager access.

## Mission

Deploy the Sprint 2 backend foundation into reliable staging/production-style infrastructure **with a production-ready Supabase/PostgreSQL database** so Naero has a real, secret-managed backend boundary before AI platform work begins. Sprint 3 is infrastructure and database only — no AI platform work.

## Scope

### Infrastructure
- Done: Add reproducible local backend environment.
- Done: Add backend setup guide.
- Done: Add `.env` example files for development, staging, and production.
- Done: Add startup scripts.
- Done: Add database migration instructions.
- Done: Add seed-data policy.
- Done: Add health endpoint verification.
- Done: Add smoke-test instructions.
- Done: Add local development workflow.
- Done: Add staging-first deployment workflow.
- Done: Add structured logging and request IDs.
- Done: Add optional monitoring hooks.
- Pending external access: Deploy backend.
- Pending external access: Configure Supabase.
- Pending external access: Apply database migrations to live Supabase.
- Pending external access: Configure environment secrets in provider.
- Pending external access: Configure HTTPS and provider health checks.
- Pending external access: Verify deployed backend stability and smoke tests.

### Database (Sprint 3 Database Sprint 1)
- Done: Migration 001 — core auth, profiles, user_settings, consent_events (Sprint 2).
- Done: Migration 002 — places, reviews, reports, ai_conversations, ai_messages, saved_places with UUID PKs, foreign keys, indexes, and RLS.
- Done: PostgreSQL repository layer — six typed repository modules (places, reviews, reports, ai_conversations, ai_messages, saved_places).
- Done: Seed data — sample places across categories, sample reviews.
- Done: Database documentation — table docs, migration guide, index policy, RLS policy docs.
- Pending: Apply migrations to live Supabase staging project.
- Pending: Verify RLS policies against staging.

## Explicitly Out Of Scope

- AI Gateway implementation.
- AI provider integration.
- Prompt routing, redaction, model selection, or AI billing controls.
- New mobile product features unless required for backend smoke testing.
- Frontend modifications of any kind.

## Architecture Decision

Sprint 3 should treat infrastructure as its own release gate. The backend must be reachable over HTTPS, configured with environment-managed secrets, connected to Supabase (with the full database schema applied), and observable before any AI provider traffic is introduced.

This sequencing reduces security risk because AI keys, user prompts, consent enforcement, and usage metering should land on verified infrastructure with a proper database foundation, not on a local-only backend shell with mock data.

## Database Design Decisions

### Table Design
- All new tables use `uuid` primary keys (`gen_random_uuid()`) for security and portability.
- Foreign keys reference `auth.users(id)` for user-owned data and `public.places(id)` for place-related data.
- `ON DELETE CASCADE` ensures referential integrity without orphaned rows.
- `ai_conversations` and `ai_messages` are kept separate (not JSON columns) to support querying, pagination, and future analytics.
- `reviews` has a `UNIQUE(place_id, user_id)` constraint — one review per user per place.
- `saved_places` allows multiple lists per user — `UNIQUE(user_id, place_id, list_name)`.
- `reports` uses a polymorphic `reportable_type`/`reportable_id` pattern to support reporting any content type.

### Index Strategy
- Foreign key columns are always indexed (FK lookups are the most common query pattern).
- `places.city`, `places.category`, `places.tags` (GIN) are indexed for filtering/search.
- `reviews.rating`, `reports.status` are indexed for moderation workflows.
- Composite indexes on `ai_messages(conversation_id, created_at)` and `saved_places(user_id, list_name)` for common access patterns.

### Row-Level Security
- Public read tables: `places`, `reviews` — anyone can read approved/public content.
- User-owned tables: `ai_conversations`, `ai_messages`, `saved_places` — strict user isolation.
- Mixed-access tables: `reviews` (public read, owner write), `reports` (owner create/read, admin manage).
- `updated_at` triggers on all mutable tables for change tracking.

## Files And Modules Likely To Change

- `backend/`
- `backend/.env.example`
- `backend/docs/`
- `backend/db/migrations/`
  - `001_core_auth_profiles.sql` (existing)
  - `002_core_data_tables.sql` (new)
- `backend/db/seeds/` (new seed files)
- `backend/src/services/` (new repository modules)
- `backend/src/services/supabaseRest.js` (repository integration)
- `backend/src/server.js` (new route mounts)
- `backend/src/routes/` (new route handlers)
- `Dockerfile.backend`
- `deploy/render/render.yaml`
- `deploy/staging/README.md`
- `scripts/backend-dev.ps1`
- `scripts/backend-health.ps1`
- `scripts/backend-smoke.ps1`
- Root documentation files:
  - `NAERO_MASTER_ROADMAP.md`
  - `NAERO_ARCHITECTURE.md`
  - `NAERO_SECURITY.md`
  - `NAERO_TECH_DEBT.md`
  - `NAERO_BACKLOG.md`
  - `NAERO_CHANGELOG.md`

## Risks

- Secrets could be misconfigured or accidentally committed.
- Supabase RLS policies could be applied incorrectly, leaking data or blocking legitimate access.
- Staging and production environment drift could create confusing test results.
- Logging or monitoring hooks could expose sensitive request data if not redacted.
- Infrastructure provider choice can create future migration cost.
- CASCADE deletes on `auth.users(id)` could remove user data unintentionally if Supabase Auth user deletion is not coordinated.
- Polymorphic `reportable_id` in `reports` table has no FK constraint — requires application-level validation.

## Complexity Estimate

M to L, depending on selected hosting provider and whether DNS/HTTPS/project access is already available. Database Sprint 1 (schema + repo + seeds) is estimated at S-M complexity.

## Rollback Strategy

- Keep mobile app remote API disabled unless `EXPO_PUBLIC_NAERO_API_URL` is intentionally configured.
- Preserve the local backend smoke test path.
- If deployment fails, revert environment URL changes and keep Sprint 2 local foundation as the source of truth.
- Database rollback: drop Migration 002 tables if no alpha data exists; create explicit down migrations once user data is present.
- Repository layer can be reverted to pre-Sprint-3 state if integration issues are found.

## Verification Plan

- Local backend `/health` responds.
- Local smoke tests pass.
- Backend `/health` responds over HTTPS after staging deploy.
- `/v1/config` reports expected environment status without exposing secrets.
- Protected profile route rejects unauthenticated requests.
- Supabase migrations (001 + 002) apply successfully.
- All six new tables exist with correct columns, types, defaults, and constraints.
- All FK constraints are in place (places → auth.users, reviews → places+auth.users, etc.).
- RLS policies are enabled on all new tables and block unauthenticated writes.
- Seed data can be applied and queried successfully.
- Repository layer CRUD operations return correct results.
- Backend smoke tests pass against the deployed URL.
- Logs are structured and redacted.
- Monitoring hook receives health/error events without PII.

## Success Criteria

- Done locally: backend starts from a reproducible developer workflow.
- Done locally: health checks and smoke tests pass.
- Done locally: structured logging and optional monitoring hooks exist.
- Done locally: environment examples, migration instructions, seed policy, and staging deployment workflow exist.
- Done locally: all six database tables (places, reviews, reports, ai_conversations, ai_messages, saved_places) exist with UUID PKs, FKs, indexes, and RLS.
- Done locally: repository layer returns correct results for standard CRUD paths.
- Done locally: seed data can be applied and verified.
- Pending externally: deployed backend is stable enough for internal alpha testing.
- Pending externally: Supabase is configured with all migrations applied.
- Pending externally: secrets are managed outside source control in the deployment provider.
- Pending externally: HTTPS, provider health checks, and monitoring hooks are active.
- Pending externally: smoke tests pass against the deployed environment.
- AI Gateway remains unimplemented until Sprint 4.
