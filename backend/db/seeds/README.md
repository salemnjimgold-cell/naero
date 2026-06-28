# Seed Data

No user/profile seed data is included in Sprint 3.

Reason: `profiles`, `user_settings`, and `consent_events` are owned by Supabase Auth users. Seeding fake user-owned rows without matching `auth.users` records would create misleading local behavior and weaken the RLS model.

When Naero adds public reference tables such as city content, verified services, or categories, seed data should be added here as idempotent SQL files and applied to staging first.
