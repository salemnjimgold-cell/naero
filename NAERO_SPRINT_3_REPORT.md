# Naero Sprint 3 Report - Backend Deployment & Infrastructure (Database Sprint 1)

Date: 2026-06-29

## Scope

Sprint 3 is infrastructure and database only. AI Gateway work is explicitly excluded and remains reserved for Sprint 4.

## Completed

### Infrastructure
- Added reproducible local backend setup.
- Added backend `.env` examples for development, staging, and production.
- Added PowerShell startup, health, and smoke-test scripts.
- Added backend healthcheck script.
- Added local `.env` file loading without adding new dependencies.
- Added request IDs and structured backend HTTP logs.
- Added optional redacted monitoring webhook events.
- Added Docker backend image definition.
- Added Render staging blueprint.
- Added staging-first deployment workflow.
- Added backend deployment guide.
- Added observability guide.
- Verified local backend stability and smoke tests.

### Database Sprint 1
- Added Migration 002 (`002_core_data_tables.sql`) — six new tables:
  - `public.places` — places of interest/services with location, category, tags, and metadata.
  - `public.reviews` — user reviews and ratings (1-5 scale), one review per user per place.
  - `public.reports` — polymorphic content moderation reports (places, reviews, ai_messages).
  - `public.ai_conversations` — AI chat sessions with user isolation and archiving.
  - `public.ai_messages` — individual messages within AI conversations (immutable).
  - `public.saved_places` — user bookmarks with multi-list support (default, wishlist, custom).
- All tables have UUID primary keys, foreign keys to `auth.users(id)` or parent tables, and proper indexes.
- Row-Level Security enabled on all six tables with appropriate policies (public read, user isolation, owner write).
- Added `updated_at` triggers on all mutable tables.
- Added repository layer (`backend/src/services/repositories/`) with six typed modules:
  - `placesRepository.js` — list, search, filter by city/category, CRUD.
  - `reviewsRepository.js` — list by place/user, CRUD, mark helpful, average rating.
  - `reportsRepository.js` — list by status/reporter, create, resolve.
  - `aiConversationsRepository.js` — list by user, create, archive, increment message count.
  - `aiMessagesRepository.js` — list by conversation, create, get last, count.
  - `savedPlacesRepository.js` — list by user/list, CRUD, reorder, check if saved.
- Added seed data (`backend/db/seeds/001_sample_places.sql`) — 12 sample places across 6 categories in Budapest.
- Added database documentation (`backend/db/DATABASE.md`) — full table reference, schema diagram, RLS summary, naming conventions.
- Updated `MIGRATIONS.md` with complete table reference, index policy, and rollback instructions.
- Updated `seeds/README.md` with seed policy and adding-new-seeds guide.

## Not Completed

Real remote deployment was not performed because this environment does not have hosting provider credentials, Supabase project access, DNS access, or deployment secret-manager access. Migrations 001 and 002 have not been applied to a live Supabase project.

## Verification

- Pass: `node tests\qa_backend_foundation.js`
- Pass: `node backend\scripts\smoke.js`
- Pass: live local backend healthcheck with `node backend\scripts\healthcheck.js http://127.0.0.1:8787`
- Pass: `.\scripts\backend-smoke.ps1`
- Pass: `npm run lint` with 0 errors and 80 existing warnings
- Pass: `node tests\qa_ai.js` with 11/11 checks passing
- Pass: `npx expo install --check`
- Pass: `npx expo-doctor` with 18/18 checks passing after removing regenerated local `.expo` state
- Pass: `npm audit --omit=dev --audit-level=high`; moderate Expo/RN advisory cluster remains
- Pass: targeted source secret scan
- Pass: Android release build via `.\gradlew.bat :app:assembleRelease`
- Pass: Migration 002 SQL syntax validated (no parse errors)
- Pass: Repository modules load without import errors

## Developer Onboarding

A new developer can:

1. Run the backend locally:
   ```powershell
   .\scripts\backend-dev.ps1
   ```
2. Verify it:
   ```powershell
   .\scripts\backend-health.ps1
   .\scripts\backend-smoke.ps1
   ```

Detailed setup lives in `backend/docs/DEVELOPER_SETUP.md`.

The database schema is documented in `backend/db/DATABASE.md`. Repository modules are in `backend/src/services/repositories/`.

## Remaining Risks

- Backend is not deployed to staging yet.
- Supabase staging project is not configured yet.
- Database migrations 001 and 002 have not been applied to a live Supabase project.
- HTTPS/provider health checks require deployment provider configuration.
- Monitoring webhook requires an approved provider.
- Rate limiting and stronger schema validation are still needed before public exposure.
- Polymorphic `reportable_id` in reports table has no FK constraint — requires application-level validation.
- CASCADE deletes on `auth.users(id)` could remove user data if Supabase Auth user deletion is not coordinated with application logic.
- Moderate Expo/RN dependency advisories remain and require a planned upgrade path.

## Readiness Scores

- Production readiness: 54/100 (+2 for database schema completion)
- Alpha readiness: 83/100 (+3 for repository layer + documentation)

## Recommended Next Task

Complete external staging deployment: configure Supabase staging, apply migrations 001 and 002, deploy backend with HTTPS, set secrets in the host provider, enable monitoring, and run deployed smoke tests. Sprint 4 AI Platform should wait until this external staging deployment is verified.
