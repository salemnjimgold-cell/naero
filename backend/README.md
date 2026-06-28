# Naero Backend

This backend is the production boundary for Naero platform services. Sprint 2 established the backend foundation. Sprint 3 makes the environment reproducible and deployment-ready.

The AI gateway is intentionally not implemented in Sprint 3.

## Fast Local Start

From the repository root:

```powershell
.\scripts\backend-dev.ps1
```

Then verify in a second terminal:

```powershell
.\scripts\backend-health.ps1
.\scripts\backend-smoke.ps1
```

## Direct Backend Commands

```bash
cd backend
npm run dev
npm run health
npm run smoke
```

## Environment

Copy `backend/.env.example` to your deployment environment and provide real secrets through the host secret manager. Do not commit `.env` files or service-role keys.

Protected endpoints fail closed until `SUPABASE_JWT_SECRET` is configured.

## Documentation

- Developer setup: `backend/docs/DEVELOPER_SETUP.md`
- Auth strategy: `backend/docs/AUTH_STRATEGY.md`
- Security model: `backend/docs/SECURITY_MODEL.md`
- Deployment: `backend/docs/DEPLOYMENT.md`
- Observability: `backend/docs/OBSERVABILITY.md`
- Database migrations: `backend/db/MIGRATIONS.md`
- Staging deployment: `deploy/staging/README.md`
