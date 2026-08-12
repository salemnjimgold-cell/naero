# Milestone 3 — Real Nearby Provider QA

## Automated results

| Check | Result |
|---|---|
| Nearby provider/core/mobile tests | PASS — 40/40 |
| Live city provider QA | PASS — 7/7 checks completed |
| Gateway regression | PASS — 16/16 plus mobile client 3/3 |
| Backend foundation regression | PASS |
| Location regression | PASS — 7/7 |
| AI regression | PASS — 11/11 |
| Scoped type check | PASS |
| Expo lint | PASS — 0 errors, 73 warnings |
| Android release build | PASS — `assembleRelease` |

## Live-city summary

Live OSM hospital sampling used mocked city-center coordinates, a 15 km radius, provider IDs/names, backend normalization, and independent distance validation.

| Location | Named real records | Observed distance range |
|---|---:|---:|
| Budapest | 10 | 2,500–12,886 m |
| Győr | 2 | 1,730–7,601 m |
| Vienna | 10 | 972–11,680 m |
| Tunis | 10 | 1,627–13,602 m |
| Paris | 10 | 1,464–9,897 m |
| Berlin | 10 | 872–14,880 m |
| Rural Hungary (Hortobágy) | 0 | Honest empty result |

Every returned record had an OSM provider ID and name, matched the hospital query, and remained within the requested radius. The rural empty result was not replaced with another city or demo data. Public-instance 429/timeout behavior was also observed during preliminary passes, validating the need for fallback/stale behavior.

## Lint

Expo lint reported 0 errors and 73 warnings. The warnings are existing unrelated hook/import/style issues; Milestone 3’s touched Discover screen introduced no remaining lint warning. They were not auto-fixed because unrelated refactoring is prohibited.

## Security and scope

- Google key remains backend-only and is sent only in the provider request header.
- Mobile active nearby/realtime sources contain no Google, Overpass, or Nominatim imports.
- Nearby has no mock/local fallback.
- No PostGIS/database, Jobs, Housing, Community, auth, Facebook Login, Google Sign-In, AI-context, translation, or RTL work was performed.
- Place details are deferred.

## Known limitations

- Google live QA was not possible because no Google key is configured; its configured/unconfigured, normalization, field-mask, timeout/quota fallback, and closed-place behavior are covered by deterministic tests.
- The cache and circuit state are process-local.
- Public Overpass availability varies and may produce partial, stale, or unavailable responses.
- Category quality depends on provider tagging; medium-confidence mappings are intentionally conservative.
- Discover services remain on their existing data path; only place/nearby flow changed.

## Changed files

- `backend/.env.example`
- `backend/src/config/env.js`
- `backend/src/gateway/cache.js`
- `backend/src/gateway/categories.js`
- `backend/src/gateway/nearbyCore.js`
- `backend/src/gateway/providers/contracts.js`
- `backend/src/gateway/providers/googlePlaces.js`
- `backend/src/gateway/providers/overpass.js`
- `backend/src/gateway/response.js`
- `backend/src/gateway/validation.js`
- `backend/src/routes/gateway.js`
- `backend/src/services/nearbyService.js`
- `docs/MILESTONE_3_REAL_NEARBY.md`
- `docs/MILESTONE_3_REAL_NEARBY_QA.md`
- `docs/NEARBY_CATEGORY_MAPPING.md`
- `jsconfig.nearby.json`
- `package.json`
- `src/screens/DiscoverScreen.js`
- `src/context/AppContext.js`
- `src/services/index.js`
- `src/services/nearbyClientCore.js`
- `src/services/placeService.js`
- `src/services/realTimeService.js`
- `tests/nearby_city_qa.js`
- `tests/nearby_provider.js`
- `Naero-v1.2.0-milestone3-real-nearby.apk`

## APK

- Path: `C:\Users\Dell\Desktop\Naero V2\Naero-v1.2.0-milestone3-real-nearby.apk`
- Size: 86,332,767 bytes
- SHA-256: `D02F0F0402E08D9D51B073B9B3FCD9D8BEA1583A09CAF9D9A2736A0412C4AAC5`
- Provider-secret scan: PASS
- Direct Google/Overpass/Nominatim endpoint scan: PASS
- Known demo-place scan: PASS

## Rollback

No migration exists. Follow `docs/MILESTONE_3_REAL_NEARBY.md`.
