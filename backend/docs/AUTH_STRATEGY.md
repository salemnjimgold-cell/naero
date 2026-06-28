# Naero Authentication Strategy

Sprint 2 selects Supabase Auth as the alpha authentication provider.

## Alpha Model

- Guest-first mobile experience remains local so the current app stays usable while backend credentials are not configured.
- Email/password and OAuth should be enabled through Supabase Auth after the project environment is created.
- Mobile clients receive public Supabase anon configuration only.
- Service-role keys stay backend-only.
- Backend protected routes verify Supabase JWTs and fail closed when verification is not configured.

## User Identity

- `auth.users.id` is the canonical user id.
- `public.profiles.id` mirrors `auth.users.id`.
- Personalization consent is stored as profile flags and consent events.

## Not Implemented Yet

- AI gateway authentication.
- OAuth provider setup.
- Account deletion workflow.
- Admin/moderator roles.
