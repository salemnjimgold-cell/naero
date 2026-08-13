# LDE-0 resolver and Phase 2C safety contract

## Resolver

Nearby sources have explicit internal roles: `VERIFIED`, `DISCOVERED`, and `LIVE`. Fresh and stale are cache states, not trust roles. LDE-0 has no discovered-place provider or persistent place store.

The resolver calls verified/discovered sources before live sources, preserving configured order within a tier. After every successful source it normalizes and conservatively deduplicates the accumulated records. It stops when the requested limit is satisfied. Otherwise it continues through live providers in their existing Google-then-OSM order. A failed optional source produces partial success when usable records exist. A successful empty response remains distinct from total provider failure. Stale cache fallback remains explicitly stale and partial.

The public `/api/v1/nearby` envelope remains backward compatible. `coverageStatus`, `sourcesAttempted`, and `sourcesSucceeded` are additive metadata.

## Phase 2C reviewed batch

Phase 2C is bound to `phase-2b/verified-places.review.json` and canonical digest `cb47329fe4f8280d53318ebe1c83b9ac9e2e6a4495b60a1331ff8b7841c52f76`. Both immutable acquisition manifests must validate and match the review's source-manifest references. All 33 acquisition identities must appear exactly once in the review. Only 18 Vienna and one Győr `ACCEPT` decisions can enter the write candidate set.

The write projection preserves OSM provider identity and acquisition evidence while applying an explicit reviewed display-name override. `HOLD`, `REJECT`, `OUT_OF_TARGET`, and `CHILD_FACILITY` cannot enter the batch. The legacy acquisition-manifest apply and arbitrary-service-ID approval functions fail closed. Production execution remains disabled in the CLI until a separately reviewed repository adapter is provided.

Approval resolves the same digest-tagged provider identities and requires exactly 19 unique services in pending/already-approved states. Missing, extra, duplicate, or unreviewed links fail closed. Repeated preflight/apply/approval is deterministic and cannot broaden the batch.

Recovery in LDE-0 is preflight-only. Before approval the exact batch may later receive a separately authorized transactional unapproved-batch deletion implementation. After any approval, recovery must use targeted inactive/rejected transitions plus audit events. No recovery mutation is implemented or executed here.

## Privacy follow-up

The resolver and reviewed-batch workflow do not log coordinates, provider request bodies, location-bearing URLs, credentials, or user/location combinations. No movement history or background location is introduced. Exact nearby coordinates remain in the existing GET query string; proxy/query-string retention must be reviewed in a later non-breaking privacy milestone, followed if warranted by an additive POST search endpoint. LDE-0 does not change the mobile contract.
