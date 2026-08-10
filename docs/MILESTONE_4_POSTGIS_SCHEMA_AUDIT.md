# Milestone 4 — PostGIS Schema Audit

## Audit scope

Reviewed before migration creation:

- migrations `001` through `004`;
- all SQL seeds and database runbooks;
- public table declarations, indexes, triggers, functions, grants, and RLS policies;
- backend service-role REST client and repositories;
- mobile Supabase client and place/service models;
- all latitude, longitude, location, service, and place references.

This is a repository audit. The workspace has no authenticated production Supabase connection, so installed production extensions and migration history cannot be queried directly. The migration must therefore verify/create PostGIS idempotently.

## Existing relevant structures

### `public.places`

Migration `002_core_data_tables.sql` defines a user-generated `places` table with text category, separate `double precision` latitude/longitude, a boolean `verified`, source fields, metadata, and creator ownership.

Reusable:

- UUID convention and `public.set_updated_at()` trigger function;
- address/contact/opening-hours concepts;
- existing user bookmarks and reviews continue to reference this table.

Not safe for verified-service reuse:

- anonymous users can read every row regardless of active/verification/expiration state;
- any authenticated user can insert;
- owners can update/delete their own records;
- `verified` is only a boolean and has no reviewer, source evidence, expiry, or audit lifecycle;
- coordinates are nullable scalar columns with only a B-tree composite index;
- no geographic type, radius query, country-code constraint, status constraint, or `0,0` rejection;
- internal metadata and creator identity are available through broad row selection.

Changing this table into an official-only registry would break existing reviews, saved places, AI tools, and user-contribution behavior. It must remain separate.

### Existing service structures

There is no SQL `services` or service-category table. Mobile `Service` is an application model backed by the existing generic/mock data layer, not a production database schema. It cannot provide verification governance or spatial querying.

### Backend Supabase access

`backend/src/services/supabaseRest.js` and repositories use `SUPABASE_SERVICE_ROLE_KEY` only on the backend. This is appropriate for trusted administration but bypasses RLS and therefore must not be used to broaden mobile access.

The mobile client contains only the Supabase anonymous key. No service-role key is exposed.

### Existing RLS patterns

Migrations use explicit `ENABLE ROW LEVEL SECURITY`, drop/create policies, and `auth.uid()`/`auth.role()` checks. Several user-owned tables are scoped correctly. The existing `places` policy is intentionally broad and is unsafe for official verification data.

No existing admin-role table or claim convention exists. Milestone 4 therefore authorizes mutations only through the backend service role. No authenticated-user mutation policies will be created.

### Seeds

`backend/db/seeds/001_sample_places.sql` contains sample place records for local development. They target `public.places`, not the new verified registry, and must never be applied as verified production data.

The only allowed Milestone 4 production inserts are the 24 category-key definitions. No service listing is inserted.

## Conflict and compatibility decisions

1. Create `service_categories`, `verified_services`, `service_verification_log`, and `service_provider_links`; do not retrofit `public.places`.
2. Put PostGIS in Supabase’s conventional `extensions` schema and use `extensions.geography`.
3. Expose public-safe rows only through strict RLS and a security-invoker nearby RPC.
4. Revoke table mutation from `anon` and `authenticated`; service role retains Supabase’s privileged backend behavior.
5. Keep external Google/OSM providers active and add verified services as a complementary provider.
6. Do not create Place Details or an admin UI.

## Required migration

- create `extensions` schema and `postgis` extension if missing;
- create four new tables with constraints and timestamp triggers;
- create GiST and filtering indexes;
- enable/force RLS and add public-safe read policies only;
- revoke public mutation and internal-log access;
- create a bounded, public-safe `nearby_verified_services` RPC;
- grant RPC execution to `anon`, `authenticated`, and `service_role`;
- include a separate explicit rollback migration.

## Rollback risks

- Dropping the four tables and RPC is straightforward while they remain empty.
- Category rows are migration metadata and can be recreated.
- Dropping PostGIS is not safe by default because other Supabase workloads may depend on it. The rollback must not remove the extension automatically.
- If verified-service IDs become referenced later, rollback will require dependency review and data export first.
- Old application versions ignore the new tables, so application rollback is compatible.
