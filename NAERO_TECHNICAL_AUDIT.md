# Naero Technical Audit

Date: 2026-06-28

## Current Project Status

Naero is currently an Expo SDK 54 / React Native 0.81.5 mobile prototype with a checked-in Android native project. It has a coherent app shell, navigation, mock/local data services, foreground location support, live nearby search through public APIs, and an AI assistant that uses Gemini when available with a local fallback engine.

The app is not production-ready yet. It can assemble an Android release build, but it has critical security issues, at least one known runtime crash risk, incomplete backend/auth infrastructure, and privacy gaps around AI and location.

## Main Architecture

Entry points:

- `index.js`: registers the Expo root component.
- `App.js`: wraps the app with gesture handling, safe area, global app context, navigation, status bar, and i18n.

Navigation:

- `src/navigation/AppNavigator.js`
- Native stack navigator for splash/onboarding/auth/location/main/detail/modal screens.
- Bottom tab navigator for Home, Explore, Services, Community, and Profile.

State:

- `src/context/AppContext.js`
- One global reducer/context owns language, saved items, AI profile, location, city, nearby data, sync state, realtime preference, and service instances.

Data/services:

- `src/data/` and `src/data/providers/` contain static/mock datasets.
- `src/services/dataService.js` provides local/mock-first data access.
- Domain services exist for places, services, jobs, housing, community, safety, search, cache, location, realtime data, and sync.
- `src/firebase/` is currently a stub layer, not a real backend integration.

AI:

- `src/ai/engine.js` orchestrates Gemini-first responses with local fallback.
- `src/ai/geminiClient.js` calls Gemini directly from the client.
- `src/ai/router.js`, `knowledge.js`, `profile.js`, and `memory.js` support local intent routing, static guidance, and AsyncStorage-backed AI profile memory.

Android/Expo:

- `app.json`, `eas.json`, and `android/` are present.
- Native Android config is checked in, so app config changes are not automatically synced by prebuild unless explicitly regenerated.

## What Is Working

- Android release assembly completed successfully with `android/gradlew.bat :app:assembleRelease`.
- Existing AI QA script passed: 11 passed, 0 failed.
- Expo dependency version check passed with `npx expo install --check`.
- App structure is understandable and modular enough to improve incrementally.
- Main navigation and screen files exist for the intended prototype scope.
- Foreground location permission and current-position fetching are implemented.
- Overpass/Nominatim live nearby lookup exists.
- Local caching exists through AsyncStorage and in-memory maps.
- i18n resources exist for English, Arabic, French, and Hungarian.

## What Is Broken or Risky

Critical:

- `src/screens/ServicesScreen.js` calls `useApp()` without importing it. Lint reports `useApp` as undefined; this can crash the Services tab.
- Gemini API key is hardcoded in `app.json` and `src/ai/config.js`.
- Android release keystore and release passwords are committed in `android/app/`.
- AI modules log user messages, profile data, prompt context, location data, key prefix/length, and response previews.

High:

- Auth, Firestore, and Storage are stubs. The UI suggests account/backend behavior that does not really exist.
- Android manifest requests broad permissions including storage and overlay permissions that current JS code does not justify.
- `android:allowBackup="true"` may back up sensitive local app data.
- Exact location and AI profile data are stored in AsyncStorage without encryption.
- Privacy copy says location stays on device unless nearby search is used, but AI context and external APIs can receive location-derived data.
- AI calls go directly from client to Gemini, exposing secrets and sending user context without a backend privacy boundary.

Medium:

- `syncEngine.js` likely fails to persist last sync time because it uses an incorrect named AsyncStorage require shape.
- "Background sync" is only JS `setInterval` plus `AppState`, not OS-level background work.
- Splash/onboarding/auth navigation does not appear to respect persisted onboarding or auth state.
- Version mismatch: `package.json` is `1.1.2`, while `app.json` and Gradle indicate `1.1.3`.
- Expo doctor reported duplicate `expo-constants` copies in `node_modules`.
- Generated APKs, idsig files, Android build outputs, and delivery artifacts are present in the repo.
- Lint found 85 warnings, mostly unused imports and hook dependency issues.

Low:

- Some text/test output shows encoding corruption.
- Local AI QA duplicates logic instead of importing production modules.
- `AppContext` is becoming too broad and should eventually be split by responsibility.

## Build and Check Results

Commands run:

- `npm run lint`
- `node tests/qa_ai.js`
- `npm ls --depth=0`
- `npx expo-doctor`
- `npx expo install --check`
- `npm audit --omit=dev`
- `android/gradlew.bat :app:assembleRelease`

Results:

- Android release build: passed.
- AI QA: passed 11/11.
- Expo dependency check: passed.
- Expo doctor: 15/18 checks passed, 3 failed.
- Lint: failed with 1 error and 85 warnings.
- npm audit: 19 moderate vulnerabilities in dependency/tooling chains; force fixes imply breaking Expo/React Native upgrades.

Important note:

- `npm run lint` auto-installed ESLint tooling because no ESLint config existed. It created `eslint.config.js` and modified `package.json` / `package-lock.json`.

## AI Assistant Review

Current strengths:

- Clear local fallback architecture.
- Useful newcomer domains: immigration, housing, jobs, cost of living, checklist, city guide, healthcare, transport, food, safety.
- AI profile completion and local memory helpers exist.
- AI QA script covers key local fallback scenarios.

Current risks:

- Secret is embedded in app code.
- Direct client-to-Gemini calls are not suitable for production.
- User profile and location context can be sent to Gemini.
- Logs expose sensitive data.
- Knowledge base is Hungary/Budapest-focused, while product ambition is global.
- No consent gate for AI personalization.
- No backend moderation, redaction, rate limiting, or usage control.

Recommended direction:

- Move AI calls to a backend proxy.
- Keep local fallback for offline/resilience.
- Add explicit AI personalization consent.
- Redact/minimize profile and location context.
- Create country/city knowledge packs over time.

## Onboarding/Profile Review

Current behavior:

- Onboarding screens exist.
- `AppContext` has `isOnboarded`, but navigation does not appear to use a persisted onboarding state.
- Profile screen currently presents a guest profile.
- AI profile is separate from UI profile and stored through AsyncStorage.

Risks:

- Users may repeat onboarding.
- Auth/profile UI may mislead users because backend auth is not real.
- Sensitive AI profile fields are not protected or consent-gated.

## Real-Time, Caching, Notifications, Background Logic

Realtime:

- Means live API lookup, not true realtime sockets or nearby users.
- Uses Overpass/Nominatim and optionally Google Places.

Caching:

- Works through AsyncStorage plus memory cache.
- TTL-based caches exist for location, places, services, jobs, housing, community, and safety.

Background:

- No real OS background tasks.
- No background location.
- No `expo-task-manager`.
- No `expo-notifications`.
- Existing sync engine runs only while app JS is active.

## Android/APK/Expo Review

Positive:

- Android project assembles release successfully.
- Expo SDK dependency versions are aligned per `expo install --check`.
- EAS config has preview APK profile.

Risks:

- Release signing credentials are committed.
- Native project plus app config can drift.
- Manifest permissions are broader than needed.
- Build emitted `NODE_ENV` warning.
- Generated APKs and build artifacts are in the repo.

## Privacy/Security Risks

Highest risk areas:

- AI profile and migration context.
- Exact location.
- External provider calls.
- Logs.
- Release signing.
- Client secrets.

Required baseline:

- Rotate exposed keys.
- Remove secrets from client.
- Remove signing credentials from repo.
- Remove sensitive logs.
- Add consent for AI/location data transfer.
- Update privacy copy to mention external providers.
- Add delete/reset controls for profile, chat memory, and location.
- Store exact location only when needed.

## Priority Fixes

P0:

- Fix `ServicesScreen.js` missing `useApp` import.
- Rotate and remove Gemini key.
- Secure Android signing and remove committed keystore/passwords.
- Remove sensitive AI logs.
- Remove unjustified Android permissions.

P1:

- Define real auth/backend strategy.
- Fix sync persistence.
- Persist onboarding state and route correctly.
- Normalize versions.
- Clean generated artifacts from the repo.
- Add CI checks.

P2:

- Add AI/backend proxy.
- Add privacy consent and data deletion controls.
- Add moderation foundations before community write/nearby-user features.
- Create multi-country content architecture.

## Recommended Roadmap

1. Stabilize current prototype.
2. Secure secrets, signing, logs, and permissions.
3. Introduce backend boundaries for AI and user data.
4. Add privacy-first location and AI consent.
5. Build real community/data systems with moderation.
6. Add real-time/nearby features only after a threat model.
7. Expand into multi-country/city content packs.

## Suggested OpenCode Tasks

1. Fix Services tab crash and rerun lint.
2. Remove hardcoded Gemini key and create AI backend interface.
3. Remove sensitive AI logs.
4. Secure Android signing configuration.
5. Clean Android manifest permissions.
6. Fix sync engine AsyncStorage usage and handler deduplication.
7. Add onboarding/auth route persistence.
8. Clean repository artifacts and ignore generated files.
9. Add privacy consent screens and data reset controls.
10. Add CI baseline for lint, AI QA, Expo checks, and Android build.

## Final Assessment

Naero has a strong prototype foundation and a valuable mission. It should now be treated as a security- and privacy-sensitive platform, not a casual app prototype. The right path is incremental: stabilize what exists, secure the foundation, introduce backend boundaries, then expand AI, community, and realtime features carefully.
