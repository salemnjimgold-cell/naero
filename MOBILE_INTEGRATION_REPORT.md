# Sprint 5 — Mobile Integration

## Goal
Connect the existing React Native app to the production backend without redesigning the UI.

## Architecture

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│      Mobile App (Expo)      │      │     Backend (Node.js)        │
│                             │      │                              │
│  ┌───────────────────────┐  │      │  ┌────────────────────────┐  │
│  │   Screens (no change) │  │      │  │  /v1/ai/*              │  │
│  │   Home, Explore, AI,  │  │      │  │  /v1/notifications/*   │  │
│  │   Profile, etc.       │  │      │  │  /v1/places/*          │  │
│  └──────┬────────────────┘  │      │  │  /v1/auth/*            │  │
│         │                   │ REST │  └────────────────────────┘  │
│  ┌──────▼────────────────┐  │◄─────┤                              │
│  │   Service Layer       │  │      │  ┌────────────────────────┐  │
│  │   naeroApi (retry/    │  │      │  │  Supabase + AI + RAG   │  │
│  │   auth interceptor)   │  │      │  │  + pgvector + Realtime │  │
│  │   naeroAI (chat)      │  │      │  └────────────────────────┘  │
│  │   naeroNotifications  │  │      └──────────────────────────────┘
│  └──────┬────────────────┘  │
│         │                   │
│  ┌──────▼────────────────┐  │      ┌──────────────────────────────┐
│  │   Supabase Auth       │  │      │     Supabase Project         │
│  │   Sign in / Sign up   │──┼─────►│  Auth + Postgres + Realtime │
│  │   Session persistence │  │      └──────────────────────────────┘
│  │   Token refresh       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Offline Support     │  │
│  │   Cache (AsyncStorage)│  │
│  │   Retry Queue         │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Analytics           │  │
│  │   Screen views,       │  │
│  │   AI requests, search │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

## What Was Built

### 1. API Client (`src/services/api/naeroApi.js`)
- `createNaeroApiClient()` — factory with configurable `baseUrl`, `timeoutMs`, `fetchImpl`
- **Auth interceptor**: reads JWT from `AsyncStorage` (`@naero_api_token`), injects as `Authorization: Bearer` on every request
- **Automatic token refresh**: on `401` response, calls Supabase `auth.refreshSession()`, retries the original request with the new token
- **Retry with exponential backoff**: up to 3 retries for network errors and 5xx/429 responses; `1s → 2s → 4s` backoff
- Methods: `get()`, `post()`, `put()`, `patch()`, `delete()`
- Standardized response: `{ data, error, status, retryable }`

### 2. Supabase Auth Integration (`src/services/authService.js`)
| Feature | Function | Backend |
|---------|----------|---------|
| Sign in | `signInWithEmail(email, password)` | `supabase.auth.signInWithPassword()` |
| Sign up | `createAccount(email, password, name)` | `supabase.auth.signUp()` with metadata |
| Session restore | `getAuthSession()` | `supabase.auth.getSession()` + AsyncStorage |
| Logout | `signOut()` | `supabase.auth.signOut()` |
| Password reset | `requestPasswordReset(email)` | `supabase.auth.resetPasswordForEmail()` |
| Profile update | `updateProfile(updates)` | `supabase.auth.updateUser()` |
| Auth state listener | `onAuthStateChange(callback)` | `supabase.auth.onAuthStateChange()` |
| Guest mode | `signInAsGuest()` | AsyncStorage guest session (no backend) |

- Supabase client instantiated via `getSupabaseClient()` (singleton, lazy-loaded)
- Token stored in AsyncStorage and injected into `naeroApi` for all backend requests
- Auth state persisted across app restarts
- `AuthScreen` updated: error banner, loading spinner, forgot password flow, validation

### 3. Screen Connections

| Screen | Connection | Data Source |
|--------|-----------|-------------|
| **AuthScreen** | Supabase Auth | Live sign in/up/reset |
| **HomeScreen** | `placeService` → backend first, mock fallback | Remote API |
| **ExploreScreen** | `placeService.getAll()` → backend first, mock fallback | Remote API |
| **PlaceDetailScreen** | Route params from service (already works) | Remote API |
| **ProfileScreen** | Auth session, real user name/email, notification badge, sign out | Remote API + Supabase |
| **AIScreen** | `naeroAI.sendMessage()` → `POST /v1/ai/chat` | Backend AI |
| **NotificationsScreen** | `naeroNotifications` → `GET /v1/notifications` | Backend API |

### 4. AI Chat (`src/services/api/naeroAI.js`)
- `createNaeroAI()` — full backend AI integration
- `sendMessage(message, options)` → `POST /v1/ai/chat`
  - Supports: `conversationId`, `topic`, `model`, `provider`, `temperature`, `maxTokens`, `tools`
  - **RAG toggle**: `ragEnabled`, `ragMatchCount`, `ragThreshold`, `ragHybrid`, `ragSourceType`
  - Returns: `{ data, executedTools, ragMetrics, conversationId }`
- `ensureConversation()` — creates a conversation if none exists
- `getConversations()`, `getMessages()`, `getTemplates()`, `getProviders()`, `getTools()`
- `AIScreen` updated:
  - Backend AI replaces local Gemini engine
  - RAG toggle switch (shown when authenticated)
  - Debug overlay shows: source, provider, model, RAG status, timing
  - Graceful error handling for network failures

### 5. Realtime (`src/services/api/naeroRealtime.js`)
- `subscribeToNotifications(userId, callback)` — listens for `INSERT` on `notifications` table
- `subscribeToSavedPlaces(userId, callback)` — listens for `INSERT/UPDATE/DELETE` on `saved_places`
- `subscribeToAI(userId, callback)` — listens for `INSERT` on `ai_messages`
- `unsubscribeAll()` — cleanup on logout
- Notifications received in real-time are dispatched to context and increment `unreadNotifications`

### 6. Offline Support (`src/services/offlineQueue.js`)
- `enqueueWrite(operation)` — stores failed write ops in AsyncStorage queue
- `processQueue(executor)` — replays queued operations with retry logic
- `getQueue()`, `clearQueue()`, `getQueueSize()`
- Operations retry up to 3 times with backoff
- API client returns `retryable: true` on network errors for queue consumption

### 7. Error Handling
- **Unified `NaeroApiError`** class with `status`, `code`, `data`, `retryable` fields
- **Auth interceptor** catches 401, refreshes token, retries
- **Exponential backoff** for retryable errors (network, 5xx, 429)
- **Graceful degradation**: mock data fallback when API is unavailable
- **AuthScreen error banner** for login/signup failures
- **AIScreen error messages** for AI/network failures

### 8. Analytics (`src/services/analyticsService.js`)
- `track(eventName, properties)` — queues events; flushes to AsyncStorage every 30s
- `trackScreenView(screenName)` — screen opens
- `trackAIRequest(model, provider, topic)` — AI requests
- `trackSearch(query, category, resultCount)` — searches
- `trackPlaceOpen(placeId, placeName, category)` — place detail views
- `trackAuth(action)` — sign in, sign up, sign out
- `trackError(errorCode, context)` — error tracking
- `isAnalyticsEnabled()` / `setAnalyticsEnabled()` — opt-out support
- `getCachedEvents()` / `clearEvents()` — debug tooling

## Files Changed/Added

### New Files
| File | Purpose |
|------|---------|
| `services/supabase.js` | Supabase client singleton |
| `services/api/naeroApi.js` | Typed API client with auth/retry/backoff |
| `services/api/naeroAI.js` | AI chat service (POST /v1/ai/chat) |
| `services/api/naeroNotifications.js` | Notifications API service |
| `services/api/naeroRealtime.js` | Supabase Realtime subscriptions |
| `services/offlineQueue.js` | Offline retry queue |
| `services/analyticsService.js` | Analytics tracking service |
| `screens/NotificationsScreen.js` | Notifications screen with mark-read |

### Modified Files
| File | Change |
|------|--------|
| `.env` | Added EXPO_PUBLIC_NAERO_API_URL, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY |
| `config/api.js` | Added SUPABASE_URL, SUPABASE_ANON_KEY exports |
| `services/authService.js` | Complete rewrite with Supabase Auth |
| `services/dataService.js` | Added `remoteEndpoint` option for Naero API source |
| `services/placeService.js` | Naero API as primary source, mock fallback |
| `services/index.js` | Added 20+ new exports |
| `context/AppContext.js` | Auth state, realtime subscriptions, notification count |
| `screens/AuthScreen.js` | Connected to Supabase auth with error/loading states |
| `screens/AIScreen.js` | Backend AI integration with RAG toggle, debug overlay |
| `screens/ProfileScreen.js` | Real user info, notifications link with badge, auth logout |
| `navigation/AppNavigator.js` | Added Notifications route |

## Configuration Required

```bash
# .env — must be set before the app can connect
EXPO_PUBLIC_NAERO_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Dependencies Added
- `@supabase/supabase-js` — Supabase client (auth + realtime)

Install:
```bash
cd Naero\ V2
npx expo install @supabase/supabase-js
```

## Verification
1. Set environment variables in `.env`
2. Install `@supabase/supabase-js`
3. Run `npx expo start`
4. Test Auth: sign up, sign in, forgot password
5. Test AI: open AI Chat, send message, toggle RAG
6. Test Notifications: check badge count, view notifications
7. Test Realtime: receive push-delivery notifications
8. Test Offline: disable network, verify mock fallback

## Known Limitations
- Social login (Google, Apple, Facebook) buttons are UI-only; backend integration requires OAuth setup in Supabase
- `processQueue` requires manual triggering — no automatic retry on connectivity restoration
- Analytics are stored locally in AsyncStorage only; no remote analytics server configured
- Realtime subscriptions are raw Supabase Realtime; no presence tracking or broadcast channels used
- Guest mode persists in AsyncStorage but has no backend representation
- No Sentry/Bugsnag crash reporting integrated
