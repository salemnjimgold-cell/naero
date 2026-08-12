# Milestone 4B — PostGIS Deployment Verification QA

## Gate result

**PASS in an isolated local environment.** Production was not modified. This gate found and corrected two real SQL execution defects before deployment:

1. An existing PostGIS extension in a schema other than `extensions` made schema-qualified geography types fail after partially creating earlier objects.
2. PL/pgSQL rejected the original duplicate input/output parameter names for latitude and longitude.

Migration 005 is now transactional, rejects incompatible PostGIS placement before creating Milestone 4 tables, uses `p_`-prefixed RPC inputs, explicitly grants backend management rights to `service_role`, and has a transactional rollback.

## Environment

- Host: Windows, Docker Desktop 4.79.0
- Database image: `postgis/postgis:16-3.4`
- PostgreSQL: 16.4
- PostGIS: 3.4.3
- Database: disposable local `naero_m4b_clean`, created from `template0`
- API role testing: PostgREST 12.2.12 with disposable HS256 JWTs for `anon`, `authenticated`, and `service_role`
- Network exposure: localhost only
- Production/staging Supabase projects: not contacted or modified

The database began with an unrelated `public.places` table containing one preservation marker. This made rollback preservation measurable.

## Migration behavior

| Check | Result |
|---|---|
| Clean migration | PASS |
| PostGIS schema | PASS — `extensions`, version 3.4.3 |
| First repeat execution | PASS — no duplicate category rows or objects |
| Further repeat after grant changes | PASS |
| Transaction boundary | PASS — `BEGIN`/`COMMIT` |
| Incompatible preinstalled PostGIS schema | PASS — `POSTGIS_SCHEMA_MISMATCH`, exit 3, zero Milestone 4 tables left |
| Destructive operations | PASS — migration contains no table/extension drops |
| Category seed | PASS — 24 taxonomy rows, zero service listings |

The expected tables, all with forced RLS, were:

- `public.service_categories`
- `public.verified_services`
- `public.service_verification_log`
- `public.service_provider_links`

`verified_services.location` was confirmed as `extensions.geography`, typmod `Point,4326`, non-null. All 33 expected columns, UUID foreign keys, defaults, timestamp trigger behavior, state/source/country/expiry/origin checks, provider-link uniqueness constraints, and cascade/restrict behavior were inspected in PostgreSQL.

Invalid origin `(0,0)`, lowercase country code, invalid lifecycle status, and an expiry preceding verification were all rejected by actual check constraints.

## Index verification

Verified indexes:

- `idx_verified_services_location_gist` — GiST on geography
- `idx_verified_services_country_city`
- `idx_verified_services_category`
- `idx_verified_services_public_state`
- `idx_verified_services_last_verified`
- `idx_service_verification_log_service_created`
- `idx_service_provider_links_service`
- provider-link uniqueness indexes and primary keys

## RPC

Verified signature:

```text
nearby_verified_services(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer,
  p_category_key text,
  p_filter_country_code text,
  p_result_limit integer,
  p_language text
)
```

It is `SECURITY DEFINER` with fixed `search_path=public, extensions`. Its returned table contains only public identifiers, normalized service/location fields, distance, verification metadata, attribution, and navigation URL. It does not return email, source evidence URL, actors, reviewer fields, notes, verification logs, or provider links.

The function deliberately bypasses direct table access but repeats every public visibility predicate internally. No mutation function exists, input validation is bounded, and execute rights are restricted to `anon`, `authenticated`, and `service_role`.

## RLS and role matrix

| Capability | Anonymous | Authenticated | Service role |
|---|---:|---:|---:|
| Execute public nearby RPC | PASS | PASS | PASS |
| Receive active, approved, unexpired service | PASS | PASS | PASS |
| Receive draft/rejected/expired/inactive service | DENIED | DENIED | Administrative table access only |
| Direct select from `verified_services` | DENIED | DENIED | ALLOWED |
| Insert/update/delete verified service | DENIED | DENIED | ALLOWED |
| Approve/deactivate service | DENIED | DENIED | ALLOWED |
| Read/write verification log | DENIED | DENIED | ALLOWED |
| Manage provider links | DENIED | DENIED | ALLOWED |
| Alter official source metadata | DENIED | DENIED | ALLOWED |

Actual direct-table attempts were rejected for both public roles. PostgREST JWT checks returned one safe RPC row while direct table/log requests returned 401 for anonymous and 403 for authenticated. The service JWT could read the inserted audit entry.

## Real geospatial results

Disposable fixtures were tested for Budapest, Győr, Vienna, and Tunis:

| City | Inside result | Outside result | Cross-city contamination |
|---|---:|---:|---:|
| Budapest | PASS — 75.35 m | Excluded | None |
| Győr | PASS — 75.07 m | Excluded | None |
| Vienna | PASS — 74.32 m | Excluded | None |
| Tunis | PASS — 89.24 m | Excluded | None |

Additional checks:

- nearest-first ordering: PASS
- distance returned in meters: PASS
- 999.9 m boundary-inside fixture: returned at 999.900 m
- 1000.1 m boundary-outside fixture: excluded
- category filter: PASS
- country filter: PASS
- active/approved/unexpired filters: PASS
- result limit: PASS
- empty database: honest zero rows
- invalid latitude, longitude, `(0,0)`, radius, limit, country, and language: rejected
- radius above 50,000 m: rejected

No fixture is present in a repository seed or production migration.

## Query plan

A disposable 20,000-row dataset was analyzed for a representative 5 km query with public-state and country filters and `LIMIT 20`.

Plan summary:

```text
Limit
  -> Index Scan using idx_verified_services_location_gist
       Index Cond: location && _st_expand(origin, 5000)
       Order By: location <-> origin
       Filter: active/status/verification/country/expiry/ST_DWithin
Planning Time: 2.646 ms
Execution Time: 8.237 ms
Buffers: shared hit=104
```

The GiST index was used. Radius bounding occurred before distance sorting, the KNN ordering used the spatial index, and no full-table scan occurred.

## Rollback and reapply

The transactional rollback succeeded. It removed:

- the nearby RPC;
- all four Milestone 4 tables;
- their policies, triggers, indexes, constraints, and test fixtures through object removal.

It preserved:

- `public.places` and its pre-migration marker;
- the PostGIS extension in `extensions`;
- unrelated schemas/functions.

Reapplying migration 005 after rollback succeeded and the RPC returned an honest empty result. A final rollback was then run; zero verified-service fixtures remain.

## Backend integration

The backend verified-services adapter was pointed at the disposable PostgREST environment through a temporary `/rest/v1` compatibility proxy.

| Check | Result |
|---|---|
| Provider health/configuration | PASS |
| Valid live RPC response | PASS |
| Verified metadata normalization | PASS |
| Backend-only provider-link lookup | PASS |
| Honest empty provider response | PASS |
| Malformed response normalization | PASS — automated regression |
| Timeout normalization | PASS — automated regression |
| Unavailable provider normalization/fallback | PASS — automated regression |
| Google/Overpass regression | PASS — 40/40 Nearby suite |
| Verified merge and field precedence | PASS |
| Materially closer external result retained | PASS |
| Raw database error hidden from mobile | PASS — gateway regression |

## Automated checks

| Check | Result |
|---|---|
| PostGIS migration/provider tests | PASS — 36/36 |
| Nearby tests | PASS — 40/40 |
| Gateway/mobile client | PASS — 16/16 + 3/3 |
| Backend foundation | PASS |
| Location | PASS — 7/7 |
| AI | PASS — 11/11 |
| Nearby/location type checks | PASS |
| Expo lint | PASS — 0 errors, 73 pre-existing warnings |

## APK clean-build evidence

All previous milestone APK copies were moved to `artifacts/pre-milestone4b`, and `android/app/build` was moved out before rebuilding. The Gradle `clean` task itself encountered a stale React Native CMake cache reference and produced no APK. With `android/app/build` still absent, `assembleRelease --rerun-tasks` rebuilt all 605 tasks successfully in 32m 28s.

- Source: `C:\Users\Dell\Desktop\Naero V2\android\app\build\outputs\apk\release\app-release.apk`
- Copied artifact: `C:\Users\Dell\Desktop\Naero V2\Naero-v1.2.0-milestone4-postgis-verified.apk`
- Size: 86,332,767 bytes
- Source modification time: `2026-07-26 17:42:21.177 +03:00`
- Copied modification time: `2026-07-26 17:42:21.177 +03:00`
- Source and copied SHA-256: `DEBBAAFF822B52065B3565D3CD19D519D627A905DD9BE7DBFD0025F66D92BB4F`
- Archived Milestone 3 SHA-256: `D02F0F0402E08D9D51B073B9B3FCD9D8BEA1583A09CAF9D9A2736A0412C4AAC5`
- Hashes differ: **YES**

The Milestone 3 and clean Milestone 4 JavaScript bundles are byte-identical (`92B7B33AE32CC3EFF965C7697F53D6939477C80758F24E28A3E1A3F4F084AF32`). This is expected: Milestone 4 changed backend/database code and did not change mobile production code. The APK-level difference comes from the genuine clean native/package rebuild, not an invented mobile change.

## Security and artifact scans

- service-role credential in mobile environment/APK: zero hits
- disposable database/JWT material in APK: zero hits
- recognized Google/OpenAI key patterns in APK core entries: zero hits
- direct Google/Overpass/Nominatim mobile endpoints: zero hits
- known demo services or M4B fixtures in mobile bundle: zero hits
- private verification fields in RPC shape: zero
- raw database errors exposed through gateway: no
- committed production service fixtures: none

## Exact staging/production deployment procedure

1. Take and verify a restorable database backup.
2. Confirm the target is staging. Production requires separate explicit approval.
3. Run:

   ```sql
   select extname, namespace.nspname
   from pg_extension extension_record
   join pg_namespace namespace on namespace.oid = extension_record.extnamespace
   where extname = 'postgis';
   ```

4. If PostGIS exists outside `extensions`, stop. Do not relocate or drop it automatically; assess dependencies and create a separately reviewed remediation.
5. Apply `backend/db/migrations/005_postgis_verified_services.sql` with stop-on-error enabled.
6. Verify extension, tables, columns, constraints, foreign keys, triggers, policies, grants, and indexes using the catalog checks summarized above.
7. Run anonymous, authenticated, and service-role tests with target-specific disposable records.
8. Run RPC city/radius/boundary/filter/input tests and `EXPLAIN (ANALYZE, BUFFERS)` against representative staging volume.
9. Delete all staging verification fixtures and confirm zero fixture rows.
10. Configure backend-only Supabase URL, anonymous key, and service-role key. Never place the service-role key in Expo/mobile configuration.
11. Run backend health, nearby, fallback, and error-normalization smoke tests.
12. Enable traffic only after the full gate passes.

## Exact production rollback procedure

1. Disable verified-provider traffic and drain active requests.
2. Take a second backup and record the migration time/version.
3. Confirm no later object depends on the four Milestone 4 tables or RPC.
4. Run `backend/db/rollbacks/005_postgis_verified_services.rollback.sql` with stop-on-error enabled.
5. Verify all four tables and the RPC are absent.
6. Verify `public.places` and unrelated tables remain present and row counts are unchanged.
7. Verify PostGIS remains installed; do not drop it.
8. Restore backend configuration/feature flag to the prior provider set and run Nearby smoke tests.
9. Restore from backup only if rollback validation fails or data outside Milestone 4 changed unexpectedly.

## Known limitations

- This was local PostgreSQL/PostGIS plus PostgREST, not a hosted Supabase staging project.
- Supabase platform-specific dashboard migration history and managed backup restore were not tested.
- Production-volume query plans may differ; staging `EXPLAIN` remains required before production.
- Docker images are third-party runtime dependencies and should be pinned by digest in CI if this gate is automated.

## Changed files

1. `backend/db/MIGRATIONS.md`
2. `backend/db/migrations/005_postgis_verified_services.sql`
3. `backend/db/rollbacks/005_postgis_verified_services.rollback.sql`
4. `backend/src/gateway/providers/verifiedServices.js`
5. `tests/postgis_verified_services.js`
6. `docs/MILESTONE_4_POSTGIS_VERIFIED_SERVICES_QA.md`
7. `docs/MILESTONE_4B_POSTGIS_DEPLOYMENT_QA.md`
8. `Naero-v1.2.0-milestone4-postgis-verified.apk`

No authentication, Facebook Login, Google Sign-In, mobile production, or later-milestone source files were changed.
