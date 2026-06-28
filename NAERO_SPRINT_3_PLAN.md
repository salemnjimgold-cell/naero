# Naero Sprint 3 Plan - Backend Deployment & Infrastructure

Date: 2026-06-28

## Status

Repository-side implementation complete. External deployment is pending provider, Supabase, DNS, and secret-manager access.

## Mission

Deploy the Sprint 2 backend foundation into reliable staging/production-style infrastructure so Naero has a real, secret-managed backend boundary before AI platform work begins.

## Scope

- Done: Add reproducible local backend environment.
- Done: Add backend setup guide.
- Done: Add `.env` example files for development, staging, and production.
- Done: Add startup scripts.
- Done: Add database migration instructions.
- Done: Add seed-data policy.
- Done: Add health endpoint verification.
- Done: Add smoke-test instructions.
- Done: Add local development workflow.
- Done: Add staging-first deployment workflow.
- Done: Add structured logging and request IDs.
- Done: Add optional monitoring hooks.
- Pending external access: Deploy backend.
- Pending external access: Configure Supabase.
- Pending external access: Apply database migrations to live Supabase.
- Pending external access: Configure environment secrets in provider.
- Pending external access: Configure HTTPS and provider health checks.
- Pending external access: Verify deployed backend stability and smoke tests.

## Explicitly Out Of Scope

- AI Gateway implementation.
- AI provider integration.
- Prompt routing, redaction, model selection, or AI billing controls.
- New mobile product features unless required for backend smoke testing.

## Architecture Decision

Sprint 3 should treat infrastructure as its own release gate. The backend must be reachable over HTTPS, configured with environment-managed secrets, connected to Supabase, and observable before any AI provider traffic is introduced.

This sequencing reduces security risk because AI keys, user prompts, consent enforcement, and usage metering should land on verified infrastructure, not on a local-only backend shell.

## Files And Modules Likely To Change

- `backend/`
- `backend/.env.example`
- `backend/docs/`
- `backend/db/migrations/`
- `Dockerfile.backend`
- `deploy/render/render.yaml`
- `deploy/staging/README.md`
- `scripts/backend-dev.ps1`
- `scripts/backend-health.ps1`
- `scripts/backend-smoke.ps1`
- Root documentation files:
  - `NAERO_MASTER_ROADMAP.md`
  - `NAERO_ARCHITECTURE.md`
  - `NAERO_SECURITY.md`
  - `NAERO_TECH_DEBT.md`
  - `NAERO_BACKLOG.md`
  - `NAERO_CHANGELOG.md`

## Risks

- Secrets could be misconfigured or accidentally committed.
- Supabase RLS policies could be applied incorrectly.
- Staging and production environment drift could create confusing test results.
- Logging or monitoring hooks could expose sensitive request data if not redacted.
- Infrastructure provider choice can create future migration cost.

## Complexity Estimate

M to L, depending on selected hosting provider and whether DNS/HTTPS/project access is already available.

## Rollback Strategy

- Keep mobile app remote API disabled unless `EXPO_PUBLIC_NAERO_API_URL` is intentionally configured.
- Preserve the local backend smoke test path.
- If deployment fails, revert environment URL changes and keep Sprint 2 local foundation as the source of truth.
- Database rollback should use Supabase migration history or a documented manual rollback script before alpha data exists.

## Verification Plan

- Local backend `/health` responds.
- Local smoke tests pass.
- Backend `/health` responds over HTTPS after staging deploy.
- `/v1/config` reports expected environment status without exposing secrets.
- Protected profile route rejects unauthenticated requests.
- Supabase migration applies successfully.
- RLS policies are enabled and verified.
- Backend smoke tests pass against the deployed URL.
- Logs are structured and redacted.
- Monitoring hook receives health/error events without PII.

## Success Criteria

- Done locally: backend starts from a reproducible developer workflow.
- Done locally: health checks and smoke tests pass.
- Done locally: structured logging and optional monitoring hooks exist.
- Done locally: environment examples, migration instructions, seed policy, and staging deployment workflow exist.
- Pending externally: deployed backend is stable enough for internal alpha testing.
- Pending externally: Supabase is configured with migrations applied.
- Pending externally: secrets are managed outside source control in the deployment provider.
- Pending externally: HTTPS, provider health checks, and monitoring hooks are active.
- Pending externally: smoke tests pass against the deployed environment.
- AI Gateway remains unimplemented until Sprint 4.
