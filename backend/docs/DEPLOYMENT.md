# Naero Backend Deployment

Sprint 3 deployment is staging-first.

## Provider Requirements

Use a managed container host that provides:

- HTTPS termination.
- Environment secret management.
- Health checks.
- Structured log access.
- Rollback to a previous deploy.

Render is documented in `deploy/render/render.yaml`, but the backend can run on any Node/Docker host.

## Required Environment Variables

- `NODE_ENV=production`
- `NAERO_SERVICE_ENV=staging` or `production`
- `PORT`
- `PUBLIC_BASE_URL`
- `CORS_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- optional `MONITORING_WEBHOOK_URL`
- optional `MONITORING_SAMPLE_RATE`

Never commit real values.

## Staging Deployment

1. Create Supabase staging project.
2. Apply `backend/db/migrations/001_core_auth_profiles.sql`.
3. Deploy `Dockerfile.backend` to the staging web service.
4. Configure all required environment variables in the host secret manager.
5. Configure managed HTTPS.
6. Configure `/health` as the health check path.
7. Run:

```powershell
.\scripts\backend-health.ps1 https://staging-api.naero.app
```

## Production Deployment

Production is allowed only after staging passes:

- Health check.
- Smoke tests.
- RLS verification.
- Secret scan.
- Structured log review.
- Monitoring hook verification.

Production must use a separate Supabase project and separate backend service.

## Rollback

- Roll back the web service to the previous deploy from the provider dashboard.
- Revert `EXPO_PUBLIC_NAERO_API_URL` if the mobile app was pointed at the failed backend.
- Do not roll back database schema after alpha data exists without a backup and explicit down migration.
