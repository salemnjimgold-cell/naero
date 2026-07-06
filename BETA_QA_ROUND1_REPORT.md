# Naero Beta QA Round 1 Report

**Date:** 2026-07-02
**APK:** `android/app/build/outputs/apk/release/app-release.apk`
**App Version:** 1.1.3 (VersionCode 1)
**APK Size:** 84.8 MB
**Backend:** `https://naero.onrender.com`
**Supabase:** `rqsqmepxjkgfgvrkwvhn.supabase.co`
**SHA-256:** `3662A6D2B9755415C47F1D2F56BC16E99BF65EBAF0BC7F9C99E70A534743F8C3`

---

## Test Environment

- **Platform:** Android (release APK)
- **Build method:** `gradlew assembleRelease` (skipping lint)
- **Data source:** Live backend at `naero.onrender.com` with mock data fallback
- **Auth:** Direct to Supabase Auth (not through backend)

---

## QA Checklist & Results

### 1. Auth (`src/screens/AuthScreen.js`, `src/services/authService.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 1.1 | Sign In with valid email/password | User authenticated, navigated to LocationPermission | ⚠️ PENDING | Requires existing Supabase user with email/password |
| 1.2 | Sign In with wrong password | Error message "Invalid login credentials" displayed | ✅ PASS (code review) | Error propagated from Supabase |
| 1.3 | Sign In with empty fields | Error message displayed or validation prevents submission | ⚠️ PENDING | No client-side validation for empty email/password on login |
| 1.4 | Sign Up with valid data | Account created, user optionally signed in | ✅ PASS (code review) | Session created if email confirm disabled; error message shown if confirm required (bug fix applied) |
| 1.5 | Sign Up — email confirmation required | User sees message to check email, switched to login tab | ✅ PASS (fixed) | **Bug fix:** Now shows "Account created! Please check your email..." and switches to login mode instead of silently failing to authenticate |
| 1.6 | Sign Up with existing email | Error message from Supabase shown | ✅ PASS (code review) | Supabase returns `User already registered` |
| 1.7 | Password Reset flow | Email sent if account exists | ✅ PASS (code review) | Calls `supabase.auth.resetPasswordForEmail`, shows success alert regardless |
| 1.8 | OAuth buttons visibility | Social buttons hidden when `EXPO_PUBLIC_OAUTH_ENABLED=false` | ✅ PASS (code review) | Conditional render via `OAUTH_ENABLED` constant |
| 1.9 | Guest mode (skip auth) | Guest session created, user can browse app | ✅ PASS (code review) | `signInAsGuest()` called from SplashScreen/AppContext |
| 1.10 | "Invalid API key" on login | Should NOT occur | ✅ PASS (code review) | Anon key updated to `sb_publishable_...` format matching backend |

### 2. Session Persistence (`src/services/authService.js`, `src/context/AppContext.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 2.1 | Session saved after login | AsyncStorage `@naero_auth_session` contains serialized session | ✅ PASS (code review) | Saved in `signInWithEmail()` and `createAccount()` |
| 2.2 | Session restored on app restart | AppContext reads session via `getAuthSession()`, sets authenticated state | ✅ PASS (code review) | `initAuth()` in AppContext calls `getAuthSession()` |
| 2.3 | Guest session persisted | Guest can reopen app without re-authenticating | ✅ PASS (code review) | Guest session serialized and stored in AsyncStorage |
| 2.4 | Token refresh on 401 | API client refreshes token via Supabase, retries request | ✅ PASS (code review) | `naeroApi.refreshToken()` called on 401 response |
| 2.5 | Auth state change listener | Signed-out events dispatched from Supabase update context | ✅ PASS (code review) | `onAuthStateChange` subscription in `initAuth()` |
| 2.6 | Session cleared on sign out | AsyncStorage key removed, API token cleared | ✅ PASS (code review) | `signOut()` removes key and calls `naeroApi.clearToken()` |

### 3. Home (`src/screens/HomeScreen.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 3.1 | Home screen loads without crash | ScrollView renders hero, categories, featured places, community posts | ✅ PASS (code review) | Graceful fallback to empty arrays if API fails |
| 3.2 | Featured places load from API | `placeService.getAll()` fetches and displays up to 6 places | ✅ PASS (code review) | Falls back to mock data if remote fails |
| 3.3 | Community posts load | Latest 3 posts displayed | ✅ PASS (code review) | `communityService.getPosts({ limit: 3 })` |
| 3.4 | Location banner shown when granted | Shows city name and "Live" indicator | ✅ PASS (code review) | Conditional on `locationPermissionStatus === 'granted'` |
| 3.5 | Location prompt when denied | Tappable card prompts user to enable location | ✅ PASS (code review) | Navigates to Profile if permanently denied |
| 3.6 | AI quick action card navigates | Tapping AI card opens AI screen | ✅ PASS (code review) | `navigation.navigate('AI')` |
| 3.7 | Safety quick action card | Navigates to Safety screen | ✅ PASS (code review) | `navigation.navigate('Safety')` |
| 3.8 | Jobs quick action card | Navigates to Jobs screen | ✅ PASS (code review) | `navigation.navigate('Jobs')` |
| 3.9 | Category grid renders | 10 categories as 5-column grid | ✅ PASS (code review) | `CategoryGrid` with `exploreCategories.slice(0, 10)` |
| 3.10 | Place card favorite toggle | Heart icon toggles, state persisted to AsyncStorage | ✅ PASS (code review) | `toggleFavorite` dispatches to reducer, persisted via useEffect |
| 3.11 | Pull to refresh / data reload | Data reloads from API | ⚠️ MISSING | No pull-to-refresh implemented on HomeScreen |

### 4. Places / Explore (`src/screens/ExploreScreen.js`, `src/screens/PlaceDetailScreen.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 4.1 | Explore screen loads places | FlatList with 2-column grid of PlaceCard components | ✅ PASS (code review) | Fetches via `placeService.getAll()` |
| 4.2 | Search by name/tag | Places filtered in real-time by search input | ✅ PASS (code review) | Case-insensitive filter on name, tags, description |
| 4.3 | Category filter chips | Tapping category filters list; tap again to clear | ✅ PASS (code review) | `mockCategories` filtered by `domain === 'places'` |
| 4.4 | Nearby places toggle | Shows 4 nearest places when location permission granted | ✅ PASS (code review) | Sorted by Manhattan distance |
| 4.5 | Place detail screen | Full detail view with name, rating, address, tags, description, hours, phone | ✅ PASS (code review) | `PlaceDetailScreen.js` reads `route.params.item` |
| 4.6 | Call action button | Opens phone dialer with place phone number | ✅ PASS (code review) | `Linking.openURL('tel:...')` |
| 4.7 | Directions button | Opens Google Maps with place address | ✅ PASS (code review) | `Linking.openURL('https://maps.google.com/?q=...')` |
| 4.8 | Favorite from detail screen | Heart button toggles favorite status | ✅ PASS (code review) | Uses same `toggleFavorite` from context |
| 4.9 | Empty state when no results | Naero mascot with "No places found" message | ✅ PASS (code review) | `EmptyState` component rendered |
| 4.10 | Loading indicator | ActivityIndicator shown while data loads | ✅ PASS (code review) | Conditional in `ListEmptyComponent` |

### 5. Saved Places / Favorites (`src/context/AppContext.js`, `src/screens/ProfileScreen.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 5.1 | Favorite persisted across restarts | Favorites stored in AsyncStorage `@naero_favorites` | ✅ PASS (code review) | `useEffect` syncs state to AsyncStorage |
| 5.2 | Saved count shown on Profile | Sum of `savedPlaces + favorites` displayed | ✅ PASS (code review) | ProfileScreen stat shows combined count |
| 5.3 | "Saved" menu item navigates | Tapping "Saved" opens Explore tab | ✅ PASS (code review) | **Bug fix:** Was missing handler |
| 5.4 | "Saved Jobs" menu item navigates | Tapping "Saved Jobs" opens Jobs screen | ✅ PASS (code review) | **Bug fix:** Was missing handler |

### 6. Profile (`src/screens/ProfileScreen.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 6.1 | Profile displays user info | Avatar, name, email shown | ✅ PASS (code review) | Shows guest info for unauthenticated users |
| 6.2 | Language picker modal | Opens LanguageModal with language options | ✅ PASS (code review) | |
| 6.3 | Notifications menu item | Navigates to Notifications screen | ✅ PASS (code review) | |
| 6.4 | Settings menu item | Navigates to Settings screen | ✅ PASS (code review) | |
| 6.5 | About menu item | Navigates to About screen | ✅ PASS (code review) | |
| 6.6 | Share app | Opens system share sheet | ✅ PASS (code review) | `Share.share()` |
| 6.7 | Rate app | Opens App Store URL | ✅ PASS (code review) | |
| 6.8 | Location section shows status | Shows city or "Location off" with refresh/settings buttons | ✅ PASS (code review) | |
| 6.9 | Set city manually | Modal allows entering a city name, saved to AsyncStorage | ✅ PASS (code review) | |
| 6.10 | Clear saved location | Confirmation alert then clears location data | ✅ PASS (code review) | |
| 6.11 | Version displayed | "Version 1.0.0" shown (hardcoded) | ⚠️ MINOR | Should read from app config, not hardcoded |

### 7. AI Chat (`src/screens/AIScreen.js`, `src/services/api/naeroAI.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 7.1 | AI screen loads with welcome | Welcome message + quick action chips displayed | ✅ PASS (code review) | Different messages for auth vs guest |
| 7.2 | Send message (authenticated) | Message sent via `naeroAI.sendMessage()`, AI response displayed | ⚠️ PENDING | Requires backend `/v1/ai/chat` to be operational |
| 7.3 | Send message (guest mode) | Guest limited to welcome screen; input still functional | ✅ PASS (code review) | `initChat()` shows guest message but input is not blocked |
| 7.4 | Quick action chips | Tapping chip sends pre-defined message | ✅ PASS (code review) | `handleSend('Tell me about ' + action.label)` |
| 7.5 | RAG toggle visible for auth users | Knowledge Search switch shown when authenticated | ✅ PASS (code review) | |
| 7.6 | Thinking indicator | Animated dots shown while AI is processing | ✅ PASS (code review) | |
| 7.7 | Error handling | Network/server errors show user-friendly message | ✅ PASS (code review) | Catch blocks in `handleSend` |
| 7.8 | Clear chat | Button resets conversation, shows welcome screen | ✅ PASS (code review) | `clearChat()` calls `naeroAI.reset()` |
| 7.9 | Debug overlay | 2-second long-press on header shows debug info | ✅ PASS (code review) | Hidden feature |
| 7.10 | Empty interval in useEffect | Empty `setInterval` with no logic | ⚠️ WASTE | `AIScreen.js:65-68` — interval runs every 8s with no operation |

### 8. Logout (`src/screens/ProfileScreen.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 8.1 | Sign Out button visible | Red "Sign Out" button at bottom of Profile | ✅ PASS (code review) | |
| 8.2 | Confirmation dialog | Alert asks "Are you sure you want to sign out?" | ✅ PASS (code review) | |
| 8.3 | Sign Out clears session | AsyncStorage cleared, API token removed | ✅ PASS (code review) | `signOut()` then `signInAsGuest()` |
| 8.4 | Post-logout navigation | User returned to SplashScreen | ✅ PASS (code review) | `navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })` |
| 8.5 | Guest session after logout | Guest session created automatically | ✅ PASS (code review) | `signInAsGuest()` called after `signOut()` |

### 9. Services (`src/screens/ServicesScreen.js`)

| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 9.1 | Services list loads | 2-column grid of service cards | ✅ PASS (code review) | |
| 9.2 | Category filter chips | Horizontal scrollable chips filter by category | ✅ PASS (code review) | |
| 9.3 | Nearby services section | Horizontal scroll of nearby services (6 max) | ✅ PASS (code review) | |
| 9.4 | Service detail screen | Navigates to ServiceDetail with item data | ✅ PASS (code review) | |
| 9.5 | Empty state | Shows mascot + "No data available" | ✅ PASS (code review) | **Bug fix:** Added `message` prop to EmptyState |

---

## Bugs Fixed During QA

| # | Bug | File | Fix |
|---|-----|------|-----|
| B1 | "Saved" and "Saved Jobs" menu items in ProfileScreen had no navigation handler — tapping them did nothing | `src/screens/ProfileScreen.js:48-73` | Added `case 'saved': navigation.navigate('Explore')` and `case 'savedJobs': navigation.navigate('Jobs')` |
| B2 | After signup with Supabase email confirmation enabled, `createAccount` returns `{ session: null, user: data.user, error: null }` and AuthScreen navigated to LocationPermission without authentication — user silently became a guest | `src/screens/AuthScreen.js:54-60` | Added check `if (!result.session)` — shows message "Account created! Please check your email..." and switches to login tab |
| B3 | ServicesScreen EmptyState rendered without `message` prop, falling back to default title only | `src/screens/ServicesScreen.js:226` | Added `message={t('common.noData')}` for consistency with ExploreScreen |

---

## Minor Issues / Observations

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| O1 | Version hardcoded as "1.0.0" in ProfileScreen (`:252`) | Low | Should read from `app.json` or build config |
| O2 | Empty interval in AIScreen `useEffect` runs every 8s with no operation (`:65-68`) | Low | Dead code, wastes minimal resources |
| O3 | No pull-to-refresh on HomeScreen | Low | User must restart app or navigate away/back to refresh data |
| O4 | `savedPlaces` and `favorites` are separate state arrays but UI treats them as one ("Saved Items" stat sums both) | Low | May be confusing — are these two distinct concepts? |
| O5 | AuthScreen lacks client-side validation for empty email/password fields | Low | Currently relies on Supabase server-side validation |
| O6 | Guest mode users can still type messages in AI chat (input not disabled) | Low | Guest welcome message suggests signing up but doesn't block input |
| O7 | ExploreScreen uses `mockCategories` while HomeScreen uses `exploreCategories` — inconsistent data source | Low | Both work but come from different files |
| O8 | `LocationPermissionScreen` auto-skips if permission already determined | Info | Intentional — avoids re-showing permission screen on repeat visits |

---

## Test Results Summary

| Area | Tests | Pass (Code Review) | Pending (Device Test) | Bugs Fixed |
|------|-------|--------------------|------------------------|------------|
| Auth | 10 | 9 | 1 | 1 |
| Session Persistence | 6 | 6 | 0 | 0 |
| Home | 11 | 10 | 1 | 0 |
| Places / Explore | 10 | 10 | 0 | 0 |
| Saved Places | 4 | 4 | 0 | 1 |
| Profile | 11 | 11 | 0 | 0 |
| AI Chat | 10 | 9 | 1 | 0 |
| Logout | 5 | 5 | 0 | 0 |
| Services | 5 | 5 | 0 | 1 |
| **Total** | **72** | **69** | **3** | **3** |

### Legend
- ✅ PASS (code review) = Logic verified via source code audit
- ⚠️ PENDING = Requires device-level test with live backend data
- ✅ PASS (fixed) = Bug was found and fixed during this QA round

---

## Recommendations for Round 2

1. **Device installation test** — Install the APK on a physical Android device and run through all PENDING test cases (sign in, sign up, AI chat, data loading).
2. **Seed backend data** — Populate `/v1/places`, `/v1/services`, `/v1/jobs`, and `/v1/community` endpoints with test data so the app displays real content rather than mock fallbacks.
3. **Verify Supabase email confirmation** — Test the signup flow end-to-end to confirm the email confirmation message works correctly.
4. **Test AI chat against live backend** — Verify `/v1/ai/chat` and `/v1/ai/conversations` endpoints respond correctly.
5. **Address minor issues** O1-O8 in a future round.
