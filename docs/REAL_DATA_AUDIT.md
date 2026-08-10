# Naero Real Data Audit

**Audit date:** 2026-07-25  
**Scope:** Phase 1 only — static/demo data discovery and production-risk classification  
**Repository:** Naero V2 mobile app, Node backend, Supabase SQL, Firebase compatibility layer, AI/RAG knowledge, caches, and generated Android bundle  
**Implementation status:** No data replacement or product behavior was changed during this audit.

## Executive summary

Naero is not currently location-global or safe to treat as a real-data product. Its production-visible content is primarily Hungary/Budapest-specific, and the shared `DataService` silently falls back to bundled mock arrays whenever the remote API or Firestore is unavailable. The mock records frequently carry convincing names, coordinates, ratings, reviews, addresses, opening hours, phone numbers, prices, salaries, and `verified: true` / `demo: false` flags despite having no provenance that can be verified from the repository.

The highest-risk findings are:

1. **Home is entirely fabricated.** It renders four hardcoded nearby places with static distance labels and three fake people independently of location or the data service.
2. **Bundled mock data is the default production fallback.** Places, services, jobs, housing, community posts, safety guidance, and emergency contacts can all be shown after provider failure or missing configuration.
3. **Location failures can silently become Budapest.** Reverse geocoding falls back to `"Budapest"`, and AI code repeatedly uses `city || "Budapest"`.
4. **Legal, immigration, healthcare, employment, housing, safety, price, and deadline claims are uncited static text.** Some are explicitly dated 2024; others contain potentially consequential legal claims with no source or review date.
5. **The mobile bundle calls Google Places, Overpass, and Nominatim directly.** The Google adapter accepts an API key in app memory, while public providers are queried without the required secure backend gateway.
6. **The current Node backend has no public places, nearby, services, jobs, housing, community, or location routes.** Mobile `/v1/places` requests therefore cannot be satisfied by this backend.
7. **The Supabase schema is not geospatial.** It stores raw latitude/longitude columns, defaults every place country to Hungary, has no PostGIS extension or spatial index, and lacks the required production tables and privacy-preserving community location model.
8. **Data labeling is internally contradictory.** Mock files mark fabricated/unverified records as `demo: false`, `verified: true`, and `source: "authority"`/`"ngo"`/`"company"` without source URLs or verification logs.
9. **There is duplicated legacy data.** `src/data/*.js`, `src/data/providers/mock*.js`, the SQL seed, the local AI knowledge, and backend RAG documents contain overlapping but inconsistent claims.
10. **Text encoding is corrupted in many bundled records.** Hungarian names and euro symbols contain mojibake, making names, addresses, and source matching unreliable.

### Priority totals

| Priority | Findings | Meaning |
|---|---:|---|
| Critical | 39 | Can present fabricated, geographically wrong, legally unsafe, privacy-sensitive, or secret-bearing data in production |
| High | 28 | Major real-data, freshness, relevance, expiry, attribution, or reliability gap |
| Medium | 4 | Important normalization, labeling, duplication, or UX integrity issue |
| Low | 2 | Dormant or primarily development-facing risk |

## Audit method and coverage

The audit used a repository-wide file inventory, import/consumer tracing, searches for data literals and geographic terms, and direct inspection of:

- all 20 mobile screens in `src/screens/`;
- the shared `AppContext` state and its location/data loading effects;
- all data services, cache/sync services, API adapters, and Firebase/Supabase clients;
- all models and static/provider data files under `src/data/`;
- mobile AI routing, context, local knowledge, and fallback response generation;
- the Node server, routes, repositories, AI tools/prompts/RAG sources, and provider code;
- all four Supabase migrations, database documentation, and sample seeds;
- all six backend knowledge documents;
- app and backend environment templates;
- the checked-in generated Android JavaScript bundle.

Authentication, Google Sign-In, Facebook code, visual design, navigation, static translation copy, and purely decorative fixtures were inspected only for data flow impact and were not modified.

## Current production data flow

| Domain | Screen consumers | Current path | Actual fallback |
|---|---|---|---|
| Home nearby places | `HomeScreen` | None | Hardcoded `PLACES` array |
| Home nearby people | `HomeScreen` | None | Hardcoded `PEOPLE` array |
| Places / Discover | `ExploreScreen`, `DiscoverScreen`, `PlaceDetailScreen` | `placeService` → optional `/v1/places` → optional Firestore → Overpass in selected methods | `mockPlaces` |
| Services | `ServicesScreen`, `DiscoverScreen`, `ServiceDetailScreen` | `serviceService` → optional Firestore | `mockServices` |
| Jobs | `JobsScreen`, `JobDetailScreen`, Home context, AI | `jobService` → optional Firestore | `mockJobs` |
| Housing | Search/AI service only; no dedicated screen in current navigator | `housingService` → optional Firestore | `mockHousing` |
| Community | `CommunityScreen`, `CommunityDetailScreen`, Home alerts, AI | `communityService` → optional Firestore | `mockCommunityPosts`; mutations are local success stubs |
| Safety | `SafetyScreen` | `safetyService` → optional Firestore | `mockSafetyTips`, `mockEmergencyContacts` |
| Location | `LocationPermissionScreen`, profile/settings, `AppContext` | `expo-location` + AsyncStorage | reverse-geocode city fallback to Budapest |
| AI | `AIScreen`; mobile local fallback; backend AI/RAG | backend AI when available; local engine otherwise | hardcoded Hungary/Budapest knowledge and mock domain data |
| Supabase places | Backend AI place tools/RAG | REST repository over `places` | database sample seed if applied |

## Detailed findings

Each finding lists the required affected screen, current source, risk classification, production replacement, and priority.

### A. Production-visible screen data

| ID | File path | Screen affected | Current data source | Classification | Production replacement | Priority |
|---|---|---|---|---|---|---|
| UI-01 | `src/screens/HomeScreen.js` | Home | Local `PLACES` constant: Bakery, Community, Library, Clinic with `0.3–1.5 km` strings | **Fake.** Names, descriptions, distances, and nearby status are fabricated and do not use user coordinates. | Unified backend `/api/v1/nearby` results computed from current/manual location; honest empty/error/offline state when absent. | **Critical** |
| UI-02 | `src/screens/HomeScreen.js` | Home | Local `PEOPLE` constant with named people, origins, status text, and “nearby” presentation | **Fake and privacy-unsafe.** Fabricated people imply real community presence and location sharing. | Explicitly opted-in Supabase community discovery returning privacy-safe city/district and broad distance buckets only. | **Critical** |
| UI-03 | `src/screens/ExploreScreen.js` | Explore (legacy Discover route) | `placeService.getAll()` plus `mockCategories`; client sorts latitude deltas and labels the first five as nearby | **Unsafe/static.** Falls back to mock places; ordering is not a trusted distance calculation and ignores radius. | Backend nearby endpoint with validated coordinates, server distance, category filter, radius, ranking, deduplication, and normalized model. | **Critical** |
| UI-04 | `src/screens/DiscoverScreen.js` | Discover | `placeService.getAll()` + `serviceService.getAll()` + `mockCategories` | **Fake fallback.** Provider failure becomes convincing mock place/service cards; fabricated ratings are displayed without provenance. | Unified location intelligence endpoints and provider-agnostic model; no fake fallback cards. | **Critical** |
| UI-05 | `src/screens/ServicesScreen.js` | Services | `serviceService.getAll()` from mock services; “Nearby Services” is city-filtered and sliced, not distance-based | **Fake/static.** “Nearby” can mean only matching a hardcoded city and includes invented service claims. | `/api/v1/services/nearby` with PostGIS/provider results, exact distance, category mapping, verification metadata, and null missing fields. | **Critical** |
| UI-06 | `src/screens/JobsScreen.js`, `src/screens/JobDetailScreen.js` | Jobs / job detail | `jobService.getAll()` from `mockJobs` | **Fake and stale.** Listings lack source URL, publication timestamp, expiry, last-checked status, coordinates, and active-state enforcement. | Opportunity provider interface backed by licensed/official/partner/manual verified records; hide expired and label unconfirmed availability. | **Critical** |
| UI-07 | `src/screens/CommunityScreen.js`, `src/screens/CommunityDetailScreen.js` | Community / post detail | `communityService.getPosts()` from fabricated named authors and posts | **Fake.** Placeholder posts, people, likes, comments, timestamps, reviews, warnings, and recommendations are presented as community activity. | Authenticated Supabase community posts; moderation/block safeguards; opted-in approximate discovery separated from normal feed. | **Critical** |
| UI-08 | `src/screens/CommunityDetailScreen.js` | Community detail | Component-local comments/liked state; no durable backend mutation | **Fake interaction.** UI can appear successful without creating real comments/likes. | Authenticated backend mutations with authorization, moderation, idempotency, error handling, and refreshed server state. | **High** |
| UI-09 | `src/screens/SafetyScreen.js` | Safety | `mockSafetyTips` and `mockEmergencyContacts` | **Stale/unsafe.** Country-specific legal, medical, police, safety, and phone claims have no official source or last-checked date. | Jurisdiction-aware official/trusted safety resources with source URL, effective/checked dates, and country selection. | **Critical** |
| UI-10 | `src/screens/PlaceDetailScreen.js` | Place detail | Unnormalized place object from mock/OSM/remote; renders rating, address, hours, phone and navigation action | **Unsafe.** Fabricated mock contact data is actionable; missing values are inconsistently represented; no attribution. | Normalized place detail endpoint; null unknown fields; provider attribution, fetched/verified timestamps, safe navigation URL. | **Critical** |
| UI-11 | `src/screens/ServiceDetailScreen.js` | Service detail | Mock service object, using `item.location` while provider records use `address` | **Fake and structurally inconsistent.** Can show/action invented contact information and omit valid addresses. | Normalized service model shared by list/detail screens, with source and verification metadata. | **High** |
| UI-12 | `src/screens/ProfileScreen.js` | Profile location | Manual city is free text; examples are Budapest, Debrecen, Szeged; saved city is not propagated into `AppContext` immediately | **Static/incomplete.** Manual mode is Hungary-centric, unvalidated, and can fail to affect production queries. | Geocoder-backed global city selector storing normalized city/country code/centroid and explicit manual-mode state. | **High** |
| UI-13 | `src/screens/SettingsScreen.js`, `src/screens/ProfileScreen.js` | Settings / Profile privacy | Claims location “never leaves your device unless you search,” while live queries send exact coordinates directly to third parties | **Misleading/unsafe.** Privacy copy does not disclose Overpass/Nominatim/Google/provider processing. | Accurate consent/privacy copy tied to backend gateway behavior, minimum retention, deletion, and provider disclosure. | **Critical** |
| UI-14 | `src/screens/LocationPermissionScreen.js` | Location permission | Foreground prompt delegates to current location service; no global structured manual-city fallback on error/GPS disabled | **Incomplete.** App continues, but fallback and failure states are not unified. | Single location source with permission rationale, GPS/error detection, manual preference, and non-blocking app state. | **High** |
| UI-15 | `src/screens/AIScreen.js` | AI | Backend response when available; otherwise local `AIEngine` can use mock data and hardcoded knowledge | **Unsafe.** Generated answers can cite fabricated listings or uncited legal/location facts as current. | Backend-only verified knowledge context with official-resource citations, checked dates, user location context, and no mock fallback. | **Critical** |
| UI-16 | `src/screens/NotificationsScreen.js` | Notifications | Backend/Supabase notification records | No fabricated fixture found in active screen path. Data quality depends on notification producer, which is not a location data source in this repository. | Keep; require producers to reference normalized real records and avoid embedding exact coordinates. | Low |

### B. Mock, static, and duplicated datasets

| ID | File path | Screen affected | Current data source | Classification | Production replacement | Priority |
|---|---|---|---|---|---|---|
| DATA-01 | `src/data/providers/mockPlaces.js` | Explore, Discover, Place detail, Home context, AI | 20 bundled Hungary place records | **Fabricated/unsafe.** Static coordinates, ratings, review counts, addresses, hours, phones, descriptions; many marked `verified: true`, `demo: false`, and authoritative without source URLs. | Google Places New + OSM + verified Naero/PostGIS records through backend normalization and verification log. | **Critical** |
| DATA-02 | `src/data/providers/mockServices.js` | Services, Discover, Service detail, Home context, AI | 14 bundled service records | **Fabricated/unsafe.** Legal aid, refugee help, medical care, discounts, prices, languages, hotline numbers, addresses, and hours lack provenance; most claim verification. | Verified service registry plus provider adapters and official/NGO source records with original URLs and last-checked dates. | **Critical** |
| DATA-03 | `src/data/providers/mockJobs.js` | Jobs, job detail, Home context, AI | 12 bundled job records | **Fabricated/stale.** Relative posted dates, salaries, employers, application emails, and work-permit claims; no expiry/source URL/last checked. | Normalized opportunity records from permitted official/licensed/partner sources; expiry checks and availability label. | **Critical** |
| DATA-04 | `src/data/providers/mockHousing.js` | Search and AI; future housing UI | 8 bundled housing records | **Fabricated/stale.** Addresses, coordinates, rents, deposits, contacts, amenities, availability, and verification are unsubstantiated. | Licensed partner/official/manual verified housing provider records with source URL, checked date, expiry, and availability status. | **Critical** |
| DATA-05 | `src/data/providers/mockCommunity.js` | Community, Home alerts, AI | 19 bundled posts/comments/users | **Fabricated and privacy-sensitive.** Named people, cities, origins, engagement counts, reviews, warnings, and relative timestamps simulate real users. | Real authenticated UGC with moderation; seed fixtures isolated to test/dev and never bundled into production. | **Critical** |
| DATA-06 | `src/data/providers/mockSafety.js` | Safety | 10 safety tips and 5 emergency contacts | **Static/stale/unsafe.** Legal rights, emergency numbers, medical rules, scam alerts, phone contacts, and locality assumptions lack authoritative metadata. | Structured official resources by jurisdiction, with attribution, effective/checked dates, and translations. | **Critical** |
| DATA-07 | `src/data/providers/mockCategories.js`, `src/data/categories.js` | Discover, Explore, Services, Jobs | Bundled category lists | **Static.** Taxonomy itself is acceptable UI configuration, but `mockCategories` is mislabeled and not mapped to provider-specific queries. | Canonical category registry shared with backend mapping; localized labels remain UI configuration. | **Medium** |
| DATA-08 | `src/data/places.js`, `src/data/services.js`, `src/data/jobs.js`, `src/data/community.js`, `src/data/safetyTips.js` | Currently not directly imported by active screens | Legacy bundled copies of demo content | **Duplicate/dormant.** Conflicting parallel data can be accidentally reintroduced and contains the same fabricated contact/legal/community claims. | Remove after verified replacement; keep fixtures only under explicit test directories with production import guards. | **Medium** |
| DATA-09 | `src/data/schema.js` | Geo helpers, future/admin data logic | `PRIORITY_CITIES` with static coordinates for eight mostly Hungarian cities; schema assumes city/country fields | **Geographically static.** It limits city recognition and supports nearest-listed-city guessing. | Global geocoder/manual city records and coordinate-based backend queries; no priority-city inference for user location. | **High** |
| DATA-10 | `src/data/schema.js` | All domains conceptually | Static schema says `verified`, `source`, `lastUpdated`, `demo` are sufficient | **Unsafe model.** It lacks provider IDs, source URLs, fetch/check timestamps, confidence, expiry, attribution, jurisdiction, and verification evidence. | Production normalized nearby/opportunity/legal models and verification log specified in later architecture phase. | **High** |
| DATA-11 | `src/data/providers/mock*.js`, `src/data/*.js`, `backend/db/seeds/001_sample_places.sql` | All data screens if loaded/seeded | Mojibake such as corrupted Hungarian characters and euro symbols | **Corrupt.** Breaks display, search, matching, deduplication, addresses, and attribution. | UTF-8 source ingestion and validation; canonical Unicode normalization before dedup/search. | **High** |

### C. Service, context, fallback, and cache behavior

| ID | File path | Screen affected | Current data source | Classification | Production replacement | Priority |
|---|---|---|---|---|---|---|
| SVC-01 | `src/services/dataService.js` | All place/service/job/housing/community/safety consumers | Optional remote → optional Firestore → `mockData` | **Silent fake fallback.** Missing config, backend error, or unconnected Firestore returns local demo data with `error: null`. | Explicit provider orchestration returning real, stale-real, empty, or error states; never substitute fixtures. | **Critical** |
| SVC-02 | `src/firebase/firestore.js`, `src/firebase/config.js` | All `DataService` domains | Firestore client is never connected; local arrays are registered as collection data; writes return synthetic success | **Mock production implementation.** Reads and mutations can appear successful while remaining local. | Remove from production path or implement a real authorized data adapter; use Supabase/backend as the canonical production path. | **Critical** |
| SVC-03 | `src/services/placeService.js` | Explore, Discover, Home context, AI | Optional backend, direct Overpass, then mock places | **Unsafe fallback.** `getByCity` returns all mock places when a city has no matches, causing geographically irrelevant results. | Backend unified service with strict radius/city filtering and honest empty result. | **Critical** |
| SVC-04 | `src/services/placeService.js` | Explore/Discover/AI | `markDemo()` overlays `demo: true` only after reads | **Inconsistent labeling.** Raw files claim `demo: false`; some paths (`getAll`) can expose records before relabeling. | Eliminate production fixture path; enforce source/verification model server-side. | **High** |
| SVC-05 | `src/services/serviceService.js`, `jobService.js`, `housingService.js`, `communityService.js`, `safetyService.js` | Corresponding screens | Mock-only `DataService` subclasses with no remote endpoint | **Fake by design.** In the current configuration these domains cannot retrieve production data. | Versioned backend endpoints and domain repositories/provider interfaces. | **Critical** |
| SVC-06 | `src/services/communityService.js` | Community detail/create actions | `addPost`, `addComment`, and `likePost` return generated IDs/success without persistence | **Fake mutation.** User actions are lost and may imply publication or engagement. | Authenticated backend CRUD, RLS, moderation, abuse/block controls, and durable state. | **High** |
| SVC-07 | `src/context/AppContext.js` | Home, Discover, services, jobs, AI | Central city triggers mock domain loads; live results are held separately from `nearbyPlaces` | **Inconsistent source of truth.** It has one context but two competing place result paths and no unified structured location. | Single location state and single normalized nearby data client used by all screens. | **High** |
| SVC-08 | `src/services/locationService.js` | All location-aware screens | `expo-location`, device AsyncStorage, module globals | **Incomplete/static.** Stores only lat/lng/timestamp (not accuracy), has no significant-change detection, structured address, mode, country code, district, region, postal code, or retention policy. | Required Phase 2 location state with minimal structured fields, accuracy, preference/mode, freshness, and change detection. | **High** |
| SVC-09 | `src/services/locationService.js` | All location-aware screens and AI | `addr.city || addr.subregion || addr.region || "Budapest"` | **Silent geographic fabrication.** A failed/partial reverse geocode can set any user to Budapest. | Return structured partial result or failure; use explicit manual city if selected; never assume a city. | **Critical** |
| SVC-10 | `src/utils/geo.js` | Place/service/job/housing filtering | `PRIORITY_CITIES`; nearest Euclidean degree distance; country default `"Hungary"` | **Static/geographically unsafe.** Unknown locations can be mapped to the nearest listed city and global country queries default to Hungary. | Provider geocoding and validated great-circle/PostGIS location queries without country defaults. | **High** |
| SVC-11 | `src/utils/distance.js` | Place/service/housing nearby methods | Client Haversine over fixture/provider coordinates | Formula is generally valid, but **untrusted placement and input validation are missing**; records with absent/invalid coordinates can produce `NaN`. | Server/PostGIS distance with coordinate validation and tests; client value display only. | **Medium** |
| SVC-12 | `src/services/api/overpassApi.js` | Places/AI live path | Direct mobile call to hardcoded public Overpass endpoint | **Production-policy/reliability risk.** Broad default query returns any amenity/shop/cuisine, only nodes (not ways/relations), no backend limits/rate control, no attribution propagation. | Backend OSM adapter with narrow category tags, timeout/rate/cache controls, all geometry types, normalization, and attribution. | **High** |
| SVC-13 | `src/services/api/nominatimApi.js` | Realtime city/search helpers | Direct mobile call to hardcoded public Nominatim, fixed English language and generic User-Agent | **Policy/localization/reliability risk.** No backend cache/rate limit and results omit country code. | Backend reverse-geocoder adapter with configurable URL, usage-policy compliance, cache, locale, full structured address, and attribution. | **High** |
| SVC-14 | `src/services/api/googlePlacesApi.js` | Available adapter; not currently configured by active flow | Legacy Google Places web endpoints called directly with runtime API key | **Secret and architecture risk.** Key would be present in bundled app traffic/source; uses legacy API instead of Places API New; no backend gateway. | Server-side Places API New adapter with secret env var, field masks, normalized output, attribution, and allowed cache handling. | **Critical** |
| SVC-15 | `src/services/cacheService.js`, `src/services/dataService.js` | All data screens | Generic 5–15 minute device TTLs; persisted entries lack source freshness/verification metadata | **Unsafe reliability model.** No domain TTL policy, stale-real labels, offline provenance, expiry invalidation, or distinction between mock and real. | Typed memory/device/backend caches with provider/category TTL, stale metadata, expiry enforcement, and no mock caching. | **High** |
| SVC-16 | `src/services/realTimeService.js` | Live place path | Realtime preference defaults enabled | **Misleading naming.** “Realtime” actually controls direct third-party lookup, not realtime provider updates, and may trigger exact-coordinate sharing. | Explicit “use live location results” preference tied to consent and backend gateway. | **Medium** |

### D. Models and normalization

| ID | File path | Screen affected | Current data source | Classification | Production replacement | Priority |
|---|---|---|---|---|---|---|
| MODEL-01 | `src/data/models/Place.js`, `Service.js`, `Job.js`, `Housing.js`, `Community.js`, `Safety.js` | All corresponding screens/services | Constructors default `country = "Hungary"` and most default `demo = true` | **Static country assumption.** Missing country silently becomes Hungary. | Require explicit normalized `countryCode`/jurisdiction from provider or leave null; reject ambiguous production records. | **High** |
| MODEL-02 | `src/data/models/Place.js` | Place cards/detail | Missing rating coerced to `0` | **Fabricated meaning.** Unknown rating becomes a real-looking zero score instead of null. | Preserve unavailable rating/review count as null. | **High** |
| MODEL-03 | All models under `src/data/models/` | All domains | Different coordinate, address/location, hours/openingHours, contact/phone, date, source, and verification shapes | **Unnormalized.** UI must know source-specific fields and cannot safely dedupe/rank/attribute. | Shared normalized DTOs for nearby, opportunity, legal, and community privacy responses. | **High** |
| MODEL-04 | `src/data/models/Job.js`, `Housing.js` | Jobs/housing | No mandatory source URL, publication/expiry/check dates, active state, confidence, or coordinates for jobs | **Expiry/provenance gap.** Cannot determine whether a listing is active. | Required opportunity model and automatic expiration/availability validation. | **Critical** |
| MODEL-05 | `src/data/models/Community.js`, `UserProfile.js` | Community/Profile/AI | City/country profile fields but no opt-in approximate location/visibility/pause/deletion model | **Privacy gap.** Required community location controls cannot be expressed. | Separate privacy-preserving `community_location_preferences` and user location preference model; off by default. | **Critical** |

### E. AI, legal, immigration, and official information

| ID | File path | Screen affected | Current data source | Classification | Production replacement | Priority |
|---|---|---|---|---|---|---|
| AI-01 | `src/ai/engine.js`, `src/ai/geminiClient.js` | AI | `city || "Budapest"` and mock place/service/job/community context | **Fabricated/geographically irrelevant.** Unknown user location is silently Budapest; mock records can be presented as app data. | Pass explicit structured location/manual mode and verified backend results only; omit locality when unavailable. | **Critical** |
| AI-02 | `src/ai/engine.js` | AI fallback | Hardcoded clinic, pharmacy, address, opening hours, nationality, immigration and settlement answers | **Generated/static information presented as current.** No citations or checked dates. | Remove factual local fallback; return safe unavailable response or cite verified official resource records. | **Critical** |
| AI-03 | `src/ai/knowledge.js` | AI fallback | Static Hungary immigration, housing, jobs, cost-of-living, safety, and city guide object | **Stale/unsafe.** Contains deadlines, permit rules, addresses, opening hours, salaries, prices, legal procedures, and rights without sources. | Structured official-resource records with URLs, jurisdiction, effective/checked dates, review status, and supported translations. | **Critical** |
| AI-04 | `backend/knowledge/immigration-guide.md` | Backend AI/RAG | Handwritten Hungary visa/residency/citizenship guide | **Legally unsafe and likely stale.** No citations, effective date, reviewer, or last checked; includes consequential dual-citizenship, deadlines, eligibility, and processing claims. | Verified official immigration resource ingestion; source-level metadata and human review. | **Critical** |
| AI-05 | `backend/knowledge/housing-guide.md` | Backend AI/RAG | Handwritten tenant/property guide | **Legally unsafe/stale.** Uncited tenant rights, notice rules, deposit deadlines, rent increase rules, taxes, and buying permission claims. | Official/trusted jurisdictional resources with review workflow and visible caveat. | **Critical** |
| AI-06 | `backend/knowledge/jobs-guide.md` | Backend AI/RAG | Static employment guide and 2024 salary/minimum-wage figures | **Explicitly outdated/stale.** Labor rights, probation/leave, permit, and pay claims are uncited. | Official labor/immigration sources, effective dates, and periodic verification; current labor statistics as separate sourced data. | **Critical** |
| AI-07 | `backend/knowledge/healthcare-guide.md`, `emergency-guide.md`, `local-guide.md` | Backend AI/RAG | Static Hungary guidance, phone numbers, addresses, hours, prices, and rules | **Stale/unsafe.** No official URLs or review dates; some absolute claims and contacts may change. | Jurisdiction-aware official/trusted resource registry with source attribution and last checked. | **Critical** |
| AI-08 | `backend/src/services/ai/prompts/templates.js` | Backend AI | All assistants are explicitly scoped to Hungary/Budapest | **Geographically static.** Prompt can override actual user country and encourage unsupported local claims. | Country/jurisdiction-neutral base prompts plus verified location/resource context; refuse unsupported local certainty. | **High** |
| AI-09 | `backend/src/services/ai/knowledge/index.js` | Backend RAG seed | `DEFAULT_CITIES` and `DEFAULT_COUNTRIES` with static prose, rents, transit, travel times, population, and facts | **Static/stale and inaccurate.** Example: Budapest is stated to have 118 districts; no sources/check dates. | Source-backed city/country documents produced from verified records or remove default indexing. | **Critical** |
| AI-10 | `backend/src/services/ai/knowledge/sources.js` | Backend RAG | Defaults missing country to Hungary; indexes place/review text without authoritative verification requirements | **Unsafe provenance.** Unverified/user content can become AI retrieval context and missing country is fabricated. | Filter by verification/source policy, preserve provenance metadata, never default jurisdiction, and distinguish UGC from official data. | **High** |

### F. Backend gateway and API surface

| ID | File path | Screen affected | Current data source | Classification | Production replacement | Priority |
|---|---|---|---|---|---|---|
| BE-01 | `backend/src/server.js`, `backend/src/routes/` | All real-data screens | Routes exist for health/config/profile/uploads/notifications/activity/moderation/AI only | **Missing production gateway.** No location, reverse-geocode, nearby, places, services, opportunities, community-nearby, jobs, or housing endpoints. | Versioned `/api/v1` location intelligence routes with validation, limits, timeouts, rate limiting, structured errors, and privacy-safe logs. | **Critical** |
| BE-02 | `src/services/placeService.js` vs `backend/src/server.js` | Explore/Discover/AI | Mobile requests `/v1/places*`; backend does not route them | **Broken dependency.** Remote mode will fail and then silently show mocks. | Implement matching backend routes or update client contract in Phase 4; keep one canonical versioned API. | **Critical** |
| BE-03 | `backend/src/services/repositories/placesRepository.js` | AI place tools/RAG only | Supabase REST city/category/text filtering | **Static/non-geospatial.** No radius/distance validation, ranking, dedupe, provider merge, closure filtering, or freshness. | Location intelligence repository using PostGIS RPC/backend query and normalized provider orchestration. | **High** |
| BE-04 | `backend/src/services/ai/tools/places.js` | AI | Public place listing/search tool over raw `places` table | **Unsafe source quality.** Can return seeded/unverified records and has no geographic distance semantics or attribution. | Verified normalized place tool constrained by user location, radius, source metadata, and permissions. | **High** |

### G. Supabase schema, migrations, and seeds

| ID | File path | Screen affected | Current data source | Classification | Production replacement | Priority |
|---|---|---|---|---|---|---|
| DB-01 | `backend/db/migrations/002_core_data_tables.sql` | Places/AI | `places` table has `latitude`/`longitude` doubles and `country text default 'Hungary'` | **Static/non-geospatial.** Default fabricates jurisdiction; no geography point or spatial index. | Enable PostGIS; explicit country code; `geography(Point,4326)` location and GiST index, with migration/backfill validation. | **Critical** |
| DB-02 | `backend/db/migrations/*.sql` | All requested real-data domains | No `verified_services`, categories/locations, opportunities, legal resources, provider cache, verification log, or location preference tables | **Missing architecture.** Required provenance, expiry, location privacy, and provider caching cannot be represented. | Reversible production migrations for required normalized tables and relationships. | **High** |
| DB-03 | `backend/db/migrations/*.sql` | Nearby/community | No PostGIS extension, nearby RPCs, radius filtering, or distance ordering | **Missing geospatial capability.** | PostGIS extension, spatial indexes, secure nearby service/opportunity/community RPCs or backend SQL. | **Critical** |
| DB-04 | `backend/db/migrations/002_core_data_tables.sql` | Places/AI | Public can read all places; authenticated users can create places; verification is a boolean without verification evidence | **Data trust risk.** User-created records can coexist with official-looking data and reach AI/search without a strict approval boundary. | Separate submitted vs verified data or enforce moderation status; service role/admin verification log; queries default to approved active data. | **High** |
| DB-05 | `backend/db/migrations/001_core_auth_profiles.sql` | Profile/AI/community | Profile has `current_city` and `location_personalization_enabled`, but no exact-location retention/deletion or community visibility model | **Privacy model incomplete.** | User and community location preference tables with opt-in, approximate storage, pause/deletion timestamps, and strict RLS. | **Critical** |
| DB-06 | `backend/db/seeds/001_sample_places.sql` | Places/AI if applied | 12 Budapest sample places, several convincing or invented, inserted with `verified: true/false`; no environment guard in SQL | **Demo contamination risk.** Documentation says staging only, but applying it to production would create authoritative-looking fake data. | Keep fixtures in isolated test tooling; add explicit environment guard/namespace and never seed production. | **High** |
| DB-07 | `backend/db/seeds/001_sample_places.sql` | Places/AI | Sample phone numbers, addresses, websites, descriptions, categories and reviews | **Fabricated.** Several records use placeholder-like numbers/domains and unsupported verification. | Replace only through verified provider/manual ingestion with source records; development fixtures must be unmistakably synthetic. | **High** |

### H. Generated artifacts and environment/configuration

| ID | File path | Screen affected | Current data source | Classification | Production replacement | Priority |
|---|---|---|---|---|---|---|
| CFG-01 | `android/app/src/main/assets/index.android.bundle` | Installed Android app | Checked-in compiled snapshot contains source data and can lag current JS | **Stale artifact risk.** Even after source cleanup, an old bundle/APK can retain mock data, static knowledge, and endpoints. | Rebuild from audited source after each implementation stage; verify bundle contains no mock datasets or secrets. | **High** |
| CFG-02 | `.env.example`, `backend/.env*.example`, `src/services/api/*.js` | Provider-backed screens | Templates lack the requested Google Places/Nominatim/Overpass placeholders; endpoints are hardcoded in mobile | **Configuration gap.** Encourages direct mobile provider calls and makes policy-compliant deployment difficult. | Backend-only provider environment template with `GOOGLE_PLACES_API_KEY`, configurable Nominatim/Overpass URLs, Supabase service key, and no mobile secrets. | **High** |
| CFG-03 | `src/ai/geminiClient.js`, `src/ai/config.js`, root `.env.example` | AI | Mobile includes a direct Gemini client/config path | **Sensitive API architecture risk.** Any configured provider key in Expo public/mobile config would be bundled. | Backend AI gateway only; remove direct mobile secret use after verified migration. | **Critical** |
| CFG-04 | `backend/db/seeds/README.md` | Development/staging only | Clearly states sample seeds are not for production | Correct intent, but enforcement is documentation-only. | Add environment-enforced seed workflow later. | Low |

## Screen-by-screen disposition

This section records screens with no independent fabricated data so the audit covers the full screen set rather than only files with findings.

| Screen | Data audit result |
|---|---|
| `WelcomeScreen.js`, `AuthScreen.js` | No real-world listing/location dataset. Authentication was intentionally left out of scope. |
| `SplashScreen.js`, `OnboardingScreen.js`, `AboutScreen.js` | Static product copy/links only; no nearby, legal, jobs, housing, or community dataset used. |
| `HomeScreen.js` | Critical fabricated places, distances, and people (UI-01, UI-02). |
| `DiscoverScreen.js` | Mock places/services and ratings via silent fallback (UI-04). |
| `ExploreScreen.js` | Mock places and unsafe client “nearby” ordering (UI-03). |
| `ServicesScreen.js`, `ServiceDetailScreen.js` | Mock services/contact/location data (UI-05, UI-11). |
| `JobsScreen.js`, `JobDetailScreen.js` | Fabricated, non-expiring job listings (UI-06). |
| `CommunityScreen.js`, `CommunityDetailScreen.js` | Fabricated people/posts/engagement and fake mutations (UI-07, UI-08). |
| `SafetyScreen.js` | Uncited country-specific safety/legal/medical contacts and claims (UI-09). |
| `PlaceDetailScreen.js` | Actionable mock phone/address/hours/rating and missing attribution (UI-10). |
| `AIScreen.js` | Backend/local AI can use static/mock/uncited context (UI-15). |
| `ProfileScreen.js`, `SettingsScreen.js` | Incomplete/manual location state and misleading privacy disclosure (UI-12, UI-13). |
| `LocationPermissionScreen.js` | Foreground-only request exists; unified failures/manual state are incomplete (UI-14). |
| `NotificationsScreen.js` | No local fixture found; producer provenance remains a later integration concern (UI-16). |

## Supabase/RLS audit snapshot

Existing RLS is present on the current profiles, settings, consent, places, reviews, reports, AI, saved-place, notification, activity, moderation, and knowledge tables. Owner checks are generally used for user-owned records. However, Phase 1 found no schema or policy capable of meeting location intelligence requirements:

- no PostGIS extension;
- no `geography(Point, 4326)` column;
- no GiST spatial indexes;
- no nearby service/opportunity/community RPC;
- no approximate community location;
- no opt-in visibility/pause model;
- no distance-bucket-only response boundary;
- no provider cache or verification history;
- no legal-resource provenance model;
- no automatic opportunity expiry model.

No current table directly exposes stored user exact coordinates because no such location table exists yet. This is preferable to premature storage, but the future schema must not add readable exact coordinates to user profiles.

## Data that must not be migrated as production truth

The following sources may be retained temporarily only as clearly isolated development/test fixtures. They must not be imported into production tables, caches, RAG, APK assets, or fallback UI:

- all `src/data/providers/mock*.js` records;
- all legacy `src/data/places.js`, `services.js`, `jobs.js`, `community.js`, and `safetyTips.js` records;
- `backend/db/seeds/001_sample_places.sql`;
- factual claims in `src/ai/knowledge.js` and `src/ai/engine.js`;
- factual claims in `backend/knowledge/*.md`;
- `DEFAULT_CITIES` and `DEFAULT_COUNTRIES` in backend RAG indexing;
- the `HomeScreen` `PLACES` and `PEOPLE` constants.

Records should not be “blessed” merely by changing `demo`, `verified`, or `source` flags. A production record needs an original source, source URL/provider ID, fetch/check timestamps, verification evidence/status, jurisdiction, and applicable attribution.

## Recommended replacement order for later phases

No replacement was implemented in this phase. The audit evidence supports this later order:

1. Introduce a single structured location state and remove all Budapest/Hungary inference.
2. Build the backend gateway and normalized location intelligence contract.
3. Move Google/OSM/Nominatim calls behind the backend and add validation, limits, caching, attribution, and logging controls.
4. Add PostGIS and verified service/provider tables with strict RLS.
5. Integrate Home, Discover/Explore, Services, and detail screens; remove fake fallbacks only after real/empty/offline states are verified.
6. Add production opportunity providers and expiry enforcement before reconnecting Jobs/Housing.
7. Add official legal/resource ingestion and citations before allowing AI to answer jurisdictional factual questions.
8. Add opt-in privacy-preserving community discovery; never migrate fake people/posts.
9. Rebuild and inspect the Android bundle/APK so removed data is not retained in generated artifacts.

## Phase 1 completion gate

- [x] Entire repository inventoried for production-facing data paths.
- [x] Screens, services, models, context, API adapters, backend routes, Supabase migrations, JSON/static data, caches, and fallbacks traced.
- [x] Hardcoded cities/countries and static coordinates identified.
- [x] Fake distances, places, services, jobs, housing, people, community posts, ratings, hours, phone numbers, addresses, and mutations identified.
- [x] Static/outdated legal, immigration, healthcare, employment, housing, safety, and price information identified.
- [x] Silent demo fallback paths documented.
- [x] Every finding assigned a production replacement and priority.
- [x] No replacement implementation performed.

**Phase 1 conclusion:** The audit is complete. Phase 2 architecture work may begin only after this audit is accepted. The current build must continue to be treated as containing demo/static data even where individual records are labeled `verified: true` or `demo: false`.
