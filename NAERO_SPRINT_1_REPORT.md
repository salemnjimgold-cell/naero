# Naero Sprint 1 Report - Production Foundation

Date: 2026-06-28

## Mission

Transform the current Naero prototype into a more stable and secure foundation suitable for internal alpha testing.

## Completed

- Fixed the known Services tab runtime crash by importing `useApp` in `src/screens/ServicesScreen.js`.
- Removed the hardcoded Gemini API key from `app.json` and `src/ai/config.js`.
- Disabled client Gemini activation by default; AI now uses the existing local fallback until a backend proxy exists.
- Removed sensitive AI logging from `src/ai/engine.js` and `src/ai/geminiClient.js`.
- Removed unnecessary Android permissions: storage, overlay, and vibrate.
- Set Android `allowBackup` to `false`.
- Removed hardcoded Android release signing credentials from Gradle.
- Made release signing depend on external Gradle properties or environment variables.
- Removed the committed release keystore.
- Removed old APK/signature delivery artifacts that could contain the previously bundled key.
- Added ignore rules for APKs, signature files, keystores, `.expo`, temp extract folders, and Android build outputs.
- Normalized app version to `1.1.3` in `package.json` and `package-lock.json`.
- Deduplicated installed dependencies enough to clear Expo doctor's duplicate native module warning.
- Trimmed `app.json` so checked-in native Android config is the alpha source of truth.

## Verification Results

- `npm run lint`: passed with 0 errors and 80 warnings.
- `node tests/qa_ai.js`: passed 11/11.
- `npx expo install --check`: passed.
- `npx expo-doctor`: passed 18/18.
- `android/gradlew.bat :app:assembleRelease` with `NODE_ENV=production`: passed.
- Targeted secret scan for removed Gemini key/signing strings: passed.
- AI console logging scan in `src/ai`: passed.
- Android permission scan for removed permissions: passed.
- High/critical security audit gate: passed with `npm audit --omit=dev --audit-level=high`.

## Known Residual Issues

- `npm audit --omit=dev` still reports 19 moderate advisories in Expo/React Native dependency chains. `npm audit fix` cannot resolve these without `--force`, which would jump to breaking Expo/React Native versions.
- Lint still has 80 warnings, mostly existing hook dependency and unused import warnings.
- AI is local fallback only until a secure backend proxy is introduced.
- Release builds currently use debug signing unless secure release signing properties are provided.
- Auth/Firebase remain stubs and are not production-ready.
- No emulator/manual navigation session was run in this sprint; Android bundle/build success verifies primary imports, but physical UI traversal remains recommended before distributing alpha APKs.

## Production Readiness Score

Score: 42/100

Rationale: Critical client secrets and signing exposures were removed, build health improved, and the known crash was fixed. Production readiness remains limited by lack of backend/auth architecture, moderate dependency advisories, local-only AI fallback, and incomplete privacy/consent controls.

## Alpha Readiness Score

Score: 72/100

Rationale: The app is now materially safer for internal alpha. It builds, lint has no errors, AI fallback works, Expo doctor passes, and the main known crash is fixed. Remaining issues are acceptable for controlled internal alpha if testers know AI is fallback/local and auth/backend are prototype-level.

## Recommendation for Sprint 2

Build the secure AI/backend boundary and alpha QA harness:

- Add an AI backend proxy interface in the app without reintroducing client secrets.
- Add a safe diagnostics/logging utility.
- Add basic smoke-test coverage for app launch, main tabs, AI, Services, and Profile.
- Start resolving lint warnings that affect runtime correctness, especially hook dependencies in app-level screens.
