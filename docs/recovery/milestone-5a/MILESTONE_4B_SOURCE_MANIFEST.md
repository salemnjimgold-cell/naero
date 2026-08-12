# Milestone 4B Source Manifest

| File/directory | Purpose | Category | Include? | Reason |
|---|---|---|---|---|
| `App.js`, `app.json`, `package*.json` | App entry, version, native plugins and dependency lock | A | Yes | Required to reproduce current app |
| `src/context/AppContext.js` | Location, auth, nearby, realtime and application orchestration | A | Yes | Active runtime dependency |
| `src/navigation/AppNavigator.js` | Current stack/tab architecture | A | Yes | Active navigation source |
| `src/screens/` | Current product screens including new Discover/location UI | A | Yes | Active product implementation |
| `src/components/` | Current shared Deep Sea UI components | A | Yes | Imported by active screens |
| `src/theme/index.js` | Active Deep Sea tokens | A/G | Yes | Runtime design source of truth |
| `src/i18n/` | English, Arabic, French and Hungarian resources | A | Yes | Active runtime resources |
| `src/services/locationCore.js` | Pure location normalization and significant-change logic | A | Yes | Milestone 1 tested foundation |
| `src/services/locationService.js` | Foreground location, manual/off modes and persistence | A | Yes | Milestone 1 implementation |
| `src/services/apiClient*.js` | Normalized backend transport | A | Yes | Milestone 2 dependency |
| `src/services/nearbyClientCore.js` | Mobile nearby request contract | A | Yes | Milestone 2/3 dependency |
| `src/services/placeService.js` | Coordinate-backed nearby consumer | A | Yes | Active real-nearby path |
| `backend/src/server.js` | Backend route integration | B | Yes | Runtime backend entry |
| `backend/src/gateway/` | Validation, category registry, cache, ranking and provider contracts | B | Yes | Milestones 2-4 core |
| `backend/src/gateway/providers/nominatim.js` | Reverse geocoding provider | B | Yes | Milestone 2 runtime provider |
| `backend/src/gateway/providers/overpass.js` | OSM nearby provider | B | Yes | Milestone 3 runtime provider |
| `backend/src/gateway/providers/googlePlaces.js` | Optional Google Places provider | B | Yes | Optional configured provider |
| `backend/src/gateway/providers/verifiedServices.js` | PostGIS verified-service provider | B/C | Yes | Milestone 4 integration |
| `backend/src/routes/gateway.js` | Public nearby/reverse-geocode routes | B | Yes | Mobile/backend contract |
| `backend/src/services/nearbyService.js` | Provider ordering/fallback/merge | B | Yes | Active gateway composition |
| `backend/src/http/security.js` | Gateway/backend response security headers | B | Yes | Active server dependency |
| `backend/db/migrations/005_postgis_verified_services.sql` | Transactional PostGIS verified-service schema/RPC/RLS | C | Yes | Principal Milestone 4B deliverable |
| `backend/db/rollbacks/005_postgis_verified_services.rollback.sql` | Transactional Milestone 4 rollback | C | Yes | Required recoverability |
| `tests/location_foundation.js` | Pure foreground-location validation | D | Yes | Milestone 1 gate |
| `tests/backend_gateway.js`, `tests/mobile_api_client.js` | Gateway and mobile transport validation | D | Yes | Milestone 2 gate |
| `tests/nearby_provider.js`, `tests/nearby_city_qa.js` | Provider/ranking and live-city QA | D | Yes | Milestone 3 gate |
| `tests/postgis_verified_services.js` | Migration/RLS/RPC/provider simulation | D | Yes | Milestone 4 gate |
| `jsconfig.location.json`, `jsconfig.nearby.json` | Scoped static checks | D | Yes | Verification commands depend on them |
| `android/app/src/main/java/.../*.kt` | React Native host/activity and Facebook key-hash modules | E | Yes | Human-authored native implementation |
| `android/app/build.gradle`, manifest, Gradle properties and values | Android 1.2.0 configuration | E | Yes | Required native reproduction |
| `docs/MILESTONE_1*` through `docs/MILESTONE_4B*` | Implementation and QA evidence | F | Yes | Explains accepted source and limits |
| `docs/REAL_DATA_*`, category/data-model docs | Architecture provenance | F | Yes | Explains mock-to-real migration decisions |
| Root design Markdown documents | Design history/current proposals | G | Yes | Human-authored evidence; no direction chosen in 5A |
| `android/app/src/main/assets`, generated raw/drawable resources | Embedded release bundle/resources | H | No | Reproducible generated output |
| `artifacts/`, APKs, logs, Gradle/build/CMake output | Build evidence/intermediates | H | No | Large, reproducible or machine-local |
| `qa_screenshots/`, UI dump and test captures | Visual QA output | H | No | Preserved evidence, not build source |
| `.env`, `backend/.env` | Local credentials/endpoints | J | No | Secret/local-only configuration |

