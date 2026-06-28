# Staging Deployment Workflow

Sprint 3 deploys staging first. Production must not be configured until staging health checks and smoke tests pass.

## Recommended Provider

Use Render or another managed HTTPS container host for alpha. The backend has no external runtime dependencies, so a small Docker web service is enough.

Render scaffold: `deploy/render/render.yaml`.

## Staging Steps

1. Create a Supabase staging project.
2. Apply `backend/db/migrations/001_core_auth_profiles.sql`.
3. Create a backend web service from `Dockerfile.backend`.
4. Configure secrets in the provider secret manager:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `CORS_ORIGINS`
   - `PUBLIC_BASE_URL`
   - optional `MONITORING_WEBHOOK_URL`
5. Enable provider-managed HTTPS.
6. Set health check path to `/health`.
7. Confirm JSON logs are visible in the provider log stream.
8. Configure a monitoring webhook if available.
9. Run:

```powershell
.\scripts\backend-health.ps1 https://staging-api.naero.app
```

10. Run smoke tests against staging after `BACKEND_URL` is configured:

```powershell
$env:BACKEND_URL = "https://staging-api.naero.app"
.\scripts\backend-health.ps1
```

## Production Promotion

Promote to production only after staging has:

- Passing health check.
- Passing smoke tests.
- Supabase RLS verified.
- Structured logs verified.
- Monitoring hook verified.
- No secrets in repository.
