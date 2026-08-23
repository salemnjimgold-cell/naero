# LDE-5 operational coverage and provider-cost intelligence

LDE-5 observes the accepted nearby resolver. It does not acquire places, enforce provider budgets, alter provider order, change sufficiency, or influence L1/L2/LDE-4 decisions.

## Measurements

Daily aggregates measure nearby requests, L1 fresh and stale use, L2 sufficiency, LDE-4 claim acquisition/contention/completion/failure, live-provider calls/outcomes/net normalized yield, final partial/stale/exhausted responses, and bounded latency buckets. Provider usage is measured in neutral request and result units; no monetary price is assumed.

## Privacy boundary

Metrics never contain exact coordinates, fine discovery-cell IDs, user/account/device/session/request identity, IP addresses, language, request URLs, provider URLs, headers, bodies, tokens, place identities, or movement sequences.

The server derives an `op5-v1` operational region using a latitude-adjusted approximately 5 km grid. The identifier exposes a coarse aggregate grid location and is not claimed to be cryptographically irreversible. It is deliberately distinct from the approximately 500 m L1/L2 cell. Metrics use only UTC day, coarse region, country, canonical category, and radius bucket. There is no per-request metrics table.

## Aggregation and failure

Each process aggregates counters immediately in a fixed-cardinality map. It stores no event queue. A snapshot of at most one bounded batch is removed before a best-effort sequential flush through the service-role RPC. Failed flush entries may be lost; process termination may lose buffered telemetry. Buffer overflow drops new metric keys. In every case nearby correctness wins and the resolver does not await telemetry persistence.

Database increments are atomic and saturating, so multiple Render instances cannot overwrite one another. Migration 008 forces RLS, removes public/anon/authenticated access, validates every fixed dimension and counter, and permits only service-role RPC execution.

## Retention

Operational aggregates have a 30-day target. The service-role-only prune RPC deletes at most 1,000 metrics rows older than a supplied cutoff no newer than 30 days. It is retry-safe and touches no places, coverage lifecycle, or Naero Verified data. LDE-5 installs no scheduler; invocation requires a later separately authorized operational procedure.

## Flags and rollout

- `DISCOVERY_OPERATIONAL_METRICS_ENABLED=false`
- `DISCOVERY_OPERATIONAL_METRICS_PERSISTENCE_ENABLED=false`

Persistence is ineffective unless collection is enabled. Rollout order is source with both flags off, separately gated Migration 008, collection-only verification, then persistence activation. Rollback disables persistence and then collection; no resolver rollback is needed.

## LDE-6 evidence

The aggregates should determine whether provider quotas, neighboring-cell duplication, retention/GC, or demand warming is the next constraint. LDE-5 itself must never use the measurements to alter acquisition or verification. Naero Verified remains human/approved only.
