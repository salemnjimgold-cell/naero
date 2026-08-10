# Milestone 1 — Location Foundation

## Scope

This milestone implements only the mobile location foundation:

- Expo foreground location permission;
- one central location service and application state;
- device GPS and reverse geocoding;
- manual city mode;
- location enable/disable/change/clear settings;
- significant foreground location change detection;
- unit tests, scoped type checking, lint, Android release build, and QA documentation.

It does not add a backend gateway, PostGIS, nearby providers/results, opportunities, community discovery, or AI location context.

## Central state

`src/services/locationService.js` owns persistence and Expo interaction. `AppContext` initializes it once and exposes the same state/actions to all screens. Individual screens do not call `expo-location`.

The normalized snapshot contains:

```text
version
mode: device | manual
latitude | null
longitude | null
accuracy | null
timestamp
address:
  country | null
  countryCode | null
  city | null
  district | null
  region | null
  postalCode | null
```

The separate preference is `auto`, `manual`, or `off`.

No country or city is invented when reverse geocoding is incomplete. In particular, there is no Budapest or Hungary fallback.

## Permission and failure behavior

- Only `requestForegroundPermissionsAsync` is used.
- Android declares fine/coarse location and no background location permission.
- Permission denial does not block the application.
- GPS-disabled, permission-denied, invalid-coordinate, and unavailable-position outcomes are represented as structured errors.
- The permission screen offers manual city mode and “Not now.”
- Manual mode remains usable if forward/reverse geocoding is unavailable; unresolved fields remain null.

## Significant changes

While the app is active in automatic/device mode, one foreground watcher checks location updates. A change is significant when at least one condition is met:

- movement is at least 500 metres;
- accuracy improves by at least 100 metres;
- the stored device snapshot is at least 15 minutes old.

The watcher is stopped when manual/off mode is selected or the provider unmounts. No background tracking is requested.

## Device persistence and deletion

New keys:

- `@naero_location_state_v2`
- `@naero_location_preference_v2`

Legacy location/manual-city keys are migrated once and then removed. Clear removes both new and legacy location keys and leaves the Naero location preference off. Device OS permission is not revoked; users control OS permission in Android settings.

## Public application actions

- `requestLocationPermission()` — request foreground permission and capture device position;
- `refreshLocation()` — refresh automatic device mode or return the current manual/off state;
- `selectManualCity(city)` — use manual city mode;
- `disableLocation()` — pause Naero location use without deleting the stored snapshot;
- `clearLocationData()` — delete Naero's stored location/manual city;
- `hasLocationPermission` — compatibility field meaning a usable location selection exists;
- `hasDeviceLocationPermission` — actual OS foreground permission state.

## Rollback

No database migration exists in this milestone.

To roll back:

1. Restore the previous location service and AppContext integration.
2. Restore the previous Profile, Settings, and permission-screen controls.
3. Remove `ManualCityModal`, `locationCore`, the location test/typecheck scripts, and the Expo location plugin entry.
4. Optionally remove `@naero_location_state_v2` and `@naero_location_preference_v2` from device storage. Old builds ignore these namespaced keys, so deletion is not required for compatibility.

Rollback must not restore the old Budapest reverse-geocode fallback; if a code rollback is necessary, that fallback should remain null-safe.
