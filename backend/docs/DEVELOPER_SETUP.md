# Backend Developer Setup

Goal: a new developer should be able to clone Naero and run the backend in less than 10 minutes.

## Requirements

- Node.js 18 or newer.
- PowerShell on Windows.
- No backend package install is currently required because the Sprint 3 backend uses Node built-ins only.

## First Run

From the repository root:

```powershell
.\scripts\backend-dev.ps1
```

The script creates `backend\.env` from `backend\.env.development.example` if missing, then starts the backend on:

```text
http://127.0.0.1:8787
```

## Verify Health

In a second terminal:

```powershell
.\scripts\backend-health.ps1
```

Expected result:

```text
Naero backend healthcheck passed: http://127.0.0.1:8787
```

## Run Smoke Test

```powershell
.\scripts\backend-smoke.ps1
```

## Environment Files

- `backend\.env.development.example`: local defaults.
- `backend\.env.staging.example`: staging template.
- `backend\.env.production.example`: production template.
- `backend\.env`: local-only file, never commit real secrets.

## Database

Local development can run without Supabase credentials. Protected endpoints fail closed until Supabase JWT verification is configured.

For staging/production database setup, follow `backend/db/MIGRATIONS.md`.

## Local Workflow

1. Start backend with `.\scripts\backend-dev.ps1`.
2. Verify health with `.\scripts\backend-health.ps1`.
3. Run smoke test with `.\scripts\backend-smoke.ps1`.
4. Run root validation before handoff:
   - `node tests\qa_backend_foundation.js`
   - `npm run lint`
   - `node tests\qa_ai.js`

## Troubleshooting

- If port `8787` is busy, edit `backend\.env` and change `PORT`.
- If protected profile routes return `AUTH_NOT_CONFIGURED`, Supabase JWT verification is missing. That is expected locally.
- If monitoring events fail locally, leave `MONITORING_WEBHOOK_URL` empty.
