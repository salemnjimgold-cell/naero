# Naero Backend Database Migrations

Sprint 3 uses Supabase SQL migrations.

## Apply Migrations

1. Open the Supabase dashboard for the staging project.
2. Go to SQL Editor.
3. Run `backend/db/migrations/001_core_auth_profiles.sql`.
4. Confirm these tables exist:
   - `public.profiles`
   - `public.user_settings`
   - `public.consent_events`
5. Confirm RLS is enabled on all three tables.
6. Repeat for production only after staging smoke tests pass.

## Rollback

Before alpha user data exists, rollback can be manual by dropping the three Sprint 2 tables.

After alpha user data exists, create explicit down migrations and take a Supabase backup before applying schema changes.

## Rule

Never apply production migrations before they pass in staging.
