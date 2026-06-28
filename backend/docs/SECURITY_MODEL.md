# Sprint 2 Backend Security Model

## Boundaries

- The mobile app may contain only public configuration such as `EXPO_PUBLIC_NAERO_API_URL`.
- Supabase service-role keys must exist only in backend deployment secrets.
- Backend logs must redact tokens, credentials, email, phone, and precise location fields.
- Protected endpoints require a valid Supabase JWT.

## Data Minimization

The profile schema intentionally stores integration-relevant data only. Precise GPS history, nearby users, chat transcripts, and AI memory are not part of this sprint.

## Fail-Closed Rules

- If JWT verification is missing, protected endpoints return `AUTH_NOT_CONFIGURED`.
- If Supabase admin access is missing, profile reads/writes return `SUPABASE_NOT_CONFIGURED`.
- No development bypass accepts arbitrary tokens.

## Future Work

- Add rate limiting before public alpha backend exposure.
- Add request ids and centralized error reporting.
- Add account deletion and data export.
- Add AI prompt redaction and provider audit logs when the AI gateway is approved.
