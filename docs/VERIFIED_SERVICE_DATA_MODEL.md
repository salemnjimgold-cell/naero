# Verified Service Data Model

## Tables

### `service_categories`

`id`, unique normalized `key`, `name`, nullable `description`/`icon_key`, `active`, and timestamps. The migration inserts only the 24 approved category definitions.

### `verified_services`

Identity and classification:

- `id`, `category_id`, `name`, nullable `description`, `organization_name`

Governance:

- `status`: `active | inactive | suspended`
- `verification_status`: `draft | pending | approved | rejected | expired`
- `confidence`: `high | medium | low`
- `source_type`: `government | official | ngo | partner | manual_review`
- nullable `source_organization`, `source_url`

Public contact/location:

- nullable phone, email, website, address, city, district, region, postal code, country code
- required `extensions.geography(Point, 4326)` location
- nullable languages, accessibility, structured opening hours, free/appointment flags

Lifecycle:

- `active`, nullable last-verification and expiration times, timestamps
- nullable `created_by` and `reviewed_by`

Nullable fields are preserved as unknown. `0,0`, blank names, invalid country codes/states, and expiry earlier than verification are rejected.

### `service_verification_log`

Append-only service lifecycle record: service, constrained action, previous/new status, evidence URL, internal notes, actor, and timestamp. It has no public policy or table grant.

### `service_provider_links`

Maps one verified service to at most one ID per `google`, `osm`, or `official` provider and prevents an external ID from linking to multiple services. Links are queried only by the backend service role for deduplication and are not returned by the public RPC.

## Verification lifecycle

1. A trusted backend process creates a `draft` with evidence and an audit entry.
2. It moves to `pending` for an authorized reviewer.
3. Approval sets `verification_status=approved`, `last_verified_at`, reviewer, optional expiry, and an audit entry.
4. Reverification refreshes evidence/timestamps and writes `reverified`.
5. Expired records are automatically hidden by RLS/RPC even before a maintenance process marks them `expired`.
6. Deactivation sets `active=false` or `status=inactive` and writes a log.

No mobile/admin UI is introduced. Database administration uses the service-role credential only from a trusted backend environment.

## Public contract

Public/mobile callers cannot select `verified_services` directly. They can execute `nearby_verified_services`, which returns only identifiers, normalized public fields, coordinates/distance, verification metadata, attribution, and navigation URL. It excludes email, evidence URL, accessibility internals, actors, notes, and provider links.

## Merge precedence

Explicit provider links are strongest. Otherwise, category-compatible normalized name, proximity, address, website, and phone evidence are required.

When merging:

- verified Naero name/non-null fields win;
- null verified fields may be filled from truthful external fields;
- `verified=true`, Naero confidence, and last-verification time are preserved;
- all source attribution is preserved;
- similar names without sufficient identity evidence remain separate.
