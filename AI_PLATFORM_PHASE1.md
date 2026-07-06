# AI Platform — Phase 1 Report

**Date**: 2026-06-29
**Sprint**: 4 — AI Platform Phase 1
**Goal**: Build core AI architecture for Naero without changing the frontend.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Frontend)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / JSON
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Naero Backend API                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    /v1/ai/* Routes                        │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                    AI Services (index.js)                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │   │
│  │  │ Gateway  │  │ Prompts  │  │ Context  │  │ Memory  │  │   │
│  │  └────┬─────┘  └──────────┘  └──────────┘  └─────────┘  │   │
│  │       │                                                    │   │
│  │  ┌────▼───────────────────────────────────────────────┐   │   │
│  │  │              Provider Factory                       │   │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │   │
│  │  │  │ OpenAI   │  │  Gemini  │  │  Claude  │          │   │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘          │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │              Tracking (token & cost)                 │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Supabase (DB + Storage)                 │   │
│  │  ai_conversations │ ai_messages │ profiles │ saved_places│   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/src/services/ai/
├── index.js                 # Public API — composes all services
├── gateway.js               # Provider-agnostic gateway
├── context.js               # Context builder (profile, location, history, saved)
├── memory.js                # Memory layer (short-term, long-term, summaries)
├── tracking.js              # Token & cost tracking
├── prompts/
│   ├── index.js             # Prompt template registry
│   └── templates.js         # 8 domain-specific prompt templates
└── providers/
    ├── factory.js           # Provider factory + registry
    ├── openai.js            # OpenAI provider implementation
    ├── gemini.js            # Google Gemini provider implementation
    └── claude.js            # Anthropic Claude provider implementation
```

## Layers

### 1. AI Gateway (`gateway.js`)

The gateway is the single entry point for all AI requests. It is provider-agnostic:

- Receives a unified request: `{ messages, options, provider }`
- Routes to the correct provider via the provider factory
- Measures latency
- Calculates estimated cost
- Returns a unified response

**Unified Request Format:**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "options": {
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "maxTokens": 4096,
    "topP": 1
  },
  "provider": "openai"
}
```

**Unified Response Format:**
```json
{
  "id": "chatcmpl-xxx",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "message": {
    "role": "assistant",
    "content": "Here is your answer..."
  },
  "usage": {
    "promptTokens": 150,
    "completionTokens": 200,
    "totalTokens": 350
  },
  "tracking": {
    "latencyMs": 1234,
    "estimatedCostUsd": 0.00015
  }
}
```

### 2. Provider Factory (`providers/factory.js`)

Manages the provider registry and resolves the active provider:

- `getProvider(name)` — returns a provider instance by name
- `getConfiguredProviders()` — returns all providers with API keys set
- `getDefaultProvider()` — returns preferred provider (from `AI_PROVIDER` env) or first configured

### 3. Provider Implementations

Each provider wraps a different LLM API into a unified interface:

| File | Provider | Default Model | API Key |
|------|----------|---------------|---------|
| `providers/openai.js` | OpenAI | `gpt-4o-mini` | `OPENAI_API_KEY` |
| `providers/gemini.js` | Google Gemini | `gemini-2.0-flash` | `GEMINI_API_KEY` |
| `providers/claude.js` | Anthropic Claude | `claude-3-5-sonnet-20241022` | `ANTHROPIC_API_KEY` |

Each provider supports:
- `chat(messages, options)` — synchronous chat completion
- `stream(messages, options)` — placeholder for future streaming
- `estimateCost(model, promptTokens, completionTokens)` — cost calculation
- `name`, `configured`, `models` — metadata properties

**OpenAI models supported:** gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
**Gemini models supported:** gemini-2.0-flash, gemini-2.0-pro, gemini-1.5-flash, gemini-1.5-pro
**Claude models supported:** claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus, claude-3-sonnet, claude-3-haiku

### 4. Prompt Engine (`prompts/`)

**Template Registry** (`prompts/index.js`):
- `getTemplate(topic)` — resolves a topic string to the matching template
- `buildSystemPrompt(topic, context)` — builds the full system prompt with injected context
- `buildMessages(topic, userMessage, context, history)` — assembles the full messages array
- `getTemplateInfo()` — returns metadata about all templates

**8 Domain Templates** (`prompts/templates.js`):

| Template ID | Name | Topics |
|-------------|------|--------|
| `immigration` | Immigration Advisor | visa, residency, citizenship, work permit |
| `housing` | Housing Assistant | rental, apartment, accommodation, real estate |
| `jobs` | Jobs & Career Advisor | employment, work, salary, CV, interview |
| `healthcare` | Healthcare Guide | doctor, hospital, insurance, TAJ card |
| `translation` | Translation & Language Assistant | translate, Hungarian, language learning |
| `local_guide` | Local Guide | Budapest, neighborhoods, transport, culture |
| `emergency` | Emergency Assistant | 112, police, ambulance, crisis, safety |
| `general_assistant` | General Assistant | General questions about life in Hungary |

Each template includes:
- A detailed system prompt with domain-specific knowledge
- Behavioral guidelines for the AI
- A list of related topics for routing

### 5. Context Builder (`context.js`)

Combines 4 data sources into a structured context object:

```
┌───────────────────────────────────────────┐
│              Context Object                │
├───────────────────────────────────────────┤
│ user: {                                   │
│   displayName, homeCountry, currentCity,  │
│   preferredLanguage, housingStatus,       │
│   workStatus, migrationReason             │
│ }                                         │
│ location: { country, city, language }     │
│ history: [{ role, content, createdAt }]   │
│ savedPlaces: [{ name, category, city }]   │
│ topic: "immigration"                      │
└───────────────────────────────────────────┘
```

- `buildContext(userId, conversationId, topic)` — fetches all data in parallel
- `formatContextForPrompt(context)` — serializes context into a formatted string for injection into system prompts
- `formatHistoryForPrompt(history)` — serializes conversation history

### 6. Memory Layer (`memory.js`)

Three-tier memory system:

| Tier | Source | Use |
|------|--------|-----|
| **Short-term** | `ai_messages` table | Last 20 messages in current conversation |
| **Long-term** | `profiles` table | User preferences (language, housing, work status) |
| **Summaries** | `ai_conversations` table | Conversation metadata (topic, title, message count) |

- `getConversationMemory(conversationId)` — fetches recent messages
- `getLongTermPreferences(userId)` — fetches user profile preferences
- `getConversationSummary(conversationId)` — fetches conversation metadata
- `addMessage(conversationId, role, content, options)` — persists a message with optional tracking metadata

### 7. Token & Cost Tracking (`tracking.js`)

Records every AI interaction with full telemetry:

| Field | Source |
|-------|--------|
| `provider` | Provider name |
| `model` | Model identifier |
| `prompt_tokens` | From provider response |
| `completion_tokens` | From provider response |
| `total_tokens` | Calculated |
| `latency_ms` | Measured by gateway |
| `estimated_cost_usd` | Calculated from rate card |
| `user_id` | Authenticated user |
| `conversation_id` | Active conversation |
| `status` | `success` or `error` |
| `error_message` | Error details if failed |

Cost calculation uses hardcoded rate cards per provider/model.

### 8. AI Services Integration (`index.js`)

The `createAIServices(env, repositories)` function composes all layers into a single `chat()` method:

```
chat(userId, conversationId, message, options)
  → Builds context (profile + location + saved places)
  → Fetches conversation history
  → Selects template by topic
  → Constructs system + user messages
  → Calls gateway (→ provider)
  → Saves user + assistant messages to memory
  → Increments conversation message_count
  → Records tracking event
  → Returns unified response
```

## API Routes

All AI routes require authentication (Bearer JWT).

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/ai/conversations` | List user's conversations (paginated) |
| `POST` | `/v1/ai/conversations` | Create new conversation |
| `GET` | `/v1/ai/conversations/:id` | Get conversation details |
| `GET` | `/v1/ai/conversations/:id/messages` | Get conversation messages (paginated) |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/ai/chat` | Send message and get AI response |

**Chat Request Body:**
```json
{
  "conversationId": "uuid",
  "message": "What documents do I need for a residence permit?",
  "topic": "immigration",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 4096,
  "provider": "openai"
}
```

### Configuration

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/ai/templates` | List available prompt templates |
| `GET` | `/v1/ai/providers` | List configured providers |

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | No | — | OpenAI API key |
| `GEMINI_API_KEY` | No | — | Google Gemini API key |
| `ANTHROPIC_API_KEY` | No | — | Anthropic Claude API key |
| `AI_PROVIDER` | No | `openai` | Preferred provider name |
| `AI_MODEL` | No | Provider default | Model to use (e.g., `gpt-4o-mini`) |

At least one API key must be set for AI functionality to work.

### Provider Selection Logic

1. If `provider` is specified in the request, use that provider.
2. Otherwise, use `AI_PROVIDER` env variable.
3. If the chosen provider is not configured, fall back to the first configured provider.
4. If no providers are configured, return `AI_NOT_AVAILABLE` error.

## Testing

### Unit Tests (Manual)

```bash
# Verify all modules load
node -e "
  const { readEnv } = require('./src/config/env');
  const { createRepositories } = require('./src/services/repositories/index');
  const { createAIServices } = require('./src/services/ai/index');
  const ai = createAIServices(readEnv(), createRepositories(readEnv()));
  console.log('Templates:', ai.prompts.getTemplateInfo().length);
  console.log('Providers:', ai.providerFactory.registry.join(', '));
"
```

### Integration Test (with API key)

```bash
# Set a key and test chat
OPENAI_API_KEY=sk-xxx node -e "
  const { readEnv } = require('./src/config/env');
  const { createRepositories } = require('./src/services/repositories/index');
  const { createAIServices } = require('./src/services/ai/index');
  const env = readEnv();
  const ai = createAIServices(env, createRepositories(env));
  // Requires an existing conversation UUID
  ai.chat('user-id', 'conv-id', 'Hello!').then(r => console.log(JSON.stringify(r)));
"
```

## What Was NOT Implemented (Phase 1 Scope)

The following are explicitly excluded from Phase 1 and deferred to future phases:

- ❌ Streaming responses
- ❌ RAG (Retrieval-Augmented Generation)
- ❌ Tool calling / function execution
- ❌ Plugin system
- ❌ Frontend changes
- ❌ Rate limiting on AI endpoints

## Files Changed

**New Files** (12):

| File | Purpose |
|------|---------|
| `backend/src/services/ai/index.js` | AI services composition and `chat()` method |
| `backend/src/services/ai/gateway.js` | Provider-agnostic AI gateway |
| `backend/src/services/ai/context.js` | Context builder (profile, location, history, saved) |
| `backend/src/services/ai/memory.js` | Memory layer (short-term, long-term, summaries) |
| `backend/src/services/ai/tracking.js` | Token & cost tracking |
| `backend/src/services/ai/providers/factory.js` | Provider factory and registry |
| `backend/src/services/ai/providers/openai.js` | OpenAI provider |
| `backend/src/services/ai/providers/gemini.js` | Google Gemini provider |
| `backend/src/services/ai/providers/claude.js` | Anthropic Claude provider |
| `backend/src/services/ai/prompts/index.js` | Prompt template registry |
| `backend/src/services/ai/prompts/templates.js` | 8 domain-specific prompt templates |
| `backend/src/routes/ai.js` | AI API routes |

**Modified Files** (2):

| File | Change |
|------|--------|
| `backend/src/config/env.js` | Added `ai` config block (`provider`, `model`, API keys) |
| `backend/src/server.js` | Added AI services initialization and `/v1/ai/*` route handler |

**Frontend Files Changed**: ✅ **None** — `src/` untouched.

## Verification

| Check | Result |
|-------|--------|
| AI services load all 6 modules | ✅ |
| Prompt engine loads all 8 templates | ✅ |
| Provider factory recognizes 3 providers | ✅ |
| Gateway accepts unified request format | ✅ |
| Context builder returns structured object | ✅ |
| Memory layer reads/writes conversations | ✅ |
| Tracking records cost calculations | ✅ |
| AI routes match `/v1/ai/*` paths | ✅ |
| Auth enforced on all AI routes | ✅ |
| Smoke tests pass | ✅ |
| No frontend files modified | ✅ |
