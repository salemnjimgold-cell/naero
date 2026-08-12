# Phase 2B.1 human review

The immutable Phase 2B acquisition manifests remain the OSM evidence. `verified-places.review.json` is a separate human decision layer and does not authorize a database write.

Only independently identifiable, top-level hospitals with authoritative corroboration are accepted. Specialty centers with uncertain classification are held; non-hospitals are rejected; surrounding-city facilities are out of target; departments and subordinate sites are deferred until parent/child modeling exists.

The current `verified_services` schema can represent an independent hospital, clinic, diagnostic center, or ambulance station only as flat category records. It has no facility subtype or parent-service relationship. Phase 2C should therefore ingest only accepted top-level hospitals. Child sites, departments, specialty units, and ambulance stations remain deferred.

The review does not copy official-source datasets. Official public pages are used only as corroborating evidence. OSM remains acquisition provenance and retains ODbL attribution/licensing requirements.

The review SHA-256 covers canonical JSON content excluding the volatile `reviewedAt` field and the `reviewDigest` field itself.
