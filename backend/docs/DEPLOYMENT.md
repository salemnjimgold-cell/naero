# Naero Backend Deployment

Sprint 3 deployment is staging-first. Production must not be deployed until staging passes all checks.

## Provider Requirements

Use a managed container host that provides:

- HTTPS termination.
- Environment secret management.
- Health checks.
- Structured log access.
- Rollback to a previous deploy.

Render is documented in `deploy/render/render.yaml`, but the backend can run on any Node/Docker host.

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `NAERO_SERVICE_ENV` | Yes | `staging` or `production` |
| `PORT` | Yes | Container port (8787) |
| `PUBLIC_BASE_URL` | Yes | Public URL of the backend |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role key (server-side only) |
| `MONITORING_WEBHOOK_URL` | No | Monitoring event webhook |
| `MONITORING_SAMPLE_RATE` | No | Event sampling rate (0-1) |

### JWT Verification

The backend supports two JWT verification methods (tried in order):

| Method | Variable | Algorithm | When to use |
|--------|----------|-----------|-------------|
| **JWKS** (primary) | Set `SUPABASE_URL` | ES256 (ECC P-256) | Required for new Supabase JWT signing keys |
| **Legacy HS256** (fallback) | `SUPABASE_JWT_SECRET` or `JWT_SECRET` | HS256 (HMAC) | Only if JWKS is unavailable |

`SUPABASE_URL` enables automatic JWKS-based verification via `{SUPABASE_URL}/.well-known/jwks.json`. The legacy `SUPABASE_JWT_SECRET` is optional and used only for tokens signed with the old shared secret (HS256 algorithm).

Never commit real values.

## GitHub Secrets

For CI/CD via GitHub Actions, configure the following **repository secrets**:

| Secret Name | Maps To |
|-------------|---------|
| `SUPABASE_URL` | `SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |
| `DATABASE_URL` | Direct PostgreSQL connection string (migrations only) |
| `JWT_SECRET` | `SUPABASE_JWT_SECRET` |
| `DEPLOY_HOST` | Deployment server hostname (optional, provider-specific) |
| `DEPLOY_TOKEN` | Deployment auth token (optional, provider-specific) |

Configure these in: GitHub → Repository → Settings → Secrets and variables → Actions

## Environment Validation

The backend validates required variables on startup in production mode. If `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `PUBLIC_BASE_URL`, or `CORS_ORIGINS` are missing, the backend will log the error and throw a fatal exception.

The `/health` endpoint reports `"status": "degraded"` when validation fails, and `"status": "ok"` when all checks pass.

## Staging Deployment

1. Create Supabase staging project.
2. Apply migrations:
   - `backend/db/migrations/001_core_auth_profiles.sql`
   - `backend/db/migrations/002_core_data_tables.sql`
3. Build Docker image:
   ```bash
   docker build -f Dockerfile.backend -t naero-backend .
   ```
4. Deploy to staging web service with `NAERO_SERVICE_ENV=staging`.
5. Configure all required environment variables in the host secret manager.
6. Configure managed HTTPS.
7. Configure `/health` as the health check path (Dockerfile includes HEALTHCHECK directive).
8. Verify:
   ```powershell
   .\scripts\backend-health.ps1 https://staging-api.naero.app
   ```

## Production Deployment

Production is allowed only after staging passes:

- Health check (`status: ok`).
- Smoke tests (`node backend/scripts/smoke.js`).
- RLS verification (run `node tests/qa_backend_foundation.js`).
- Secret scan (no committed `.env` files).
- Structured log review (no secrets in logs).
- Monitoring hook verification (if configured).
- Supabase staging migration verified.

Production must use a separate Supabase project and separate backend service.

## Docker

The Docker build is configured in `Dockerfile.backend` with:
- Base: `node:22-alpine`
- Production-only dependencies (`npm install --omit=dev`)
- Non-root execution
- HEALTHCHECK directive (30s interval, 15s start period)
- Exposed port 8787

Use `.dockerignore` to prevent secrets from entering the build context.

```bash
# Build
docker build -f Dockerfile.backend -t naero-backend .

# Run locally with production env
docker run -p 8787:8787 --env-file backend/.env.production naero-backend

# Or via docker-compose
docker-compose up --build
```

## CI/CD Pipeline

The `.github/workflows/backend.yml` workflow runs on push/PR to main and staging:

1. **Lint** — ESLint on `backend/src/`
2. **Smoke** — In-process smoke tests
3. **Docker build** — Verify the image builds
4. **Deploy** (commented out, requires provider-specific setup)

## Rollback

- Roll back the web service to the previous deploy from the provider dashboard.
- Revert `EXPO_PUBLIC_NAERO_API_URL` if the mobile app was pointed at the failed backend.
- Do not roll back database schema after alpha data exists without a backup and explicit down migration.
