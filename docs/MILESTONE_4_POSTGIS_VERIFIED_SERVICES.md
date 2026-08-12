# Milestone 4 — Supabase + PostGIS Verified Data Layer

## Architecture

Milestone 4 adds Naero-owned verified services as a complementary first provider:

```text
/api/v1/nearby
  -> Naero verified-service adapter
      -> public-safe PostGIS RPC (anon key)
      -> optional backend-only provider-link lookup (service role)
  -> Google Places New
  -> OpenStreetMap Overpass
  -> normalize, deduplicate, verified-aware rank, cache
```

External provider behavior remains active. An empty verified table simply contributes no records.

## PostGIS

Migration `005_postgis_verified_services.sql` creates the `extensions` schema and runs:

```sql
create extension if not exists postgis with schema extensions;
```

Verification after deployment:

```sql
select extname, extnamespace::regnamespace
from pg_extension
where extname = 'postgis';
```

Expected schema: `extensions`. The explicit rollback retains PostGIS because dropping a shared extension can destroy or block unrelated dependent objects.

## Query decision

A reviewed Supabase RPC was chosen over dynamic SQL:

- fixed parameter types and hard radius/limit caps;
- PostGIS index-compatible `ST_DWithin`;
- server-calculated `ST_Distance`;
- explicit active/approved/unexpired filters;
- fixed public-safe output columns;
- no user-controlled SQL;
- service-role key is unnecessary for the public query.

The function is `SECURITY DEFINER` with a fixed search path because direct table grants are revoked. It re-applies every public visibility rule internally. Only its constrained execution is granted to public roles.

Provider links are fetched separately only by the backend service role. They are attached as non-enumerable internal deduplication evidence and never enter the API response.

## Indexes and constraints

- GiST: `verified_services.location`
- country/city, category, public-state/expiration, last-verified
- audit log service/time
- provider-link service and uniqueness
- category key/name, service name, country, state, confidence, source, location-origin, and expiry-order constraints

## RLS and grants

All four tables have RLS enabled and forced.

- categories: public read only when active;
- verified services: approved/active/unexpired row policy, but no direct public table grant;
- logs and provider links: no public policies or grants;
- no public/authenticated insert, update, or delete policy exists;
- trusted service-role backend administration remains the only mutation boundary.

## Cache and invalidation

Verified-provider cache TTL defaults to six hours and uses rounded coordinates/category/radius/language/limit without user identity. Combined Nearby cache remains five minutes.

After create, approve, reverify, expire, deactivate, or provider-link changes:

1. clear the provider cache in the affected backend process;
2. clear the combined Nearby cache;
3. in multi-instance production, publish a shared invalidation event.

Future Redis migration should preserve the existing cache interface and tag entries by verified-service/category/region for targeted invalidation.

## Production deployment

1. Back up and review current migration history.
2. Apply migrations `001`–`005` in order in staging.
3. Run extension/table/index/policy/RPC verification queries.
4. Execute anonymous and service-role policy tests against staging.
5. Confirm `verified_services` contains zero unexpected rows.
6. Configure backend Supabase URL, anonymous key, and service-role key.
7. Deploy backend and invalidate nearby caches.
8. Run controlled approved/draft/expired fixtures in a transaction or isolated test project, then remove them.

No production service fixture is included.

## Rollback

Use `backend/db/rollbacks/005_postgis_verified_services.rollback.sql` only after exporting any real records and checking dependencies. It drops the RPC and four Milestone 4 tables in dependency order but intentionally retains PostGIS.

Application rollback removes the verified provider from `nearbyService`; Google/Overpass continue unchanged.

## Known limitations

- The repository environment cannot query the production migration ledger or apply staging migrations automatically.
- No full admin UI, Place Details, or ingestion pipeline exists.
- Cache invalidation is process-local until shared infrastructure exists.
- Verification expiry is enforced at query time; a later scheduler may materialize the `expired` status.
