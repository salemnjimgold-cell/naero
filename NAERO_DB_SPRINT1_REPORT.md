# Database Sprint 1 — Deployment Report

**Date**: 2026-06-29  
**Target**: Supabase staging project (production URL redacted from report)  
**Connection**: Supabase connection pooler (transaction mode)

---

## Migrations Applied

| Migration | Status | Notes |
|-----------|--------|-------|
| `001_core_auth_profiles.sql` | ✅ Applied | profiles, user_settings, consent_events + RLS + triggers |
| `002_core_data_tables.sql` | ✅ Applied | places, reviews, reports, ai_conversations, ai_messages, saved_places + indexes + RLS + triggers |
| `001_sample_places.sql` (seed) | ✅ Applied | 12 sample places across 6 categories |

## Tables Created

| Table | PK Type | FKs | RLS | Rows |
|-------|---------|-----|-----|------|
| `profiles` | uuid (FK → auth.users) | 1 | ✅ Enabled | 0 |
| `user_settings` | uuid (FK → auth.users) | 1 | ✅ Enabled | 0 |
| `consent_events` | uuid (auto) | 1 (auth.users) | ✅ Enabled | 0 |
| `places` | uuid (auto) | 1 (auth.users: created_by) | ✅ Enabled | **12** |
| `reviews` | uuid (auto) | 2 (places + auth.users) | ✅ Enabled | 0 |
| `reports` | uuid (auto) | 2 (auth.users: reporter + resolver) | ✅ Enabled | 0 |
| `ai_conversations` | uuid (auto) | 1 (auth.users) | ✅ Enabled | 0 |
| `ai_messages` | uuid (auto) | 1 (ai_conversations) | ✅ Enabled | 0 |
| `saved_places` | uuid (auto) | 2 (auth.users + places) | ✅ Enabled | 0 |

## Indexes

| Table | Indexes | Coverage |
|-------|---------|----------|
| places | 9 (including pkey) | city, category, tags (GIN), verified, source, created_by, (lat,lng), (city,category) |
| reviews | 7 (including pkey + unique constraint) | place_id, user_id, rating, created_at, (place_id,rating) |
| reports | 5 (including pkey) | status, reporter_id, (type,target), resolved_by |
| ai_conversations | 4 (including pkey) | user_id, created_at, (user_id,is_archived) |
| ai_messages | 4 (including pkey) | conversation_id, (conv,created_at), role |
| saved_places | 6 (including pkey + unique constraint) | user_id, place_id, (user_id,list_name), (user_id,list_name,sort_order) |

**Total**: 35 indexes across all Sprint 2 + Sprint 3 tables.

## Triggers

| Table | Trigger | Event |
|-------|---------|-------|
| profiles | `profiles_set_updated_at` | BEFORE UPDATE |
| user_settings | `user_settings_set_updated_at` | BEFORE UPDATE |
| places | `places_set_updated_at` | BEFORE UPDATE |
| reviews | `reviews_set_updated_at` | BEFORE UPDATE |
| reports | `reports_set_updated_at` | BEFORE UPDATE |
| ai_conversations | `ai_conversations_set_updated_at` | BEFORE UPDATE |
| saved_places | `saved_places_set_updated_at` | BEFORE UPDATE |

## Seed Data

| Category | Count | Examples |
|----------|-------|---------|
| government | 4 | Gov Office, NAV, OEP, State Treasury |
| education | 2 | Metropolitan University, Language School |
| healthcare | 1 | Buda International Medical Center |
| services | 2 | Post Office, Job Center |
| community | 1 | Expats Community Center |
| shopping | 2 | Lidl, Tesco Express |

**Total seed rows**: 12 places (reviews are commented out — require real auth.users)

## Errors Encountered

1. **DATABASE_URL password format** — The `.env.production` DATABASE_URL had extraneous characters that caused the `pg` URL parser to misinterpret the credentials. Fixed to match actual connection syntax.

## Verification Results

| Check | Result |
|-------|--------|
| All 9 expected tables present | ✅ |
| RLS enabled on all Sprint 3 tables | ✅ (6/6) |
| Indexes match migration spec | ✅ (35 total) |
| Triggers match migration spec | ✅ (7 total) |
| Seed data inserted correctly | ✅ (12 places, 6 categories) |
| Backend QA tests pass | ✅ |
| Supabase REST API accessible for all 6 Sprint 3 tables | ✅ |
| `npx eslint backend/src/` | ⚠️ 6 pre-existing Node.js global errors (unrelated) |

## Cleanup

- Temporary `pg` npm module uninstalled after migration.
- Credential-carrying migration scripts deleted.
- No secrets exposed in this report.

## Next Steps

1. Fix the DATABASE_URL brackets in `.env.production` to match actual connection syntax.
2. Configure Supabase Auth providers (email/OAuth) to enable real user sign-up.
3. Wire mobile auth to Supabase using the configured anon key and JWT secret.
4. Proceed to Sprint 4 (AI Platform) after staging deployment verification.
