# Milestone 4 — PostGIS Verified Services QA

## Results

| Check | Result |
|---|---|
| Migration/RLS/geospatial/provider/merge tests | PASS — 35/35 |
| Nearby regression | PASS — 40/40 |
| Gateway/mobile API regression | PASS — 16/16 + 3/3 |
| Backend foundation | PASS |
| Location regression | PASS — 7/7 |
| AI regression | PASS — 11/11 |
| Nearby/location type checks | PASS |
| Expo lint | PASS — 0 errors, 73 existing warnings |
| Android release APK | PASS — `assembleRelease` |

## Controlled fixture QA

Isolated, non-production fixtures cover Budapest, Győr, Vienna, and Tunis. For every city:

- the nearby point is inside a 1 km radius with plausible independently calculated distance;
- the outside point is rejected;
- `provider=naero`, `verified=true`, confidence, attribution, and verification time are normalized;
- draft, expired, and inactive records are hidden;
- no fixture is inserted by the production migration.

## Database verification status

Repository/static migration, policy simulation, provider, and geospatial tests pass. Docker/PostgreSQL is not running in the workspace and no staging database was mutated. SQL application and live `EXPLAIN`/policy verification remain a deployment gate, not an unreported assumption.

## Known limitations

- Production PostGIS installation/migration history was not remotely inspected because no deployment target was authorized.
- Google/Overpass behavior is regression-tested but not replaced.
- No verified production service is ingested; an empty verified result is expected initially.
- Process-local cache invalidation requires deployment/restart or explicit cache clearing.

## APK

The original Milestone 4 hash below was superseded by the from-scratch Milestone 4B integrity build. See `docs/MILESTONE_4B_POSTGIS_DEPLOYMENT_QA.md` for the corrected artifact evidence and comparison.

- Path: `C:\Users\Dell\Desktop\Naero V2\Naero-v1.2.0-milestone4-postgis-verified.apk`
- Size: 86,332,767 bytes
- Corrected SHA-256: `DEBBAAFF822B52065B3565D3CD19D519D627A905DD9BE7DBFD0025F66D92BB4F`
- Release build: PASS — 605 tasks, 56 executed, 549 up-to-date
- Provider-secret scan: PASS — zero Google/OpenAI credential patterns or service-role assignments in the release JavaScript bundle
- Direct Google/Overpass/Nominatim endpoint scan: PASS
- Known demo-place scan: PASS

## Rollback

Use the explicit rollback file after dependency/data review. PostGIS itself is intentionally retained.

## Changed files

1. `backend/.env.example`
2. `backend/db/MIGRATIONS.md`
3. `backend/db/migrations/005_postgis_verified_services.sql`
4. `backend/db/rollbacks/005_postgis_verified_services.rollback.sql`
5. `backend/src/config/env.js`
6. `backend/src/gateway/nearbyCore.js`
7. `backend/src/gateway/providers/verifiedServices.js`
8. `backend/src/services/nearbyService.js`
9. `docs/MILESTONE_4_POSTGIS_SCHEMA_AUDIT.md`
10. `docs/MILESTONE_4_POSTGIS_VERIFIED_SERVICES.md`
11. `docs/MILESTONE_4_POSTGIS_VERIFIED_SERVICES_QA.md`
12. `docs/VERIFIED_SERVICE_DATA_MODEL.md`
13. `package.json`
14. `tests/postgis_verified_services.js`
15. `Naero-v1.2.0-milestone4-postgis-verified.apk`
