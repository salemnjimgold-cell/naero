# LDE-3 persistent discovered-place store

LDE-3 adds a backend-managed PostGIS L2 between the LDE-2 process cache and live discovery. Resolver order is Naero Verified, persistent Discovered, Geoapify, configured Google, then controlled OSM fallback. Verified and Discovered remain different trust roles: persisted third-party records always return `verified=false`, retain provider identity/attribution, and can never overwrite curated `verified_services`.

## Schema and privacy

Migration 006 creates `discovered_places`, `discovered_place_sources`, and `discovery_cells`. Places hold normalized public-place facts and expiry; sources enforce unique `(provider, provider_record_id)` identity; cells hold only the LDE-2 coarse cell ID, category, bucket, country, language, coverage count, and freshness. No user, device, session, request, exact search origin, or movement-history column exists. GiST and lookup indexes support bounded nearby queries. Direct tables have forced RLS and no anon/authenticated grants. Both reads and mutations require the backend service role; mobile reads continue exclusively through the backend contract.

## Freshness and failures

The initial safe TTL is seven days. Fresh records participate before live discovery. Expired records never establish fresh sufficiency; they may be returned only after live failure and are marked stale and partial. LDE-2 remains the L1 fast path and is cleared by process restart; L2 survives restart. Live results remain available even if background persistence fails, with a sanitized `PERSISTENCE_FAILED` event.

## Write, identity, and licensing policy

Only normalized Geoapify results with a stable identity, supported category, name, valid coordinates, matching country, attribution, and no permanent-closure signal are eligible. Database uniqueness plus locked upsert makes repeat/concurrent identity handling safe. Cross-provider fuzzy merging is deliberately absent.

The existing LDE-1 decision says persistent storage requires rechecking the actual subscribed plan and applicable current terms. That evidence is not recorded yet. Consequently `DISCOVERED_PLACE_STORE_ENABLED` and `DISCOVERED_PLACE_PERSISTENCE_ENABLED` both default to false, and Geoapify persistence must remain disabled until product/legal approval records the applicable terms. Enabling reads requires Migration 006 first; enabling writes is a separate gate.

## Rollback and future refresh

Rollback 006 removes only LDE-3 functions/tables and retains Migration 005/PostGIS. Apply and rollback must be verified in an isolated database before production authorization. A future bounded refresh job may refresh coarse cells; LDE-3 introduces no scheduler, worker, analytics, or tracking.
