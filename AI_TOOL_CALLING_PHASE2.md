# AI Platform — Phase 2: Tool Calling

**Date**: 2026-06-29
**Sprint**: 4 — AI Platform Phase 2
**Goal**: Allow Naero AI to safely interact with backend data through controlled tools.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     POST /v1/ai/chat                          │
│  { message, conversationId, tools: ["searchPlaces", ...] }   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    AI Services (index.js)                     │
│                                                              │
│  1. Build context + history + system prompt                  │
│  2. Filter tool definitions by requested tools               │
│  3. Send messages + tool definitions to gateway/provider      │
│  4. Provider returns text OR function call                    │
│  5. If function call → execute tool via Tool Executor         │
│  6. Return text response + tool results to client             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Tool Executor                              │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Registry │→│Permissions   │→│Rate      │→│Execute  │ │
│  │          │  │Check         │  │Limiter   │  │Tool     │ │
│  └──────────┘  └──────────────┘  └──────────┘  └────┬────┘ │
│                                                      │       │
│                                              ┌───────▼─────┐ │
│                                              │ Audit Log   │ │
│                                              │ (Activity)  │ │
│                                              └─────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Repository Layer                           │
│  places │ savedPlaces │ reviews │ reports │ notifications    │
│  profiles │ activityLogs                                      │
└──────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/src/services/ai/tools/
├── index.js              # Public API — exports createToolRegistry, createToolExecutor
├── registry.js           # Tool registry — combines all tools, validates permissions
├── executor.js           # Tool executor — permission checks, rate limiting, audit logging
├── permissions.js        # Permission definitions and checking logic
├── rateLimiter.js        # In-memory rate limiter per-user per-tool
├── places.js             # searchPlaces, getPlaceDetails
├── savedPlaces.js        # getSavedPlaces, savePlace
├── reviews.js            # createReview
├── reports.js            # createReport
├── notifications.js      # getNotifications, createNotification
└── profile.js            # getUserProfile, updateUserPreferences
```

## Tools Registry

10 tools are registered with schemas, permissions, and rate limits:

| Tool | Permission | Rate Limit | Auth Required | Description |
|------|-----------|------------|---------------|-------------|
| `searchPlaces` | `read:places` | 30/min | No | Search places by city, category, or query |
| `getPlaceDetails` | `read:places` | 60/min | No | Get full place details by ID |
| `getSavedPlaces` | `read:saved_places` | 30/min | Yes | List user's saved places |
| `savePlace` | `write:saved_places` | 20/min | Yes | Save/bookmark a place |
| `createReview` | `write:reviews` | 10/min | Yes | Submit a review with rating |
| `createReport` | `write:reports` | 5/min | Yes | Flag/report content |
| `getNotifications` | `read:notifications` | 30/min | Yes | List user's notifications |
| `createNotification` | `write:notifications` | 10/min | Yes | Create an in-app notification |
| `getUserProfile` | `read:profile` | 30/min | Yes | Get own profile |
| `updateUserPreferences` | `write:profile` | 10/min | Yes | Update profile fields |

## Permission Model

### Permission Levels

| Permission | Type | Resource | Auth Required | Ownership Check |
|-----------|------|----------|:-------------:|:--------------:|
| `read:places` | read | places | No | No |
| `read:reviews` | read | reviews | No | No |
| `read:saved_places` | read | saved_places | Yes | Yes |
| `read:notifications` | read | notifications | Yes | Yes |
| `read:profile` | read | profile | Yes | Yes |
| `write:reviews` | write | reviews | Yes | No |
| `write:saved_places` | write | saved_places | Yes | Yes |
| `write:reports` | write | reports | Yes | No |
| `write:notifications` | write | notifications | Yes | No |
| `write:profile` | write | profile | Yes | Yes |

- **Public read**: `read:places` and `read:reviews` — anyone can call these tools without authentication.
- **User-owned**: `read:saved_places`, `read:notifications`, `read:profile`, `write:profile`, `write:saved_places` — strict user isolation; tools reject cross-user access.
- **Auth-only**: `write:reviews`, `write:reports`, `write:notifications` — require authentication but allow writing.

### Tool Execution Flow

```
1. Parse tool name and arguments
2. Look up tool in registry → return UNKNOWN_TOOL if not found
3. Check permissions → return PERMISSION_DENIED if insufficient
4. Check rate limit → return RATE_LIMITED if exceeded
5. Execute tool implementation via repository layer
6. Record audit log (always, success or failure)
7. Return structured result
```

## Tool Result Format

```json
{
  "tool": "searchPlaces",
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Central Park Cafe",
      "category": "restaurant",
      "city": "Budapest",
      "address": "...",
      "rating": 4.5
    }
  ],
  "error": null,
  "executionMs": 42
}
```

Error response:
```json
{
  "tool": "searchPlaces",
  "success": false,
  "data": null,
  "error": {
    "code": "MISSING_ARGUMENT",
    "message": "placeId is required."
  },
  "executionMs": 0
}
```

## Rate Limiting

- **Per-tool, per-user** rate limits using an in-memory sliding window.
- Each tool defines its own `rateLimit` (max calls per minute).
- Global rate limit: 60 calls/minute/user.
- Rate limit resets automatically after the window expires.
- Rate-limited calls return `RATE_LIMITED` with `retryAfterMs`.

## Audit Logging

Every tool execution is logged to the `activity_logs` table:

| Field | Value |
|-------|-------|
| `user_id` | Calling user ID |
| `activity_type` | `tool_execution` |
| `resource_type` | `ai_tool` |
| `description` | `Tool <name> succeeded/failed` |
| `metadata.tool` | Tool name |
| `metadata.args` | Sanitized arguments (sensitive keys redacted) |
| `metadata.success` | Boolean |
| `metadata.executionMs` | Execution time |
| `metadata.error` | Error message if failed |

Audit logging is fire-and-forget — failures in audit logging never block tool execution.

## OpenAI Function Calling Integration

When the `POST /v1/ai/chat` request includes a `tools` array, the gateway:
1. Filters tool definitions to only include requested tools
2. Passes them as function definitions to OpenAI
3. If OpenAI responds with a `tool_calls` array, executes each tool
4. Returns both the text response and tool results

**Request:**
```json
{
  "message": "Find restaurants in Budapest",
  "conversationId": "uuid",
  "tools": ["searchPlaces", "getPlaceDetails"]
}
```

**Response:**
```json
{
  "data": {
    "id": "chatcmpl-xxx",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "message": {
      "role": "assistant",
      "content": "I found several restaurants in Budapest..."
    },
    "usage": { ... },
    "tracking": { ... }
  },
  "executedTools": [
    {
      "tool": "searchPlaces",
      "success": true,
      "data": [...],
      "executionMs": 45
    }
  ]
}
```

## Safety Features

1. **No direct SQL** — all tools use the repository layer
2. **No arbitrary code execution** — only registered tools can be called
3. **Permission checks** — every tool requires specific permissions
4. **Rate limiting** — prevents abuse per-tool per-user
5. **Audit logging** — every call is logged for review
6. **Argument validation** — tools validate required fields and ranges
7. **Sensitive data redaction** — audit logs strip sensitive arguments
8. **Ownership enforcement** — user-scoped data is protected
9. **Fire-and-forget audit** — failures in logging never block execution

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/ai/tools` | List all tools with schemas and permissions |
| `POST` | `/v1/ai/tools/execute` | Execute a specific tool by name |
| `POST` | `/v1/ai/chat` | Chat with optional tool calling via `tools` array |

## Files Changed

**New Files** (9):

| File | Purpose |
|------|---------|
| `backend/src/services/ai/tools/index.js` | Public API exports |
| `backend/src/services/ai/tools/registry.js` | Tool registry with schema definitions |
| `backend/src/services/ai/tools/executor.js` | Tool execution with permissions, rate limits, audit |
| `backend/src/services/ai/tools/permissions.js` | Permission model and checking |
| `backend/src/services/ai/tools/rateLimiter.js` | In-memory rate limiter |
| `backend/src/services/ai/tools/places.js` | searchPlaces, getPlaceDetails |
| `backend/src/services/ai/tools/savedPlaces.js` | getSavedPlaces, savePlace |
| `backend/src/services/ai/tools/reviews.js` | createReview |
| `backend/src/services/ai/tools/reports.js` | createReport |
| `backend/src/services/ai/tools/notifications.js` | getNotifications, createNotification |
| `backend/src/services/ai/tools/profile.js` | getUserProfile, updateUserPreferences |
| `tests/ai_tool_calling.js` | Unit tests for tool calling |

**Modified Files** (3):

| File | Change |
|------|--------|
| `backend/src/services/ai/gateway.js` | Added tool call extraction support |
| `backend/src/services/ai/providers/openai.js` | Added native function calling support |
| `backend/src/services/ai/index.js` | Added tool executor integration, tool call handling in `chat()` |
| `backend/src/routes/ai.js` | Added `GET /v1/ai/tools`, `POST /v1/ai/tools/execute`, `tools` option in chat |
| `backend/src/server.js` | Passed profileStore to createAIServices |

**Frontend Files Changed**: ✅ **None** — `src/` untouched.

## Testing

Run the test suite:
```bash
node tests/ai_tool_calling.js
```

Tests cover:
1. **Tool Registry** — all 10 tools registered, definitions generated
2. **Permission Checks** — public reads allowed without auth, user-scoped denied without auth
3. **Allowed Tool Calls** — valid calls succeed with expected results
4. **Invalid Arguments** — missing/invalid args return proper error codes
5. **Unauthorized Calls** — auth-required tools fail without auth
6. **Unknown Tools** — unknown tool names return UNKNOWN_TOOL
7. **Rate Limiting** — rate-limited calls return RATE_LIMITED
8. **Audit Logging** — success and failure logs recorded with correct metadata
