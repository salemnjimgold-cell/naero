# Beta QA Round 2 Report

**Date:** 2026-07-02
**Version:** 1.1.3
**Build:** `app-release.apk` (84.8 MB)
**SHA-256:** `E50D484658BB68841C14A3EE589AC087AFE84676FB2276A7FE99EBFE4A5DDD50`

---

## Bugs Found & Fixed

### 1. AI Conversation Creation Failure

**Issue:** `naeroAI.ensureConversation()` returns a generic failure for authenticated users. The backend error is swallowed — only "Could not create or find conversation" shown.

**Root Cause:** Two problems:
1. `setToken()` only set in-memory `cachedToken` without persisting to AsyncStorage (`@naero_api_token`). On app restart, `getAccessToken()` reads from AsyncStorage (empty) → API calls lack auth header → backend returns 401/403 which is caught generically.
2. `ensureConversation()` returned `null` on failure, discarding the HTTP status and backend error message. The caller had no way to know what went wrong.

**Fixes:**
- `naeroApi.setToken()` now persists token to AsyncStorage via `AsyncStorage.setItem(AUTH_TOKEN_KEY, token)`. `clearToken()` also removes it.
- `naeroApi.getAccessToken()` already falls back to AsyncStorage when `cachedToken` is null — now it will find the persisted token.
- `naeroAI.ensureConversation()` now returns `{ error, status }` on API failure instead of `null`.
- `naeroAI.sendMessage()` checks for `conv.error` before proceeding.
- AIScreen debug overlay (long-press header title 2s) shows the HTTP status and backend error message in red.

**Files changed:** `src/services/api/naeroApi.js`, `src/services/api/naeroAI.js`, `src/screens/AIScreen.js`

---

### 2. Category Translation Keys Showing Raw Labels

**Issue:** Category labels like `categories.cafés`, `categories.halalFood`, `categories.supermarkets` displayed raw key names instead of translated strings.

**Root Cause:** The `mockCategories.js` defines 27+ category IDs, but `en.json` only had 13 keys in the `categories` section (line 165). Missing keys: `cafés`, `halalFood`, `supermarkets`, `pharmacies`, `hospitals`, `clinics`, `banks`, `immigration`, `languageSchools`, `communityCenters`, `tourist`, `refugee`, `ngo`, `emergency`, `jobSupport`. `i18next` returns the raw key when no translation exists.

**Fixes:**
- Added all 15 missing keys to `en.json` (line 165).
- Added Hungarian translations to `hu.json`.
- Added French translations to `fr.json`.
- Added Arabic translations to `ar.json`.

**Files changed:** `src/i18n/en.json`, `src/i18n/hu.json`, `src/i18n/fr.json`, `src/i18n/ar.json`

---

### 3. Places Data Accuracy

**Issue:** All 30+ mock places are Budapest-based. When user is in Győr, places displayed without any indication they are sample/demo data. Place cards show no city label.

**Root Cause:** `placeService` methods (`getNearby`, `getByCity`, `getByCategory`, `searchPlaces`) return mock data as-is with `demo: false` when remote API and Overpass are unavailable. No visual indicator distinguishes live from sample data.

**Fixes:**
- Added `markDemo(items)` helper to `placeService` that sets `demo: true` on all locally-sourced (mock/fallback) results.
- `PlaceCard` shows "Demo" badge (left side, warning color) when `item.demo` is true.
- `PlaceDetailScreen` shows "Demo data" badge (right side) on detail view.
- `PlaceCard` now displays `item.city` as subtitle when available.
- `getByCity()` when no places match the requested city, falls back to showing all data with `demo: true` rather than empty list.

**Files changed:** `src/services/placeService.js`, `src/components/ListingCard.js`, `src/screens/PlaceDetailScreen.js`

---

### 4. Place Card Images

**Issue:** Place cards and detail screens show a generic `Ionicons image-outline` icon for all places. Mock data has no `image_url` field.

**Root Cause:** `PlaceCard` always rendered the placeholder view. No Image component checked for `item.image_url` or `item.image`.

**Fixes:**
- `PlaceCard` now attempts to render `Image` with `item.image_url` (remote URL string); falls back to `item.image` (local or remote); final fallback shows Naero logo at 40% opacity as branded placeholder.
- `PlaceDetailScreen` similarly shows real image when available, with Naero logo placeholder otherwise.
- Added `placeImage` and `detailImage` styles for consistent sizing.

**Files changed:** `src/components/ListingCard.js`, `src/screens/PlaceDetailScreen.js`

---

## Build Artifact

| Field | Value |
|-------|-------|
| Path | `android/app/build/outputs/apk/release/app-release.apk` |
| Size | 84,836,460 bytes (84.8 MB) |
| SHA-256 | `E50D484658BB68841C14A3EE589AC087AFE84676FB2276A7FE99EBFE4A5DDD50` |
| Version | 1.1.3 |
| Build time | ~4m 17s |
| Gradle | `--no-daemon --max-workers=2 -x lint` |

---

## Known Issues (deferred)

1. **AI endpoint `/v1/ai/conversations` not deployed** — Backend returns connection error or 404. Frontend now exposes the exact HTTP status and error via debug overlay (long-press "Naero AI" header for 2s). Requires backend deployment of AI endpoints and Supabase RLS policies.

2. **en.json services block has structural defect** — The `services` opening brace at line 37 lacks a proper closing brace; `places`, `categories`, and nested keys use incorrect indentation. JSON parser tolerates it. Should be fixed in a future cleanup pass.

3. **No real Győr place data** — All mock places are Budapest. `getByCity('Győr')` now falls back to Budapest data marked as "Demo data". Real Győr locations require Overpass API seeding or backend endpoint.
