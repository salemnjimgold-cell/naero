# Naero Backend Database Migrations

## Migration Files

| File | Description | Sprint |
|------|-------------|--------|
| `001_core_auth_profiles.sql` | Auth, profiles, user_settings, consent_events, RLS | Sprint 2 |
| `002_core_data_tables.sql` | Places, reviews, reports, ai_conversations, ai_messages, saved_places, indexes, RLS | Sprint 3 Database Sprint 1 |
| `003_platform_foundation.sql` | Storage buckets, RLS, notifications, activity_logs, moderation_queue, moderation_actions, review moderation status, realtime publication, performance indexes, trgm indexes | Sprint 3.5 |

## Apply Migrations

1. Open the Supabase dashboard for the staging project.
2. Go to SQL Editor.
3. Run `backend/db/migrations/001_core_auth_profiles.sql`.
4. Confirm these tables exist:
   - `public.profiles`
   - `public.user_settings`
   - `public.consent_events`
5. Run `backend/db/migrations/002_core_data_tables.sql`.
6. Confirm these tables exist:
   - `public.places`
   - `public.reviews`
   - `public.reports`
   - `public.ai_conversations`
   - `public.ai_messages`
   - `public.saved_places`
7. Run `backend/db/migrations/003_platform_foundation.sql`.
8. Confirm these tables exist:
   - `public.notifications`
   - `public.activity_logs`
   - `public.moderation_queue`
   - `public.moderation_actions`
9. Confirm storage buckets exist:
   - `avatars`
   - `place-images`
   - `review-images`
   - `documents`
10. Enable Realtime in Supabase Dashboard for new tables.
11. Enable `pg_trgm` extension if not already enabled:
    ```sql
    create extension if not exists pg_trgm;
    ```
12. Apply seed data from `backend/db/seeds/001_sample_places.sql` (optional, for dev/staging).
13. Repeat for production only after staging smoke tests pass.

## Migration Order

Migrations must be applied sequentially. Migration 002 depends on the `set_updated_at()` function and `auth.users` reference established in 001. Migration 003 depends on tables from 002.

## Table Reference

### Migration 001 Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `public.profiles` | User profile data linked to auth.users | User-owned |
| `public.user_settings` | User preferences and opt-ins | User-owned |
| `public.consent_events` | Audit log of consent actions | User-owned |

### Migration 002 Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `public.places` | Places of interest, services, and locations | Public read, owner write |
| `public.reviews` | User reviews and ratings for places | Public read, owner write |
| `public.reports` | Content moderation reports (polymorphic) | Reporter read/write |
| `public.ai_conversations` | AI chat conversation sessions | Strict user isolation |
| `public.ai_messages` | Individual messages within AI conversations | Conversation-scoped |
| `public.saved_places` | User bookmarks and place collections | Strict user isolation |

### Migration 003 Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `public.notifications` | Push, in-app, and future email notifications | User read/update, service role insert |
| `public.activity_logs` | Audit trail for user and moderation actions | User read, service role insert |
| `public.moderation_queue` | Content moderation queue with flags and priority | Service role only |
| `public.moderation_actions` | Audit trail of moderation decisions | Service role only |

## Realtime Publication

Migration 003 adds the following tables to the `supabase_realtime` publication:

- `notifications` — real-time notification delivery
- `activity_logs` — live activity feed
- `moderation_queue` — live moderation dashboard updates
- `moderation_actions` — live action audit trail
- `reviews` — real-time review updates (for UI refresh)
- `saved_places` — real-time bookmark sync
- `ai_conversations` — real-time conversation updates (for AI chat)

Realtime must also be enabled per-table in the Supabase Dashboard → Database → Replication.

## Storage Buckets

Migration 003 creates 4 storage buckets:

| Bucket | Public | Max Size | Allowed Types |
|--------|--------|----------|---------------|
| `avatars` | Yes | 2 MB | JPEG, PNG, WebP |
| `place-images` | Yes | 5 MB | JPEG, PNG, WebP, AVIF |
| `review-images` | Yes | 5 MB | JPEG, PNG, WebP, AVIF |
| `documents` | No | 10 MB | PDF, DOC, DOCX, TXT |

Storage RLS policies enforce user isolation for avatars and documents (foldered by user ID), while place and review images are publicly readable and uploadable by any authenticated user.

## Index Policy

- All foreign key columns are indexed.
- Columns used in WHERE filters (city, category, status, rating, moderation_status) are indexed.
- Text array columns (tags) use GIN indexes.
- Text columns used in search (name, description) use pg_trgm GIN indexes.
- Composite indexes cover the most common query patterns.
- Partial indexes cover filtered queries (e.g., pending moderation items).
- Indexes are created with IF NOT EXISTS so they are safe to re-run.

## Review Moderation Workflow

Migration 003 adds moderation columns to the `reviews` table:

| Column | Type | Description |
|--------|------|-------------|
| `moderation_status` | `moderation_status` enum | pending → reviewed → approved/rejected/escalated |
| `moderated_by` | uuid (FK → auth.users) | Moderator who acted |
| `moderated_at` | timestamptz | When moderation occurred |
| `moderation_note` | text | Reason for moderation decision |

The `moderation_status` enum values are: `pending`, `reviewed`, `approved`, `rejected`, `escalated`.

## RLS Policy Summary

- **Public read**: places, reviews, avatars, place-images, review-images — anyone authenticated or anonymous can read.
- **User-owned**: ai_conversations, ai_messages, saved_places, notifications, activity_logs — strict user isolation via auth.uid().
- **Service role**: moderation_queue, moderation_actions, review moderation columns — only service role can manage.
- **Reporter-owned**: reports — users can read and update their own reports only.
- **Owner write**: places, reviews — the creating user can update/delete their records.
- **Storage user isolation**: avatars, documents — objects are folder-structured by user ID.
- **Messages**: ai_messages are immutable after creation (no update/delete policies); access is gated through conversation ownership.

## Rollback

Before alpha user data exists, rollback can be manual by dropping tables in reverse order:

```sql
drop table if exists public.moderation_actions cascade;
drop table if exists public.moderation_queue cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.notifications cascade;
drop table if exists public.saved_places cascade;
drop table if exists public.ai_messages cascade;
drop table if exists public.ai_conversations cascade;
drop table if exists public.reports cascade;
drop table if exists public.reviews cascade;
drop table if exists public.places cascade;
drop table if exists public.consent_events cascade;
drop table if exists public.user_settings cascade;
drop table if exists public.profiles cascade;

-- Remove added columns from reviews
alter table public.reviews drop column if exists moderation_status;
alter table public.reviews drop column if exists moderated_by;
alter table public.reviews drop column if exists moderated_at;
alter table public.reviews drop column if exists moderation_note;

-- Drop storage buckets (keeps objects, removes policies)
delete from storage.buckets where id in ('avatars', 'place-images', 'review-images', 'documents');

-- Drop custom enum
drop type if exists public.moderation_status;
```

After alpha user data exists, create explicit down migrations and take a Supabase backup before applying schema changes.

## Rule

Never apply production migrations before they pass in staging.
