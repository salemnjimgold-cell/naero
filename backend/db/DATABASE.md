# Naero Database Documentation

## Overview

Naero uses Supabase (PostgreSQL) as its database backend. All tables are in the `public` schema. The database is managed through sequential SQL migration files applied via the Supabase SQL Editor.

## Schema Diagram (text)

```
auth.users
  ├── profiles              (1:1, FK: id)
  ├── user_settings         (1:1, FK: user_id)
  ├── consent_events        (1:N, FK: user_id)
  ├── places                (1:N, FK: created_by)
  ├── reviews               (1:N, FK: user_id)
  ├── reports               (1:N, FK: reporter_id)
  ├── reports (resolved_by) (1:N, FK: resolved_by)
  ├── ai_conversations      (1:N, FK: user_id)
  └── saved_places          (1:N, FK: user_id)

public.places
  └── reviews               (1:N, FK: place_id)
  └── saved_places          (1:N, FK: place_id)

public.ai_conversations
  └── ai_messages           (1:N, FK: conversation_id)
```

## Table Reference

### Migration 001 — Auth & Profiles

#### public.profiles
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | uuid | | PK, FK → auth.users(id) ON DELETE CASCADE |
| display_name | text | | nullable |
| home_country | text | | nullable |
| current_city | text | | nullable |
| preferred_language | text | 'en' | NOT NULL |
| migration_reason | text | | nullable |
| arrival_date | date | | nullable |
| housing_status | text | | nullable |
| work_status | text | | nullable |
| ai_personalization_enabled | boolean | false | NOT NULL |
| location_personalization_enabled | boolean | false | NOT NULL |
| created_at | timestamptz | now() | NOT NULL |
| updated_at | timestamptz | now() | NOT NULL |

#### public.user_settings
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| user_id | uuid | | PK, FK → auth.users(id) ON DELETE CASCADE |
| locale | text | 'en' | NOT NULL |
| marketing_opt_in | boolean | false | NOT NULL |
| safety_alerts_enabled | boolean | false | NOT NULL |
| created_at | timestamptz | now() | NOT NULL |
| updated_at | timestamptz | now() | NOT NULL |

#### public.consent_events
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | | FK → auth.users(id) ON DELETE CASCADE |
| consent_type | text | | NOT NULL |
| granted | boolean | | NOT NULL |
| source | text | 'mobile' | NOT NULL |
| created_at | timestamptz | now() | NOT NULL |

### Migration 002 — Core Data Tables

#### public.places
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| name | text | | NOT NULL |
| description | text | | nullable |
| category | text | | NOT NULL |
| subcategory | text | | nullable |
| address | text | | nullable |
| city | text | | NOT NULL |
| country | text | 'Hungary' | NOT NULL |
| latitude | double precision | | nullable |
| longitude | double precision | | nullable |
| phone | text | | nullable |
| website | text | | nullable |
| email | text | | nullable |
| opening_hours | jsonb | | nullable |
| tags | text[] | | nullable |
| verified | boolean | false | NOT NULL |
| source | text | 'user' | NOT NULL |
| source_id | text | | nullable |
| metadata | jsonb | | nullable |
| created_by | uuid | | FK → auth.users(id) ON DELETE SET NULL |
| created_at | timestamptz | now() | NOT NULL |
| updated_at | timestamptz | now() | NOT NULL |

**Indexes**: city, category, tags (GIN), verified, source, created_by, (latitude,longitude), (city,category)

#### public.reviews
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| place_id | uuid | | NOT NULL, FK → places(id) ON DELETE CASCADE |
| user_id | uuid | | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| rating | smallint | | NOT NULL, CHECK (1-5) |
| title | text | | nullable |
| content | text | | nullable |
| language | text | 'en' | NOT NULL |
| helpful_count | integer | 0 | NOT NULL |
| reported | boolean | false | NOT NULL |
| created_at | timestamptz | now() | NOT NULL |
| updated_at | timestamptz | now() | NOT NULL |

**Constraints**: UNIQUE(place_id, user_id) — one review per user per place
**Indexes**: place_id, user_id, rating, created_at, (place_id, rating)

#### public.reports
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| reporter_id | uuid | | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| reportable_type | text | | NOT NULL |
| reportable_id | uuid | | NOT NULL (no FK — polymorphic) |
| reason | text | | NOT NULL |
| description | text | | nullable |
| status | text | 'pending' | NOT NULL |
| resolved_by | uuid | | FK → auth.users(id) ON DELETE SET NULL |
| resolution_note | text | | nullable |
| resolved_at | timestamptz | | nullable |
| created_at | timestamptz | now() | NOT NULL |
| updated_at | timestamptz | now() | NOT NULL |

**Indexes**: status, reporter_id, (reportable_type, reportable_id), resolved_by

#### public.ai_conversations
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| title | text | | nullable |
| topic | text | | nullable |
| message_count | integer | 0 | NOT NULL |
| language | text | 'en' | NOT NULL |
| is_archived | boolean | false | NOT NULL |
| metadata | jsonb | | nullable |
| created_at | timestamptz | now() | NOT NULL |
| updated_at | timestamptz | now() | NOT NULL |

**Indexes**: user_id, created_at, (user_id, is_archived)

#### public.ai_messages
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| conversation_id | uuid | | NOT NULL, FK → ai_conversations(id) ON DELETE CASCADE |
| role | text | | NOT NULL, CHECK ('user','assistant','system') |
| content | text | | NOT NULL |
| content_redacted | boolean | false | NOT NULL |
| tokens_in | integer | | nullable |
| tokens_out | integer | | nullable |
| model | text | | nullable |
| latency_ms | integer | | nullable |
| metadata | jsonb | | nullable |
| created_at | timestamptz | now() | NOT NULL |

**Indexes**: conversation_id, (conversation_id, created_at), role

#### public.saved_places
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| place_id | uuid | | NOT NULL, FK → places(id) ON DELETE CASCADE |
| list_name | text | 'default' | NOT NULL |
| notes | text | | nullable |
| sort_order | integer | 0 | NOT NULL |
| created_at | timestamptz | now() | NOT NULL |

**Constraints**: UNIQUE(user_id, place_id, list_name)
**Indexes**: user_id, place_id, (user_id, list_name), (user_id, list_name, sort_order)

## Row-Level Security Policies

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| profiles | own only | own only | own only | — |
| user_settings | own only | own only | own only | — |
| consent_events | own only | own only | — | — |
| places | public | authenticated | owner only | owner only |
| reviews | public | authenticated | owner only | owner only |
| reports | own only | authenticated | own only | — |
| ai_conversations | own only | own only | own only | own only |
| ai_messages | conversation owner | conversation owner | — | — |
| saved_places | own only | own only | own only | own only |

**Note**: "public" = any user (authenticated or anonymous). "authenticated" = must be logged in via Supabase Auth. "own only" = auth.uid() matches the user_id/owner column. "conversation owner" = resolved through ai_conversations.user_id.

## Trigger Functions

| Function | Applies To | Fires On |
|----------|-----------|----------|
| set_updated_at() | profiles, user_settings, places, reviews, reports, ai_conversations, saved_places | BEFORE UPDATE |

## Naming Conventions

- Tables: `snake_case`, plural (e.g., `ai_messages`, `saved_places`)
- Columns: `snake_case` (e.g., `preferred_language`, `reportable_type`)
- Primary keys: `id uuid primary key default gen_random_uuid()`
- Foreign keys: match the referenced table name (e.g., `user_id`, `place_id`, `conversation_id`)
- Indexes: `idx_<table>_<column(s)>` (e.g., `idx_places_city_category`)
- Triggers: `<table>_set_updated_at`
- RLS policies: descriptive, quoted names (e.g., "Users can read own conversations")
- Check constraints: inline descriptive names (e.g., `one_review_per_user_per_place`)
