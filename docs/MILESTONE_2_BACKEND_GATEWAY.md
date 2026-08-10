# Milestone 2 — Secure Backend Gateway

## Scope and architecture

Milestone 2 establishes a provider-neutral, versioned boundary between the mobile app and future location/data providers. It adds no PostGIS schema, nearby-place integration, opportunities implementation, community discovery, or AI location context.

```text
Mobile location service
  -> centralized Naero API client
    -> /api/v1 gateway
      -> validation + rate limit + normalized response/error
        -> provider contract
          -> optional Nominatim reverse-geocoder adapter
```

Route handlers depend on provider contracts rather than Google, OpenStreetMap, Nominatim, or Supabase/PostGIS implementations. Contracts are defined for reverse geocoding, nearby search, place details, opportunities, and verified Naero services. Only the Nominatim reverse-geocoder adapter is implemented; it is optional and disabled safely when unconfigured.

Legacy `/v1/*` endpoints remain unchanged to avoid breaking authentication, profiles, notifications, uploads, moderation, or AI.

## Endpoints

| Method | Endpoint | Status in Milestone 2 |
|---|---|---|
| GET | `/api/v1/health` | Implemented |
| GET | `/api/v1/location/reverse-geocode` | Implemented through the provider abstraction |
| GET | `/api/v1/nearby` | Validates input, then returns `PROVIDER_NOT_CONFIGURED`; never returns demo places |
| — | `/api/v1/places` | Namespace reserved; not implemented |
| — | `/api/v1/services` | Namespace reserved; not implemented |
| — | `/api/v1/opportunities` | Namespace reserved; not implemented |
| — | `/api/v1/community` | Namespace reserved; not implemented |

Reverse geocoding accepts `latitude`, `longitude`, optional `language`, and optional `countryCode`.

## Response contract

Gateway success:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "opaque-id",
    "timestamp": "ISO-8601",
    "source": "naero-or-provider",
    "cached": false
  }
}
```

Gateway error:

```json
{
  "success": false,
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "Safe public message"
  },
  "meta": {
    "requestId": "opaque-id",
    "timestamp": "ISO-8601"
  }
}
```

Internal exceptions, upstream response bodies, keys, environment values, database details, and stack traces are never included.

## Validation

- Latitude: finite numeric value from -90 through 90.
- Longitude: finite numeric value from -180 through 180.
- Radius: 1 through 50,000 metres; default 5,000.
- Result limit: integer 1 through 50; default 20.
- Categories: `all`, `healthcare`, `transport`, `food`, `government`, `education`, `community`.
- Languages: `en`, `ar`, `fr`, `hu`.
- Country code: optional two-letter code, normalized to uppercase.
- Cursor: optional URL-safe token, maximum 256 characters.
- Provider timeout: positive configuration value capped at 15,000 ms.
- Request IDs: optional client ID must contain only safe characters and be at most 128 characters; otherwise the server generates a UUID.

Null, missing, non-finite, malformed, or out-of-range coordinates are rejected.

## Error codes

`INVALID_COORDINATES`, `INVALID_RADIUS`, `INVALID_CATEGORY`, `INVALID_LANGUAGE`, `INVALID_LIMIT`, `INVALID_COUNTRY_CODE`, `INVALID_CURSOR`, `LOCATION_NOT_FOUND`, `PROVIDER_NOT_CONFIGURED`, `PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`, `RATE_LIMITED`, `UNAUTHORIZED`, `FORBIDDEN`, and `INTERNAL_ERROR`.

## Security and privacy

- Equivalent Helmet-style response headers are applied centrally, including HSTS, CSP, frame denial, content-type protection, referrer policy, and restrictive permissions policy.
- CORS sends an allow-origin header only for configured origins.
- Gateway requests are rate-limited per network address.
- Existing JSON request bodies remain capped at 64 KiB.
- Provider calls have abort-based timeout protection.
- Request paths are logged without query strings, so coordinates are not logged.
- The existing structured logger recursively redacts coordinates, location, authorization, cookies, tokens, API keys, email, and phone fields.
- Exact coordinates are not logged. The optional non-production debug flag is parsed but this milestone adds no coordinate logging.
- Provider secrets exist only in backend environment configuration.

## Environment

Backend placeholders:

```text
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
NOMINATIM_BASE_URL=
OVERPASS_API_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_RATE_LIMIT_WINDOW_MS=
API_RATE_LIMIT_MAX=
PROVIDER_TIMEOUT_MS=
ALLOWED_ORIGINS=
```

The mobile app receives only `EXPO_PUBLIC_NAERO_API_URL`. No provider key uses an `EXPO_PUBLIC_` variable. Optional providers do not prevent startup.

## Mobile behavior

The Milestone 1 foreground-location flow now asks the centralized Naero client to reverse-geocode through `/api/v1/location/reverse-geocode`. The client provides a configurable base URL, timeout, request IDs, normalized network/timeout/cancellation errors, and caller cancellation.

If the gateway or optional provider is unavailable, the existing Expo device reverse-geocoder remains a compatibility fallback. Manual city selection, permission denial, GPS-disabled behavior, cached state, and offline usability remain intact. Unavailable address fields remain null; no city, district, postal code, or country is invented. Nearby UI is not connected.

## Rollback

There is no database migration.

1. Restore `src/services/locationService.js` to Expo-only reverse geocoding.
2. Restore the previous centralized mobile API client if request IDs/cancellation must be removed.
3. Remove the `/api/v1/*` gateway dispatch from `backend/src/server.js`.
4. Remove `backend/src/gateway`, `backend/src/routes/gateway.js`, and the security-header helper.
5. Restore the prior CORS and request logger behavior only if required; retaining restricted CORS and query-free logging is safer and backward compatible.
6. Remove the new gateway environment placeholders and test scripts.

Old clients continue using legacy `/v1/*`, so rollback requires no data conversion or client migration.
