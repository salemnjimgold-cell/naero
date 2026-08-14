# LDE-2 smart geographic cache

LDE-2 is an in-process cache of reusable place discovery results. It is not a user-location cache and is not persisted. A process restart clears it.

## Geographic identity

The cache divides latitude into approximately 500 metre rows. Each row divides longitude using the cosine of the row centre latitude, so longitudinal cells remain approximately 500 metres wide away from the poles. Longitude cell counts are bounded to at least one, and longitude is normalized at the antimeridian. Keys contain only integer cell identity, never request coordinates.

Providers are queried from the deterministic cell centre. A conservative 400 metre traversal margin is added before choosing provider coverage. This covers movement from the cell centre to any point in a nominal 500 metre cell without claiming unfetched coverage.

## Radius coverage

Coverage buckets are 1 km, 2 km, 5 km, 10 km, 25 km, and 50 km. The selected bucket must cover the exact request radius plus the 400 metre cell margin. Requests whose safe expanded coverage exceeds 50 km bypass cache reuse. Every response is revalidated, distance-ranked, filtered to the exact request radius, and sliced to the exact requested limit.

## Key and capacity

The logical key contains:

- resolver/schema version;
- source-policy version;
- geographic cell;
- canonical category;
- radius coverage bucket;
- country code;
- response language.

It excludes exact coordinates, result limit, request ID, user ID, device ID, and session ID. Acquisition requests use a bounded capacity of 50 results. An entry records whether provider coverage was complete; an incomplete entry cannot claim sufficiency for a later request needing more usable results than it contains.

## Lifetime and eviction

Fresh and stale windows retain their existing meanings. Stale results are returned only as a truthful fallback after live discovery fails, and results beyond the stale window are deleted. The cache uses access-order LRU eviction with a default maximum of 250 entries. `NEARBY_CACHE_MAX_ENTRIES` may lower or raise this within the enforced maximum of 2,000 entries.

No background timer, disk persistence, database, movement history, or new public API is introduced. The existing public nearby response contract and provider trust roles remain unchanged.
