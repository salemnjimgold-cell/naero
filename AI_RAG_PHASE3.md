# Sprint 4 Phase 3 — RAG & Knowledge Engine

## Goal
Enable Naero's AI to answer questions grounded in real data by implementing a Retrieval-Augmented Generation (RAG) system with a vectorized knowledge base.

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────────┐
│   Context Assembly          │
│   ┌─────────────────────┐   │
│   │ User Profile        │   │
│   │ Location            │   │
│   │ Saved Places        │   │
│   │ Conversation History│   │
│   │ Retrieved Knowledge │   │  ← RAG documents injected here
│   └─────────────────────┘   │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│   Retrieval Pipeline        │
│   ┌─────────────────────┐   │
│   │ Embed Query (1536d) │   │
│   │ Semantic Search     │   │  ← vector cosine distance
│   │ Hybrid Search       │   │  ← vector + FTS (70/30)
│   │ Metadata Filter     │   │  ← city/country/place/review/doc
│   │ Format Documents    │   │
│   └─────────────────────┘   │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│   Vector Store (pgvector)   │
│   ┌─────────────────────┐   │
│   │ knowledge_embeddings│   │
│   │ vector(1536)         │   │
│   │ ivfflat index       │   │
│   │ FTS index (english) │   │
│   └─────────────────────┘   │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│   Knowledge Sources         │
│   Cities │ Countries        │
│   Places │ Reviews          │
│   Markdown docs (.md)       │
└─────────────────────────────┘
```

## What Was Built

### 1. Migration (`004_rag_knowledge.sql`)
- Enables `vector` extension (pgvector)
- Creates `public.knowledge_embeddings` table with:
  - `content TEXT`, `metadata JSONB`, `embedding vector(1536)`
  - Source tracking: `source_type`, `source_id`
  - `ivfflat` index with 100 lists for ANN search
  - FTS index on `content` for hybrid search
- Two RPC functions:
  - `match_knowledge(query_embedding, match_threshold, match_count)` — pure semantic search
  - `match_knowledge_hybrid(query_embedding, query_text, match_threshold, match_count)` — vector + keyword (weighted 70/30)
- Row-level security: authenticated users can read, service role can write

### 2. Embeddings Service (`knowledge/embeddings.js`)
- OpenAI `text-embedding-3-small` (1536d) as primary provider
- Gemini `text-embedding-004` (768d) as secondary provider
- `embed(text)` — single text → vector
- `embedBatch(texts)` — batch embedding (up to 20 at once)
- `chunkText(text, maxTokens)` — splits text by paragraphs, recombines
- `estimateTokens(text)` — rough token estimation (4 chars/token)
- `provider` and `configured` flags for route checking

### 3. Vector Store (`knowledge/vectorStore.js`)
- `insert(entries)` — batch insert with content, metadata, embedding
- `upsert(entries)` — upsert by content hash
- `remove(ids)` — delete by IDs
- `semanticSearch(embedding, options)` — calls `match_knowledge()` RPC
- `hybridSearch(embedding, text, options)` — calls `match_knowledge_hybrid()` RPC
- `count()` — total document count
- All operations via Supabase REST API + RPC

### 4. Retrieval Pipeline (`knowledge/retrieval.js`)
- `retrieve(query, options)` — main entry point:

| Option | Default | Description |
|--------|---------|-------------|
| `matchCount` | 5 | Number of documents to retrieve |
| `threshold` | 0.7 | Minimum similarity score (0-1) |
| `useHybrid` | true | Use hybrid search (vector + FTS) |
| `sourceType` | null | Filter by source type |
| `maxTokens` | null | Max document tokens for prompt |

- Returns: `{ data: [...], metrics: { latencyMs, retrievedCount, confidence, embedTokens, strategy } }`
- `formatDocuments(docs, maxChars)` — formats documents with headers

### 5. Knowledge Sources (`knowledge/sources.js`)
- `indexCityInfo(cities)` — batch embed city objects → vector store
- `indexCountryInfo(countries)` — batch embed country objects → vector store
- `indexMarkdownFiles(dir)` — reads `.md` files, chunks, embeds, indexes
- `indexAllPlaces()` — fetches places from DB, chunks descriptions
- `indexApprovedReviews()` — fetches approved reviews from DB

### 6. Context Assembly (`knowledge/assembly.js`)
- `assemble(query, contextData, options)` — merges RAG documents + user context
  - Builds sections: User Profile, Location, Retrieved Knowledge, Saved Places, Conversation History
  - Truncates to `MAX_RAG_CHARS` (6000) and `MAX_HISTORY_CHARS` (3000)
- `assembleForPrompt(query, contextData, options)` — returns flat prompt string
- `getRetrievalMetrics(assembly)` — extracts latency, count, confidence

### 7. Seed Data
- **5 Hungarian cities**: Budapest, Debrecen, Szeged, Pécs, Győr (with population, transport, cost of living, facts)
- **1 country**: Hungary (with capital, language, currency, EU/Schengen info)
- **6 markdown files**: immigration-guide, housing-guide, jobs-guide, healthcare-guide, emergency-guide, local-guide
- Seed script: `backend/scripts/seed-knowledge.js`

## Integration Points

### AI Services (`services/ai/index.js`)
- `createKnowledgeEngine(env, repositories)` instantiated inside `createAIServices()`
- `chat()` method: when `options.ragEnabled === true`:
  1. Calls `knowledgeEngine.retrieveAndAssemble(message, contextData)`
  2. Prepends retrieved knowledge to context string
  3. Returns `ragMetrics` alongside response
- `knowledgeEngine` exposed on returned services object

### AI Routes (`routes/ai.js`)
- `POST /v1/ai/chat` supports new body fields:
  - `ragEnabled: boolean` — enable RAG for this query
  - `ragMatchCount: number` — documents to retrieve (default 5)
  - `ragThreshold: number` — similarity threshold (default 0.7)
  - `ragHybrid: boolean` — use hybrid search (default true)
  - `ragSourceType: string` — filter by source type (city_info, country_info, knowledge_md, place, review)
- Response includes `ragMetrics` when RAG is enabled:
  ```json
  {
    "ragMetrics": {
      "latencyMs": 45,
      "retrievedCount": 5,
      "confidence": 0.89,
      "embedTokens": 128,
      "strategy": "hybrid",
      "threshold": 0.7
    }
  }
  ```

## Files Changed/Added

### New Files
| File | Purpose |
|------|---------|
| `db/migrations/004_rag_knowledge.sql` | pgvector table, RPCs, indexes, RLS |
| `services/ai/knowledge/embeddings.js` | Embedding service (OpenAI + Gemini) |
| `services/ai/knowledge/vectorStore.js` | pgvector CRUD + search operations |
| `services/ai/knowledge/retrieval.js` | Retrieval pipeline (semantic/hybrid) |
| `services/ai/knowledge/sources.js` | Knowledge source connectors |
| `services/ai/knowledge/assembly.js` | Context assembly merging RAG + user data |
| `services/ai/knowledge/index.js` | Knowledge engine factory, seed data |
| `scripts/seed-knowledge.js` | Knowledge base seeder script |
| `knowledge/immigration-guide.md` | Immigration guide document |
| `knowledge/housing-guide.md` | Housing guide document |
| `knowledge/jobs-guide.md` | Jobs & employment guide document |
| `knowledge/healthcare-guide.md` | Healthcare guide document |
| `knowledge/emergency-guide.md` | Emergency & safety guide document |
| `knowledge/local-guide.md` | Local life guide document |

### Modified Files
| File | Change |
|------|--------|
| `services/ai/index.js` | Integrated knowledge engine, RAG in chat() |
| `routes/ai.js` | RAG options passthrough, ragMetrics in response |

## Verification

```bash
# All modules load
node -e "
  const { createKnowledgeEngine } = require('./src/services/ai/knowledge/index');
  const { createRepositories } = require('./src/services/repositories/index');
  const { readEnv } = require('./src/config/env');
  const env = readEnv();
  const repos = createRepositories(env);
  const ke = createKnowledgeEngine(env, repos);
  console.log('Embeddings:', ke.embeddings.provider, ke.embeddings.configured);
  console.log('VectorStore, Retrieval, Sources, Assembly: OK');
"

# Seed knowledge (dry run)
node scripts/seed-knowledge.js --dry-run

# Verify AI services integration
node -e "
  const { createAIServices } = require('./src/services/ai/index');
  const srv = createAIServices(require('./src/config/env').readEnv(), require('./src/services/repositories/index').createRepositories(), null);
  console.log('knowledgeEngine' in srv, typeof srv.chat === 'function');
"
```

## Known Limitations
- Embedding dimension fixed at 1536 (OpenAI `text-embedding-3-small`). Gemini `text-embedding-004` returns 768d — full Gemini support would need downcast or separate column.
- `ivfflat` index with 100 lists is suitable for ~1M documents; larger datasets may benefit from HNSW or increased lists.
- No embedding caching — each query re-embeds the input text (acceptable for Phase 3).
- Full indexing of database content (places, reviews) requires a configured Supabase project with data.
- pgvector extension must be enabled on Supabase project manually before running migration 004.

## Prerequisites for Production
1. Apply migration `003_platform_foundation.sql` then `004_rag_knowledge.sql`
2. Enable pgvector extension in Supabase project
3. Set `OPENAI_API_KEY` (or `GEMINI_API_KEY`) for embedding generation
4. Run `node scripts/seed-knowledge.js` to populate initial knowledge base
5. Set `AI_EMBEDDINGS_PROVIDER` (optional, defaults to `AI_PROVIDER`)
