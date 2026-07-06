# Naero Backend — Render Free Deployment Guide

## Prerequisites

- A [Render](https://render.com) account (Free tier)
- Git repository with the Naero codebase pushed to GitHub/GitLab
- A Supabase project (existing credentials in `backend/.env.production`)
- Supabase migrations applied (see `backend/docs/DEPLOYMENT.md`)

## Architecture

Render Free uses the **Node runtime** (not Docker). The backend is pure Node.js with zero npm dependencies — all imports are built-in modules (`http`, `crypto`, `fs`, `path`) or local files. The `deploy/render/render.yaml` Blueprint has been updated for Node runtime.

## Step 1 — Create a Render Web Service

### Option A: Blueprint (render.yaml — recommended)

1. Push the repo to GitHub/GitLab including `deploy/render/render.yaml`.
2. In the Render Dashboard, click **New +** → **Blueprint**.
3. Select your repository.
4. Render auto-detects `deploy/render/render.yaml` and creates a service named `naero-backend-staging`.
5. Before deploying, fill in the **sync: false** environment variables (see Step 2).

### Option B: Manual (from Dashboard)

1. Click **New +** → **Web Service**.
2. Connect your GitHub/GitLab repository.
3. Configure:
   - **Name**: `naero-backend-staging`
   - **Runtime**: `Node`
   - **Region**: `Frankfurt` (EU) or `Oregon` (US) — choose closest to your Supabase project
   - **Branch**: `main`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `node backend/src/server.js`
   - **Plan**: `Free`
4. Click **Advanced** and set **Health Check Path** to `/health`.

## Step 2 — Environment Variables

Set these in the Render Dashboard (Environment → Environment Variables). Variables marked **secret** should have the "Secret" checkbox enabled.

### Required (set values from your Supabase project)

| Variable | Example / Source | Secret? |
|----------|-----------------|---------|
| `NODE_ENV` | `production` | No |
| `NAERO_SERVICE_ENV` | `staging` | No |
| `PUBLIC_BASE_URL` | `https://naero-backend-staging.onrender.com` | No |
| `CORS_ORIGINS` | `https://naero.app,http://localhost:8081` | No |
| `SUPABASE_URL` | `https://rqsqmepxjkgfgvrkwvhn.supabase.co` | **Yes** |
| `SUPABASE_ANON_KEY` | your anon key | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | your service-role key | **Yes** |
| `SUPABASE_JWT_SECRET` | your JWT secret | **Yes** |

> Do **NOT** set `PORT`. Render assigns it automatically.

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `MONITORING_WEBHOOK_URL` | Webhook for backend monitoring events | (none) |
| `MONITORING_SAMPLE_RATE` | Event sampling rate (0.0 – 1.0) | `1` |

> If `PUBLIC_BASE_URL` is missing in production mode, the backend validation **fails** and the server exits. Similarly for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`.

## Step 3 — Deploy

1. After setting env vars, click **Deploy** (or **Manual Deploy** → **Deploy latest commit**).
2. Watch the deploy logs:
   - Expect: `Cloning repo...`, `Running build command...`, `Starting service...`
   - Verify: the log ends with `Naero backend listening` + port number.

## Step 4 — Verify Deployment

Health check (Render's native `/health` endpoint):

```bash
curl https://naero-backend-staging.onrender.com/health
```

Expected response (environment validation passes):

```json
{ "status": "ok", "service": "naero-backend", "version": "0.1.0", "environment": "staging", "authProvider": "supabase", "aiGatewayEnabled": false, "supabaseConfigured": true }
```

If environment variables are missing:

```json
{ "status": "degraded", "service": "naero-backend", "version": "0.1.0", ... }
```

Check `/v1/config`:

```bash
curl https://naero-backend-staging.onrender.com/v1/config
```

## Step 5 — Update Mobile App

After the backend is verified, update the mobile app's API URL:

1. In `backend/.env.production`, set `PUBLIC_BASE_URL` to the Render URL.
2. In the root `.env` file, set `EXPO_PUBLIC_NAERO_API_URL`:

```
EXPO_PUBLIC_NAERO_API_URL=https://naero-backend-staging.onrender.com
```

3. Rebuild the mobile APK so it points to the deployed backend.

## Free Tier Limitations

| Limit | Value | Impact |
|-------|-------|--------|
| Inactivity spin-down | 15 minutes | First request after idle takes 3–5s to wake |
| RAM | 512 MB | Sufficient for the lightweight Node.js backend |
| Bandwidth | 100 GB/month | Enough for staging traffic |
| Custom domains | Not supported | Use `*.onrender.com` URL |
| Concurrent builds | 1 | Only one build at a time on Free |
| SSL/HTTPS | Automatic | Included |

## Troubleshooting

### Backend fails to start with validation error

**Symptom**: Log shows `Production environment validation failed`.

**Fix**: Ensure all required env vars are set in the Render Dashboard (see Step 2). The backend validates on startup in production mode.

### Backend deploys but health check is `degraded`

**Symptom**: `curl /health` returns `"status": "degraded"`.

**Fix**: Check that `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET` are all set correctly.

### Build command fails (`cd backend`)

**Symptom**: Log shows `build command exited with code 1`.

**Fix**: Confirm that the `backend/` directory exists in your repository root. The build command runs from the repo root.

### Backend crashes after first request

**Symptom**: First request works after spin-up, then subsequent requests fail.

**Fix**: Check `MONITORING_SAMPLE_RATE` is not causing excessive logging/resource use. The Free tier has limited RAM.

### Backend URL not reachable

**Symptom**: `curl` times out.

**Fix**: Render Free spins down after 15 min of inactivity. Wait 5–10s for cold start, then retry. You can use [cron-job.org](https://cron-job.org) or [Kaffeine](https://kaffeine.herokuapp.com) to ping the `/health` endpoint every 10 minutes to prevent spin-down.

## Rollback

1. In the Render Dashboard, go to your web service → **Manual Deploy** → **Deploy previous deploy**.
2. Revert `EXPO_PUBLIC_NAERO_API_URL` in the mobile app if it was changed.
