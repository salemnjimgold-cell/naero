# Naero Architecture

Last updated: 2026-06-28

## Current Stack

- Expo SDK 54
- React Native 0.81.5
- React 19.1.0
- JavaScript
- Node.js backend foundation using built-in HTTP modules
- Supabase selected as auth/profile system of record for alpha backend architecture
- Android native project checked in under `android/`
- React Navigation native stack plus bottom tabs
- AsyncStorage for local persistence
- Expo Location for foreground location
- Overpass/Nominatim for live places/geocoding
- Optional Google Places facade
- Gemini client module remains present, but client activation is disabled by default because no client secret is configured.

## Entry Points

- `index.js`: registers the Expo root component.
- `App.js`: initializes i18n and wraps the app in gesture, safe-area, app context, navigator, and status bar providers.
- `src/navigation/AppNavigator.js`: owns root stack and bottom tab navigation.

## Current Module Boundaries

### UI

- `src/screens/`: feature screens.
- `src/components/`: reusable presentation components.
- `src/theme/`: shared colors, spacing, typography.
- `src/i18n/`: language resources and i18next setup.

### App State

- `src/context/AppContext.js` currently owns language, saved items, location, nearby data, realtime settings, sync state, and AI profile.

Current risk: `AppContext` is becoming too broad. Future work should split responsibilities only when needed and without a large rewrite.

### Data

- `src/data/`: static data, schemas, and models.
- `src/data/providers/`: mock providers.
- `src/services/dataService.js`: local/mock-first service facade.
- `src/services/apiClient.js`: unified mobile HTTP client for future Naero backend calls.
- `src/services/authService.js`: local guest session service and future Supabase auth seam.
- `src/services/profileService.js`: local profile persistence and remote profile sync seam.
- `src/firebase/`: currently stubs, not real production Firebase integration.

### Backend Foundation

- `backend/src/server.js`: dependency-light Node HTTP server.
- `backend/src/config/env.js`: environment parsing and public config status.
- `backend/src/middleware/auth.js`: Supabase JWT verification helpers; protected routes fail closed when not configured.
- `backend/src/services/supabaseRest.js`: backend-only Supabase REST access using service-role credentials from environment.
- `backend/src/observability/`: structured logging, redaction, optional monitoring webhook events.
- `backend/src/routes/`: health and profile route handlers.
- `backend/db/migrations/001_core_auth_profiles.sql`: Supabase schema for profiles, user settings, consent events, and RLS policies.
- `backend/docs/`: auth strategy and backend security model.
- `scripts/backend-dev.ps1`, `scripts/backend-health.ps1`, `scripts/backend-smoke.ps1`: reproducible local backend workflow.
- `Dockerfile.backend` and `deploy/render/render.yaml`: staging-first deployment scaffolding.

Current limitation: repository-side deployment scaffolding exists, but actual hosting/Supabase/DNS/secrets must be configured with external account access.

### Location and Live Data

- `src/services/locationService.js`: foreground permission, current location, reverse geocoding, local location storage.
- `src/services/realTimeService.js`: live nearby lookup, geocode lookup, realtime preference, last live location.
- `src/services/api/`: Overpass, Nominatim, Google Places API facades.

### AI

- `src/ai/engine.js`: AI orchestration.
- `src/ai/geminiClient.js`: direct Gemini client.
- `src/ai/router.js`: local intent routing.
- `src/ai/knowledge.js`: local knowledge responses.
- `src/ai/memory.js` and `src/ai/profile.js`: local AI profile and memory helpers.

Target architecture: AI should be mediated by a backend service, not called directly from the client with exposed keys.

Sprint 2/3 note: the AI gateway is intentionally not implemented yet. `/v1/config` reports `aiGatewayEnabled: false`. Sprint 3 is infrastructure deployment only; Sprint 4 is the dedicated AI platform sprint.

## Target Architecture Principles

1. Client stays lightweight.
2. Secrets never ship in the app bundle.
3. Sensitive user data is minimized, redacted, and consent-gated.
4. Location defaults to foreground and approximate unless exact location is clearly needed.
5. Mock data and production data must have clear boundaries.
6. Community and nearby-user features require moderation, reporting, blocking, rate limiting, and abuse prevention from day one.
7. Expensive work should happen on-demand, cached, and battery-aware.

## Recommended Evolution

Near term:

- Keep the current screen/navigation structure.
- Fix the existing runtime and security issues.
- Deploy the backend foundation and configure Supabase auth/profile credentials.
- Add the secure AI backend interface in Sprint 4 without rewriting the AI screen.
- Normalize environment config and release config.

Medium term:

- Split `AppContext` into focused providers if complexity keeps growing:
  - `UserProvider`
  - `LocationProvider`
  - `DataProvider`
  - `AIProvider`
  - `PreferencesProvider`
- Replace Firebase stubs with a real backend adapter or remove them.
- Add typed contracts through JSDoc or TypeScript migration when the team is ready.

Long term:

- Backend API for AI, profiles, community, city data, moderation, and search.
- Admin tools for verified services and community moderation.
- Country/city content pack architecture.
- Privacy-first realtime location services.

## Build and Release Notes

- Native Android release assembly currently works.
- `android/` is the source of truth for native Android alpha config.
- `app.json` is intentionally minimal to avoid unsynced native/prebuild drift while Android native config is checked in.
- Release signing is configured through external Gradle properties or environment variables:
  - `NAERO_RELEASE_STORE_FILE`
  - `NAERO_RELEASE_STORE_PASSWORD`
  - `NAERO_RELEASE_KEY_ALIAS`
  - `NAERO_RELEASE_KEY_PASSWORD`
- If those values are not supplied, alpha release assembly falls back to debug signing.
- APK artifacts and signing files are ignored and should not live in the main source repository.
