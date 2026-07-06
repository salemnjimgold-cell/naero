# Naero Database Seed Data

## Overview

Seed data provides sample records for local development and staging environments. Seed data is never applied to production.

## Available Seeds

| File | Description | Tables |
|------|-------------|--------|
| `001_sample_places.sql` | 12 sample places across 6 categories in Budapest | `places` |

## Applying Seeds

1. Ensure migrations 001 and 002 have been applied.
2. Open Supabase SQL Editor for the target environment (dev or staging).
3. Run the seed file(s) in order.
4. Verify data exists:

```sql
select count(*) from public.places;
```

## Seed Policy

- **User-owned tables** (profiles, ai_conversations, saved_places): No seed data. These are created by real user activity.
- **Public reference tables** (places): Seed data is acceptable for development/staging.
- **User-generated tables** (reviews, messages): Seeds are commented out by default — only enable when testing against known auth.users IDs.
- Seeds must be idempotent (safe to re-run). Use `insert ... on conflict do nothing` if conflicts are possible.
- Do not commit real user data or PII as seed data.

## Adding New Seeds

1. Create the next numbered file: `002_<descriptive_name>.sql`.
2. Add an entry to this README.
3. Ensure the seed is idempotent.
4. Test by applying in staging before committing.
