# Platform Foundation Report (Sprint 3.5)

**Date**: 2026-06-29
**Goal**: Prepare Naero backend for large-scale production before AI Platform implementation.

---

## Summary

Implemented 7 platform foundation layers across the backend. All work is backend-only with no frontend changes. No AI code was introduced.

## Layer Overview

| Layer | Files | Status |
|-------|-------|--------|
| 1. Storage | Migration, service, routes, RLS policies | ✅ Complete |
| 2. Realtime | Migration (publication), event handler service | ✅ Complete |
| 3. Notifications | Migration (table), repository, routes | ✅ Complete |
| 4. Audit & Activity | Migration (table), repository, routes | ✅ Complete |
| 5. Moderation | Migration (tables + review columns), repository, routes | ✅ Complete |
| 6. Performance | Index migration, verification script, pagination helpers | ✅ Complete |
| 7. Documentation | MIGRATIONS.md update, this report | ✅ Complete |

---

## Layer Details

### 1. Storage Layer

**Migration**: `backend/db/migrations/003_platform_foundation.sql`

4 Supabase Storage buckets configured:

| Bucket | Public | Max Size | RLS |
|--------|--------|----------|-----|
| `avatars` | Yes | 2 MB | Public read, user-owned upload (foldered by userId) |
| `place-images` | Yes | 5 MB | Public read, authenticated upload |
| `review-images` | Yes | 5 MB | Public read, authenticated upload |
| `documents` | No | 10 MB | User-isolated (foldered by userId) |

**Service**: `backend/src/services/storageService.js`
- `upload()`, `download()`, `remove()`, `getPublicUrl()`
- `createSignedUrl()` / `createSignedUploadUrl()` for secure client uploads
- `list()` for bucket listing
- Path builders: `buildUserPath()`, `buildPlacePath()`, `buildReviewPath()`

**Routes**: `backend/src/routes/uploads.js`
- `POST /v1/uploads/signed-url` — generate signed upload URL
- `GET /v1/uploads/signed-url` — generate signed download URL
- `GET /v1/uploads/url` — get public URL
- `DELETE /v1/uploads` — remove object

### 2. Realtime Layer

**Migration**: Tables added to `supabase_realtime` publication:
- `notifications`, `activity_logs`, `moderation_queue`, `moderation_actions`, `reviews`, `saved_places`, `ai_conversations`

> Note: Realtime must also be enabled per-table in Supabase Dashboard → Database → Replication.

**Service**: `backend/src/services/realtimeService.js`
- `notifyUser()` — broadcast notification to user
- `notifyReviewChange()` — real-time review update events
- `notifySavedPlaceChange()` — real-time bookmark sync events
- `notifyAiConversationChange()` — real-time AI conversation events

### 3. Notifications Foundation

**Table**: `public.notifications`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `user_id` | uuid FK | Target user |
| `type` | text | Notification type |
| `title` | text | Notification title |
| `body` | text | Notification body |
| `data` | jsonb | Arbitrary payload data |
| `channel` | text | `in-app`, `push`, `email` |
| `status` | text | `pending`, `sent`, `failed`, `read` |
| `read_at` | timestamptz | When user read it |
| `sent_at` | timestamptz | When sent to channel |
| `delivered_at` | timestamptz | Delivery confirmation |
| `failed_at` | timestamptz | Failure timestamp |
| `failure_reason` | text | Error details |
| `metadata` | jsonb | Internal metadata |

**Repository**: `backend/src/services/repositories/notificationsRepository.js`
- `listByUser()`, `getUnreadCount()`, `getById()`
- `create()`, `createMany()` for bulk
- `markRead()`, `markAllRead()`, `markFailed()`

**Routes**: `backend/src/routes/notifications.js`
- `GET /v1/notifications` — list with pagination
- `GET /v1/notifications/unread-count` — unread count
- `GET /v1/notifications/:id` — get single
- `PUT /v1/notifications/:id` — mark read
- `PUT /v1/notifications/read-all` — mark all read

### 4. Audit & Activity

**Table**: `public.activity_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `user_id` | uuid FK | Actor (nullable — anonymous actions) |
| `activity_type` | text | Action type |
| `resource_type` | text | e.g. `profile`, `review`, `place` |
| `resource_id` | uuid | Target resource |
| `description` | text | Human-readable description |
| `metadata` | jsonb | Structured details |
| `ip_address` | inet | Request origin IP |
| `user_agent` | text | Client user agent |
| `created_at` | timestamptz | Immutable timestamp |

**Repository**: `backend/src/services/repositories/activityLogsRepository.js`
- `listByUser()`, `listByType()`, `getById()`
- `create()` — automatically called from profile updates in server.js
- `countByType()` for analytics
- 16 `ACTIVITY_TYPES` constants (login, logout, profile_update, review_*, report_*, moderation_action, etc.)

**Routes**: `backend/src/routes/activity.js`
- `GET /v1/activity` — user activity feed with pagination

**Integrated into server.js**: Profile updates (`PUT /v1/profile`) now automatically log to activity_logs.

### 5. Moderation Foundation

**Tables**:

`public.moderation_queue`:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `reportable_type` | text | Polymorphic type (`review`, `place`, `message`) |
| `reportable_id` | uuid | Target resource ID |
| `reason` | text | Flag reason |
| `description` | text | Detailed description |
| `status` | moderation_status | `pending`, `reviewed`, `approved`, `rejected`, `escalated` |
| `priority` | text | `low`, `normal`, `high`, `urgent` |
| `assigned_to` | uuid FK | Assigned moderator |
| `flagged_by` | uuid FK | Original reporter |
| `flags` | jsonb | Array of flag objects |
| `reviewed_by` | uuid FK | Reviewing moderator |
| `reviewed_at` | timestamptz | Review timestamp |
| `resolution` | text | Resolution notes |

`public.moderation_actions`:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `moderation_id` | uuid FK | Parent queue item |
| `action_type` | text | `flag`, `assign`, `review`, `approve`, `reject`, `escalate`, `dismiss`, `note` |
| `actioned_by` | uuid FK | Acting moderator |
| `reason` | text | Action reason |
| `details` | jsonb | Structured details |

**Review Moderation Columns** (added to `public.reviews`):
- `moderation_status` (enum: pending/reviewed/approved/rejected/escalated)
- `moderated_by`, `moderated_at`, `moderation_note`

**Repository**: `backend/src/services/repositories/moderationRepository.js`
- Queue: `list()`, `getById()`, `create()`, `updateStatus()`, `assign()`, `addFlag()`
- Actions: `listActions()`, `addAction()`
- Review helpers: `updateReviewStatus()`

**Routes**: `backend/src/routes/moderation.js`
- `GET /v1/moderation/queue` — list with filters
- `GET /v1/moderation/queue/:id` — get single
- `POST /v1/moderation/queue` — flag content
- `PUT /v1/moderation/queue/:id` — update status, assign moderator
- `GET /v1/moderation/queue/:id/actions` — action audit trail

### 6. Performance

**New Indexes** (in migration 003):

| Table | Index | Type |
|-------|-------|------|
| `reviews` | `idx_reviews_moderation` | Partial (WHERE moderation_status != 'approved') |
| `reviews` | `idx_reviews_moderated_by` | B-tree |
| `places` | `idx_places_name_trgm` | GIN (pg_trgm) |
| `places` | `idx_places_description_trgm` | GIN (pg_trgm) |
| `notifications` | 4 indexes | B-tree (user, user+status, user+created, type) |
| `activity_logs` | 5 indexes | B-tree (user, type, resource, created, user+created) |
| `moderation_queue` | 5 indexes | B-tree (status, priority, type, assigned, created) |
| `moderation_actions` | 2 indexes | B-tree (moderation_id, action_type) |

**Pagination Helpers**: `backend/src/http/pagination.js`
- `parsePagination(url)` — extracts `limit`, `offset`, `page`, `cursor`, `cursorField` from URL
- `buildOffsetResponse(data, total, params)` — standard offset pagination envelope
- `buildCursorResponse(data, params, encodeCursor?)` — cursor-based pagination envelope
- `encodeCursor(value)` / `decodeCursor(encoded)` — opaque cursor encoding (base64url)

**Index Verification Script**: `backend/scripts/verify-indexes.js`
- Checks existence of all 44 expected indexes across 8 tables
- Test harness for verifying migration completeness

### 7. Files Changed

**New Files** (12):

| File | Purpose |
|------|---------|
| `backend/db/migrations/003_platform_foundation.sql` | Storage, realtime, notifications, audit, moderation, indexes |
| `backend/src/services/storageService.js` | Supabase Storage abstraction |
| `backend/src/services/realtimeService.js` | Realtime broadcast service |
| `backend/src/services/repositories/notificationsRepository.js` | Notification CRUD |
| `backend/src/services/repositories/activityLogsRepository.js` | Activity log CRUD |
| `backend/src/services/repositories/moderationRepository.js` | Moderation queue + actions |
| `backend/src/http/pagination.js` | Offset + cursor pagination helpers |
| `backend/src/routes/uploads.js` | Upload API routes |
| `backend/src/routes/notifications.js` | Notification API routes |
| `backend/src/routes/activity.js` | Activity log API routes |
| `backend/src/routes/moderation.js` | Moderation API routes |
| `backend/scripts/verify-indexes.js` | Index verification test |

**Modified Files** (3):

| File | Change |
|------|--------|
| `backend/src/server.js` | Added storage service, realtime service, repositories, all new routes, activity logging on profile update |
| `backend/src/services/repositories/index.js` | Added notifications, activityLogs, moderation repositories |
| `backend/db/MIGRATIONS.md` | Full rewrite with migration 003 docs, storage, realtime, moderation workflow, rollback |

**Frontend Files Changed**: ✅ **None** — `src/` untouched.

---

## Verification

| Test | Command | Expected Result |
|------|---------|-----------------|
| Server starts | `node src/server.js` | Listens on port 8787 |
| Health endpoint | `GET /health` | `{"status":"ok"}` |
| Config endpoint | `GET /v1/config` | Service info without secrets |
| Pagination helpers | `require('./http/pagination')` | All exports present |
| createRepositories | `createRepositories(env)` | All 9 repositories returned |
| createStorageService | `createStorageService(env)` | All storage methods available |
| createRealtimeService | `createRealtimeService(env, repos)` | All notification methods available |

## Dependencies

- Requires Supabase project with Storage enabled
- Requires `pg_trgm` extension for trigram indexes:
  ```sql
  create extension if not exists pg_trgm;
  ```
- Realtime must be enabled per-table in Supabase Dashboard → Database → Replication
- Migration 003 must be applied via Supabase SQL Editor after migrations 001-002
- Storage buckets are created via SQL (not dashboard) — uses `on conflict do nothing` for idempotency

## Blockers / Caveats

- Realtime APIs require Supabase Management API key for programmatic table subscription; manual dashboard enablement may be needed.
- `moderation_status` is a PostgreSQL enum — cannot be modified without dropping. For new status values, add to the enum or use text type migration.
- `verify-indexes.js` cannot currently verify indexes via the REST-only backend (no direct SQL proxy). It serves as a documentation reference and manual checklist.

## Next Steps

1. Apply migration 003 to staging Supabase project via SQL Editor.
2. Enable `pg_trgm` extension.
3. Enable Realtime per-table in Dashboard → Database → Replication.
4. Verify storage buckets appear in Dashboard → Storage.
5. Run smoke tests from `scripts/smoke.js`.
6. Begin Sprint 4 (AI Platform Implementation).
