# LDE-3 persistent discovered-place store

LDE-3 adds a backend-managed PostGIS L2 between the LDE-2 process cache and live discovery. Resolver order is Naero Verified, persistent Discovered, Geoapify, configured Google, then controlled OSM fallback. Verified and Discovered remain different trust roles: persisted third-party records always return `verified=false`, retain provider identity/attribution, and can never overwrite curated `verified_services`.

## Schema and privacy

Migration 006 creates `discovered_places`, `discovered_place_sources`, and `discovery_cells`. Places hold normalized public-place facts and expiry; sources enforce unique `(provider, provider_record_id)` identity; cells hold only the LDE-2 coarse cell ID, category, bucket, country, language, coverage count, and freshness. No user, device, session, request, exact search origin, or movement-history column exists. GiST and lookup indexes support bounded nearby queries. Direct tables have forced RLS and no anon/authenticated grants. Both reads and mutations require the backend service role; mobile reads continue exclusively through the backend contract.

## Freshness and failures

The initial safe TTL is seven days. Fresh records participate before live discovery. Expired records never establish fresh sufficiency; they may be returned only after live failure and are marked stale and partial. LDE-2 remains the L1 fast path and is cleared by process restart; L2 survives restart. Live results remain available even if background persistence fails, with a sanitized `PERSISTENCE_FAILED` event.

## Write, identity, and licensing policy

Only normalized Geoapify results with a stable identity, supported category, name, valid coordinates, matching country, attribution, and no permanent-closure signal are eligible. Database uniqueness plus locked upsert makes repeat/concurrent identity handling safe. Cross-provider fuzzy merging is deliberately absent.

The Geoapify persistent-storage licensing gate was completed on 2026-08-14 against the signed-in Naero Production project. The subscribed plan was **Geoapify Free**, with 3,000 credits/day and up to 5 requests/second. Geoapify's current Places documentation permits caching, persistent storage, reuse, and redistribution subject to attribution and underlying open-data licensing. The Free plan requires linked Geoapify attribution, and OpenStreetMap-derived data requires OSM/ODbL attribution.

Persisted Geoapify sources therefore carry fixed structured metadata for `ODbL-1.0`, the ODbL URI, OSM copyright URI, Geoapify URI, current Geoapify terms URI, provider identity, attribution, and retrieval/freshness timestamps. `DISCOVERED_PLACE_STORE_ENABLED` and `DISCOVERED_PLACE_PERSISTENCE_ENABLED` still default to false. Enabling reads requires Migration 006 first; enabling writes remains a separate acceptance gate.

The subscribed plan and applicable terms must be rechecked before material geographic expansion, high-volume accumulation, bulk/reusable data export, or a significant commercial scale change. Any future bulk export or reusable database redistribution must include OSM attribution, ODbL identity and URI, and source/provenance metadata. Substantial systematic extraction requires renewed licensing/legal review. LDE-3 does not implement bulk export.

## Rollback and future refresh

Rollback 006 removes only LDE-3 functions/tables and retains Migration 005/PostGIS. Apply and rollback must be verified in an isolated database before production authorization. A future bounded refresh job may refresh coarse cells; LDE-3 introduces no scheduler, worker, analytics, or tracking.
