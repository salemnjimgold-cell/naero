# LDE-1 Geoapify discovery provider

## Contract research snapshot

Verified against Geoapify's official documentation on 2026-08-13:

- Places endpoint: `GET https://api.geoapify.com/v2/places`.
- Authentication: required `apiKey` query parameter. Naero supplies it only from the backend `GEOAPIFY_API_KEY` environment variable.
- Required query scope: one or more `categories` plus a spatial filter or bias. Naero uses `filter=circle:longitude,latitude,radiusMeters` and `bias=proximity:longitude,latitude`.
- Bias orders results near the supplied location; the circle filter remains the hard geographic boundary.
- `limit` supports up to 500, but Naero caps runtime requests at 20 to bound response size and current credit use.
- `lang` accepts two-character ISO 639-1 language codes. Naero passes the already validated gateway language.
- Response: GeoJSON `FeatureCollection` containing Point features and properties including `name`, address components, `lat`, `lon`, `formatted`, `categories`, `distance`, and `place_id`.
- `place_id` is Geoapify's unique place identifier and is preserved as `providerId`; records without it are discarded.
- Country: Naero validates `country_code` from each result against the requested country when supplied. The circle remains the request filter because the Places documentation marks the country filter as coming soon.
- Failures: invalid/missing keys are authentication errors; rate-limit exhaustion can return HTTP 429; invalid requests return 400; upstream failures use 5xx. LDE-1 safely normalizes 400/401/403/429/5xx without exposing provider response bodies and does not retry.
- Attribution: Geoapify requires OpenStreetMap attribution; its free plan additionally requires Geoapify attribution. Naero returns `© OpenStreetMap contributors; Powered by Geoapify` with every accepted result.
- Storage: Geoapify states Places results may be cached, stored, and redistributed subject to attribution. LDE-1 only uses the existing in-memory cache. Before the future persistent store is enabled, the actual subscribed plan and applicable terms must be rechecked and recorded.
- Current published pricing context: Places requests of 20 results or fewer cost one credit; the free plan publishes 3,000 credits/day and up to five requests/second. No real key or plan is configured by LDE-1.

Official sources:

- https://apidocs.geoapify.com/docs/places/
- https://www.geoapify.com/places-api/
- https://www.geoapify.com/pricing/
- https://www.geoapify.com/pricing-details/
- https://www.geoapify.com/how-to-avoid-429-too-many-requests-with-api-rate-limiting/

## Category policy

| Naero category | Geoapify mapping | Policy |
| --- | --- | --- |
| hospital | `healthcare.hospital` | strong generic discovery |
| clinic | `healthcare.clinic_or_praxis` | strong generic discovery |
| pharmacy | `healthcare.pharmacy` | strong generic discovery |
| police | `service.police` | strong generic discovery |
| school | `education.school` | strong generic discovery |
| public_transport | `public_transport` | strong generic discovery |
| bank | `service.financial.bank` | strong generic discovery |
| atm | `service.financial.atm` | strong generic discovery |
| post_office | `service.post.office` | strong generic discovery |
| supermarket | `commercial.supermarket` | strong generic discovery |
| religious_center | `religion.place_of_worship` | strong generic discovery |
| childcare | `childcare` | strong generic discovery |
| community_center | `activity.community_center` | discovery candidate requiring validation |
| language_school | `education.language_school` | discovery candidate requiring validation |
| halal_food | `catering` plus `halal` condition | discovery candidate requiring validation |
| social_services | `service.social_facility` | discovery candidate requiring validation |
| immigration_office | none | Naero-curated/specialized |
| government_office | none | Naero-curated until a sufficiently precise mapping is reviewed |
| legal_aid | none | Naero-curated/specialized |
| ngo | none | Naero-curated/specialized |
| translator | none | Naero-curated/specialized |
| emergency | none | generic hospital presence does not prove emergency availability |
| shelter | none | no reviewed precise human-shelter mapping |
| job_center | none | Naero-curated/specialized |

Unsupported mappings are skipped before any Geoapify request. They are never broadened into generic searches.

## Runtime and privacy

Provider priority is Naero Verified, future Discovered, Geoapify, Google, then OSM. LDE-0 stops after normalized/deduplicated results satisfy the requested limit. Geoapify is backend-only, uses the existing provider timeout and circuit breaker, adds no retry, and never logs its URL, key, coordinates, response body, headers, or user identity.

The existing exact-coordinate GET query-string concern remains deferred to a separate non-breaking privacy milestone. LDE-1 creates no background location behavior, movement history, database schema, or persistent place storage.
