# Production Infrastructure Report

**Date**: 2026-06-29
**Goal**: Prepare Naero backend for safe deployment before Sprint 4 AI Platform

---

## Changes Made

### New Files
| File | Purpose |
|------|---------|
| `.dockerignore` | Prevents `.env*`, `node_modules/`, `.git` from entering Docker build context |
| `.github/workflows/backend.yml` | CI skeleton: lint, smoke test, Docker build, deploy (commented) |

### Modified Files
| File | Change |
|------|--------|
| `Dockerfile.backend` | Added `HEALTHCHECK` directive (30s interval, 15s start period, 3 retries) |
| `docker-compose.yml` | Fixed port mapping: `3000:3000` → `8787:8787` (container listens on 8787) |
| `backend/src/config/env.js` | Added `validateEnv()` function; added `JWT_SECRET` fallback for backward compat |
| `backend/src/server.js` | Calls `validateEnv()` on startup — throws fatal in production if vars missing |
| `backend/src/routes/health.js` | Reports `status: degraded` when validation fails, `status: ok` when all pass |
| `backend/docs/DEPLOYMENT.md` | Full rewrite: GitHub Secrets docs, env validation, Docker instructions, CI/CD pipeline |

## Verification Results

| Test | Result |
|------|--------|
| Docker image build | ✅ `naero-backend:test` built successfully (241B context — `.dockerignore` working) |
| Docker health endpoint | ✅ `status: ok`, `validation.ok: true`, all Supabase configs configured |
| Healthcheck script against Docker | ✅ "Naero backend healthcheck passed" |
| Validation failure mode | ✅ Container crashes with expected error when env vars missing |
| Smoke tests | ✅ Passed |
| Backend QA tests | ✅ Passed |
| Frontend files modified | ✅ **None** — `src/` untouched |

## Production Environment Validation

The backend now validates required variables on startup in production mode:

| Variable | Status |
|----------|--------|
| `SUPABASE_URL` | ✅ Checked |
| `SUPABASE_ANON_KEY` | ✅ Checked |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Checked |
| `SUPABASE_JWT_SECRET` (or legacy `JWT_SECRET`) | ✅ Checked (with fallback) |
| `PUBLIC_BASE_URL` | ✅ Checked |
| `CORS_ORIGINS` | ✅ Checked |

In production mode, missing vars cause a fatal error: `"Production environment validation failed"`.
In non-production mode, missing vars log a warning and allow startup to continue.

The `/health` endpoint exposes validation status:
- `status: ok` + `validation: { ok: true }` — all checks pass
- `status: degraded` — validation failed (no `validation` field in non-production)

## GitHub Actions

Workflow at `.github/workflows/backend.yml`:
- **Triggers**: push/PR to `main` and `staging` on backend paths
- **Lint job**: ESLint on `backend/src/`
- **Smoke job**: In-process smoke test
- **Docker build job**: Verify image builds
- **Deploy job**: Commented out — requires provider-specific setup

## GitHub Secrets Required

Configure these in GitHub → Repository → Settings → Secrets and variables → Actions:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key |
| `DATABASE_URL` | Direct PostgreSQL connection (migrations) |
| `JWT_SECRET` | JWT signing/verification secret |
| `DEPLOY_HOST` | Deployment host (provider-specific) |
| `DEPLOY_TOKEN` | Deployment auth (provider-specific) |

## Docker Architecture

```
Dockerfile.backend:
  - Base: node:22-alpine
  - Deps: npm install --omit=dev (production only)
  - Port: 8787
  - HEALTHCHECK: node scripts/healthcheck.js http://127.0.0.1:8787
  - CMD: node src/server.js

.dockerignore:
  - Excludes: .env, .env.* (except .example), node_modules/, .git/

docker-compose.yml:
  - Port: 8787:8787
  - Restart: unless-stopped
  - Env file: .env (root)
```

## Remaining Gaps for Full Production Readiness

- Hosting provider credentials needed (Render, Railway, etc.)
- HTTPS certificate/termination configuration
- DNS setup for custom domain
- Monitoring/alerting webhook configuration
- Rate limiting middleware (not yet implemented)
- Schema validation hardening for request bodies
- Deploy job implementation in GitHub Actions (provider-specific)
