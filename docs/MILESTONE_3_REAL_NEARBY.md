# Milestone 3 — Real Nearby Provider Layer

## Scope

Milestone 3 makes `GET /api/v1/nearby` return only real provider records. It adds no PostGIS, Jobs, Housing, Community discovery, legal ingestion, AI location context, or database migration.

## Architecture and provider priority

```text
Mobile Discover/place flow
  -> centralized apiClient
    -> validated /api/v1/nearby
      -> rounded-coordinate cache
        -> nearby orchestrator
          -> Google Places New (optional primary)
          -> OpenStreetMap Overpass (fallback/complement)
        -> normalize -> radius filter -> deduplicate -> rank -> limit
```

Google is attempted first when a backend API key and category mapping exist. Overpass is used when Google is unconfigured, unsupported for the category, fails, or returns fewer than the requested limit. No static, seeded, mock, or fabricated nearby place is returned.

Provider adapters implement `searchNearby`, `getPlaceDetails`, `healthCheck`, `normalizeResult`, and `mapCategory`. Place details are intentionally deferred because an OSM detail contract cannot yet be implemented consistently without fabrication.

## Normalization and distance

Every displayed result uses the Milestone 3 normalized contract. Missing fields remain null. Results without a provider name, with invalid coordinates, at `0,0`, outside the requested radius, or permanently closed are removed.

Distance is recalculated using Haversine from the request coordinates. Provider textual distances are ignored.

## Deduplication and ranking

Deduplication requires compatible categories and strong identity evidence: provider ID, normalized name plus close coordinates, and shared address/contact evidence. Similar names alone are insufficient. The more complete record is preferred and all applicable attribution is retained.

Ranking prioritizes distance bands, completeness, confidence, reliable open-now status, and provider priority. Ratings do not control rank and missing ratings are not penalized.

## Cache and resilience

The in-memory cache key contains coordinates rounded to two decimals, category, radius, language, and limit—never user identity or exact raw coordinates. Defaults:

- fresh TTL: 5 minutes;
- stale-if-error: 30 minutes;
- provider timeout: 8 seconds, capped at 15 seconds;
- one bounded Overpass retry for 429/5xx;
- circuit opens for 30 seconds after three consecutive provider failures.

Cache metadata (`cached`, `stale`, `partial`, providers, attribution) is returned in the gateway envelope. Redis/shared-cache migration requires implementing the same `get/set/key` interface; route and provider code need not change.

Google caching must follow Google Maps Platform terms. The cache stores normalized combined responses only for the configured TTL and should be reviewed against the production account’s current terms before launch.

## Attribution and privacy

OSM records carry `© OpenStreetMap contributors`; Google records carry `Google Maps`. The mobile Discover header displays returned attribution and a stale-data notice.

Nearby requests are anonymous. Exact coordinates are not logged, stored as search history, or combined with user IDs. Query strings remain excluded from backend logs.

## Mobile integration

The active Discover place flow sends coordinates, radius, category, language, and limit through `apiClient`. It exposes loading, honest empty/location-required/provider-error, stale, and attribution states. The nearby method has no mock fallback.

Legacy active wrappers were also redirected through the gateway, so the mobile runtime no longer imports Google, Overpass, or Nominatim from its place/realtime path. Existing provider modules remain in the repository but are not used by the active flow; removal is deferred to avoid unrelated refactoring.

## Production configuration

```text
GOOGLE_PLACES_API_KEY=          # optional, backend only
OVERPASS_API_URL=https://lz4.overpass-api.de/api/interpreter
PROVIDER_TIMEOUT_MS=8000
NEARBY_CACHE_TTL_MS=300000
NEARBY_CACHE_STALE_MS=1800000
```

Google requires billing/quota configuration and charges according to requested fields/SKU. The adapter uses a field mask and asks only for normalized-contract fields. Quota and billing failures are normalized and fall back to Overpass. Public Overpass has usage/load constraints; production should monitor latency and consider a managed/self-hosted instance.

## Rollback

No database rollback is required.

1. Remove nearby-service construction from `backend/src/routes/gateway.js`.
2. Restore `/api/v1/nearby` to the Milestone 2 `PROVIDER_NOT_CONFIGURED` response.
3. Remove the category registry, nearby core/cache, provider adapters, and service.
4. Restore Discover to its pre-Milestone 3 data path only if accepting mock nearby content is explicitly approved; otherwise retain the honest unavailable state.
5. Remove the new cache environment settings and tests.

Reverse geocoding and all Milestone 2 gateway behavior remain compatible.
