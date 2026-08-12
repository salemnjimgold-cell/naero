# Verified places ingestion

The ingestion CLI is an operator-only backend tool. It is not an HTTP endpoint and is never invoked by the production server. Phase 2B permits only `acquire` and `validate`.

Supported acquisition targets are exactly `vienna hospital` and `gyor hospital`. Acquisition uses bounded HTTPS POST requests to the reviewed Overpass interpreter, creates a deterministic manifest, and performs no database access.

OpenStreetMap data is © OpenStreetMap contributors and licensed under the Open Data Commons Open Database License 1.0. Persisting an OSM-derived registry may create attribution, database-distribution, and share-alike obligations. Product/legal approval is mandatory before any production insertion. The manifest records the attribution and licence metadata; the application must continue surfacing attribution.

## Review workflow

1. Acquire to a new secured manifest file.
2. Validate the file independently.
3. Review accepted, rejected, duplicate, and ambiguous candidates and record the manifest SHA-256.
4. Obtain product/legal approval for ODbL use.
5. Obtain separate authorization for production apply.
6. Apply only the reviewed digest to the exact expected Supabase project. New records remain pending.
7. Approve separately using an authorized reviewer identity.

`apply` and `approve` are deliberately disabled at the Phase 2B CLI boundary. Their workflow engines are tested only through isolated transactional repositories. Credentials must be supplied at runtime in a later phase and must never enter manifests, files, logs, or command output.
