# LDE-4 demand-driven coverage lifecycle

LDE-4 completes the request-driven L1/L2/L3 architecture by making coarse persistent coverage state explicit. It adds no crawler, scheduler, queue, worker, provider, mobile requirement, or background location behavior.

## State model

Absence of a compatible `discovery_cells` row is `UNSEEN`. Stored or derived states are `SUFFICIENT`, `PARTIAL`, `EXHAUSTED`, `STALE`, `REFRESHING`, and `REFRESH_FAILED`.

- `SUFFICIENT` records a successful acquisition whose currently usable results satisfied the request. Actual normalization, exact-radius filtering, deduplication, ranking, and requested-limit checks remain authoritative.
- `PARTIAL` means usable coverage exists or a chain completed incompletely, but exhaustion was not proved.
- `EXHAUSTED` requires a successful applicable live-provider chain, no provider failure, a completed chain, and at least one successfully called live provider. Zero usable results are valid truthful exhaustion.
- `STALE` is derived when the last successful coverage has expired.
- `REFRESHING` has a finite atomic claim.
- `REFRESH_FAILED` preserves the last successful status, records only a fixed safe failure code, and applies bounded retry backoff.

Provider failure can never create `EXHAUSTED`. Metadata never overrides gateway validation. If metadata and usable records disagree, the resolver continues toward live discovery. A place missing from one refresh is not closed or deactivated.

## Refresh claim and retry

`manage_discovery_coverage` is a single service-role-only, `SECURITY DEFINER` RPC with a fixed search path and four allowlisted operations: `read`, `claim`, `complete`, and `fail`.

A claim lasts 90 seconds. This covers the bounded sequential provider chain while remaining self-recovering after a crashed request. A server-generated opaque claim nonce binds completion/failure to the current lease, preventing an expired owner from completing a replacement claim; it is not a user or request identity and is never logged. A failed refresh receives a 60-second backoff. No caller, request, user, device, session, coordinate, or IP identity is stored. An atomic conditional update permits only one compatible claim owner; another caller returns available data truthfully without starting parallel live traffic.

## Resolver behavior

L1 remains the first fast path. Naero Verified remains the trusted source and is never modified by LDE-4. L2 records are read and validated before live providers.

- Actual sufficient L2 results stop the chain as before.
- Fresh complete `EXHAUSTED` coverage suppresses repeat live calls only when demand refresh is enabled.
- `PARTIAL`, `STALE`, or `UNSEEN` coverage attempts a claim and continues to existing live providers when acquired.
- `REFRESHING` and backed-off `REFRESH_FAILED` states suppress parallel refresh traffic but never claim fresh sufficiency.
- Failed lifecycle reads or claims fail toward the existing live-provider path.
- Failed lifecycle writes cannot fail an otherwise successful nearby response.

The existing provider order, cache geometry, source roles, normalization, permanent-closure filter, conservative deduplication, ranking, and public response contract are unchanged.

## Successful empty coverage

Coverage completion is independent of persisted place rows. A successful applicable chain returning zero usable records can store a complete `EXHAUSTED` cell. A compatible fresh request can then avoid repeating the same acquisition. A failed, skipped, circuit-open, or incomplete provider chain cannot establish that state.

## Feature flags

- `DISCOVERY_COVERAGE_INTELLIGENCE_ENABLED=false`
- `DISCOVERY_DEMAND_REFRESH_ENABLED=false`

Both default to false. With intelligence disabled, behavior is exactly LDE-3. Demand refresh is effective only when intelligence is also enabled. Intelligence alone reads and emits shadow lifecycle decisions but does not claim or suppress live traffic. Demand refresh enables claims, lifecycle completion, backoff, and tested suppression.

## Privacy, security, and observability

Coverage identity uses the existing coarse cell ID plus category, radius bucket, country, and language. Tables and RPCs remain forced-RLS/service-role-only. Logs never contain the cell ID, coordinates, URLs, bodies, headers, credentials, or user/device/session identity.

Allowlisted diagnostics contain request correlation, lifecycle stage, state, claim outcome, bounded count, completeness, safe error code, elapsed time, and whether live traffic was suppressed.

## Provider cost and licensing

Cost reduction is demand-driven: known fresh exhausted coverage and active refresh claims prevent duplicate calls. There is no proactive geographic acquisition. Geoapify/OSM/ODbL attribution and provider identity remain unchanged. Material geographic expansion or scheduled acquisition still requires renewed plan/licensing review.

## Rollout and rollback

1. Apply Migration 007 with both flags off.
2. Deploy code with both flags off.
3. Enable coverage intelligence for shadow verification.
4. Enable demand refresh after state, privacy, and concurrency acceptance.
5. Test bounded successful, empty, partial, stale, failed, and contended requests.

Rollback begins by disabling demand refresh and coverage intelligence, immediately restoring LDE-3 behavior. The additive columns may remain inert. The scoped rollback removes only the LDE-4 RPC, index, constraints, and columns; it does not remove places or alter Migration 005/006.

## Deferred work

Scheduled refresh, closure inference from absence, persistent multi-provider conflation, geographic crawling, Overture ingestion, and Phase 2C remain out of scope. A scheduler should be reconsidered only after observed demand, stale fallback, and provider-cost metrics justify it.
