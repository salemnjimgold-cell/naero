# Naero Security

Last updated: 2026-06-28

## Security Posture

Current posture: safer internal-alpha foundation, not production-ready.

Naero handles or may handle sensitive data: migration context, nationality/origin, city, arrival status, housing/work status, language, chat messages, and exact/approximate location. This requires a privacy-first architecture.

## Critical Findings

1. Gemini API key exposure was remediated in Sprint 1:
   - removed from `app.json`
   - removed from `src/ai/config.js`
   - client Gemini activation is disabled by default

2. Android release signing exposure was remediated in Sprint 1:
   - committed release keystore removed
   - hardcoded release passwords removed from `android/app/build.gradle`
   - release signing now requires external Gradle properties or environment variables

3. Sensitive AI logging was remediated in Sprint 1:
   - user messages, profiles, prompts, location fields, key metadata, response previews, and error stacks are no longer logged by AI modules

4. Android manifest permission exposure was reduced in Sprint 1:
   - removed storage, overlay, and vibrate permissions
   - set `android:allowBackup="false"`

5. Remaining: sensitive data is stored locally in AsyncStorage:
   - AI profile
   - last known location
   - manual city
   - realtime last location
   - saved preferences and cached data

6. Sprint 2 backend security foundation was added:
   - backend-only Supabase service-role access path
   - JWT verification helpers for protected routes
   - protected routes fail closed when JWT verification is not configured
   - safe structured logger redacts credentials, tokens, email, phone, and location-like fields
   - Supabase profile/settings/consent schema includes row-level security policies

7. Remaining: backend is not deployed and Supabase credentials are not configured in a secret manager yet.

8. Sprint 3 repository-side infrastructure hardening was added:
   - local `.env` examples with no secret values
   - staging/production environment templates
   - Docker deployment artifact
   - staging-first deployment guide
   - structured backend request logs with request ids
   - optional redacted monitoring webhook events
   - source secret scan passed after changes

## Security Rules Going Forward

- No secrets in client code.
- No signing credentials in source control.
- No sensitive logs in production.
- No exact location sharing without explicit user action and clear disclosure.
- No nearby-user feature without a written threat model.
- No community write features without moderation, reporting, blocking, and rate limiting.
- No AI personalization without explicit consent and user reset/delete controls.

## Immediate Security Plan

1. Rotate any previously exposed Gemini key outside this repository.
2. Rotate Android signing credentials if the removed keystore was ever used for distribution.
3. Complete external Sprint 3 deployment: deploy backend foundation and configure Supabase Auth/profile secrets in the host secret manager.
4. Complete external Sprint 3 infrastructure: configure HTTPS, provider health checks, and monitoring hook in staging.
5. Sprint 4: move AI requests behind a backend proxy after infrastructure is verified.
6. Update privacy copy to match actual external provider calls.
7. Add consent and reset/delete controls for AI profile and location.
8. Plan Expo/React Native upgrade to clear remaining moderate dependency advisories.

## Future Security Architecture

- Backend-mediated AI calls with redaction and rate limiting.
- Environment-specific secrets in secure CI/EAS/backend secret stores.
- Privacy consent ledger for AI personalization and location use.
- Optional encrypted storage for sensitive local profile/location data.
- Audit logging on backend, with PII minimization.
- Abuse prevention for community and nearby features.
