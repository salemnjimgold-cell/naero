# Milestone 1 — Location Foundation QA

**Date:** 2026-07-25  
**Status:** Passed with documented limitations  
**Scope:** Mobile location foundation only

## Delivered

- Foreground-only Expo location permission.
- Central persisted location state in `AppContext`.
- Latitude, longitude, accuracy, timestamp, country, country code, city, district, region, and postal code normalization.
- No Budapest/Hungary reverse-geocode fallback.
- GPS-disabled, denied, invalid, and unavailable states.
- Manual city mode available from permission, Profile, and Settings flows.
- Disable location use, change city, refresh GPS, and clear stored data.
- Foreground significant-change detection.
- Migration of legacy device location/manual-city keys.
- Independent unit tests, scoped JavaScript type check, documentation, and release APK.

## Automated results

| Check | Command | Result |
|---|---|---|
| Location unit tests | `npm run test:location` | **Pass — 7/7** |
| Location JS type check | `npm run typecheck:location` | **Pass — 0 errors** |
| Project lint | `npm run lint` | **Pass — 0 errors, 82 existing warnings** |
| Backend regression | `npm run test:backend` | **Pass** |
| AI regression | `npm run test:ai` | **Pass — 11/11** |
| Expo public config resolution | `npx expo config --type public` | **Pass** |
| Android release build | `android\gradlew.bat assembleRelease` | **Pass** |
| APK permission inspection | `aapt2 dump permissions` | **Pass — fine/coarse present; background location absent** |

The lint warnings are non-blocking and span pre-existing files and hook/style patterns. Milestone-touched UI files introduce no lint errors. Unrelated warnings were not refactored.

## APK

- File: `Naero-v1.2.0-milestone1-location.apk`
- Size: 86,351,751 bytes
- SHA-256: `D23D9C4BA5AD304141E386F32751407D2589399C70D0FC07D773D4CC225DF437`
- Package: `com.salemnjimgold.naeroapp`

## Tested behavior

- Coordinate boundary validation.
- Reverse-geocode field normalization and null handling.
- Device snapshot accuracy and provider timestamp.
- Manual city without coordinates or country assumptions.
- Great-circle distance sanity.
- Significant movement threshold.
- Accuracy-improvement and stale-snapshot change detection.
- Existing backend and AI automated regressions.
- Release manifest does not request background location.

## Changed files

1. `app.json`
2. `package.json`
3. `jsconfig.location.json`
4. `src/services/locationCore.js`
5. `src/services/locationService.js`
6. `src/services/index.js`
7. `src/context/AppContext.js`
8. `src/components/ManualCityModal.js`
9. `src/screens/LocationPermissionScreen.js`
10. `src/screens/ProfileScreen.js`
11. `src/screens/SettingsScreen.js`
12. `tests/location_foundation.js`
13. `docs/MILESTONE_1_LOCATION_FOUNDATION.md`
14. `docs/MILESTONE_1_LOCATION_QA.md`
15. `Naero-v1.2.0-milestone1-location.apk`

No backend, PostGIS, nearby-place, job, community, or AI-context implementation was added.

## Known limitations

- No Android device/emulator was connected, so permission dialogs, GPS-disabled UI, and manual-city UI were not interactively exercised in this environment.
- Manual city geocoding is best-effort through the device geocoder. If unavailable, Naero stores only the entered city and leaves country/coordinates null.
- Disabling location use is an in-app preference; revoking Android OS permission remains the user's device-setting action.
- The significant-change watcher runs only while the application process is active. Background location is intentionally excluded.
- New location-specific copy follows the screen's existing English-only location copy. The general app language and RTL systems are unchanged; translation-key migration is deferred to a dedicated localization pass.

## Build note

The initial release build succeeded. A later exact-source rebuild encountered Windows CMake/ninja file locks, and a no-daemon retry timed out while native compilation continued. After isolating the build to one Gradle worker, the final `NODE_ENV=production` release build completed successfully in 19m 28s. The APK hash above is from that final build.

## Rollback

There is no database migration.

Rollback steps:

1. Disable/remove the new context actions and restore the prior location adapter.
2. Restore the previous location UI portions of permission, Profile, and Settings screens.
3. Remove the v2 service/core/modal/test/typecheck files and Expo location plugin entry.
4. Optionally clear `@naero_location_state_v2` and `@naero_location_preference_v2`; old builds ignore them.

Do not restore the old hardcoded Budapest reverse-geocode fallback.
