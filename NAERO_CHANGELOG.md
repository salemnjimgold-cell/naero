# Naero Changelog

All notable project-level technical changes should be recorded here.

## 2026-06-28

- Completed Sprint 3 repository-side Backend Deployment & Infrastructure implementation.
- Added reproducible backend developer setup with PowerShell startup, health, and smoke-test scripts.
- Added backend env examples for development, staging, and production.
- Added dependency-light `.env` loading for local backend development.
- Added healthcheck script and request-id response headers.
- Added Docker backend image definition and Render staging blueprint.
- Added staging-first deployment guide, backend deployment guide, observability guide, migration guide, and seed-data policy.
- Added optional monitoring webhook events with redacted payloads.
- Added structured HTTP request logging for backend routes.
- Confirmed AI Gateway remains out of scope for Sprint 3.
- Updated roadmap to split Sprint 3 and Sprint 4: Sprint 3 is Backend Deployment & Infrastructure only; Sprint 4 is dedicated to the AI Platform.
- Clarified that AI Gateway implementation is explicitly out of scope for Sprint 3.
- Completed Sprint 2 Steps 1-4 implementation: backend scaffold, Supabase foundation, auth strategy, and unified mobile API/profile client layer.
- Added dependency-light Node backend under `backend/` with `/health`, `/v1/config`, and protected `/v1/profile` route shell.
- Added Supabase profile/settings/consent migration with row-level security policies.
- Added backend auth verification primitives that fail closed unless Supabase JWT verification is configured.
- Added safe backend logger redaction for tokens, credentials, email, phone, and location-like fields.
- Added mobile API config/client modules plus local guest auth/profile services.
- Updated Firebase auth compatibility stub to delegate guest session behavior to the new auth service.
- Added backend smoke/QA validation scripts.
- Confirmed AI gateway is not implemented in Sprint 2.
- Completed Sprint 1 production-foundation hardening.
- Fixed Services tab crash risk by importing `useApp`.
- Removed hardcoded Gemini API key from client and Expo config.
- Removed sensitive AI logs from AI engine/client modules.
- Removed broad Android permissions and disabled Android backup.
- Removed hardcoded release signing credentials and committed release keystore.
- Removed old APK/signature artifacts that could contain the previous client secret.
- Normalized app/package version to `1.1.3`.
- Deduplicated dependencies enough for Expo doctor to pass 18/18.
- Added `NAERO_SPRINT_1_REPORT.md`.
- Established CTO/Lead Architect operating rules for Naero.
- Created baseline roadmap, architecture, security, tech debt, and audit documentation.
- Created `NAERO_BACKLOG.md` as the living CTO improvement backlog.
- Added proactive CTO proposal workflow for architecture, security, performance, UX, scalability, and product-quality improvements.
- Completed initial technical audit of current Expo/React Native app structure.
- Verified Android release assembly can complete.
- Verified AI QA script passes 11/11 checks.
- Identified current lint failure in `src/screens/ServicesScreen.js`.
- Identified critical security risks around hardcoded Gemini key and Android signing credentials.

Note: Running `npm run lint` during the audit caused Expo lint to auto-install ESLint tooling and create `eslint.config.js`. This changed `package.json` and `package-lock.json`.
