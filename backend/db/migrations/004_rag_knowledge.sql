-- Sprint 4 Phase 3: RAG & Knowledge Engine.
-- Apply through Supabase SQL Editor after 003_platform_foundation.sql.
-- Requires: pgvector extension.

-- ============================================================
-- 1. ENABLE PGVECTOR EXTENSION
-- ============================================================
create extension if not exists vector;

-- ============================================================
-- 2. KNOWLEDGE EMBEDDINGS TABLE
-- ============================================================
create table if not exists public.knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  token_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_source_type on public.knowledge_embeddings(source_type);
create index if not exists idx_knowledge_source_id on public.knowledge_embeddings(source_type, source_id);
create index if not exists idx_knowledge_embeddings_vector on public.knowledge_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- 3. SIMILARITY SEARCH FUNCTION
-- ============================================================
create or replace function public.match_knowledge(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10,
  filter_source_type text default null,
  filter_metadata jsonb default null
)
returns table (
  id uuid,
  source_type text,
  source_id text,
  content text,
  metadata jsonb,
  token_count integer,
  similarity float,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    ke.id,
    ke.source_type,
    ke.source_id,
    ke.content,
    ke.metadata,
    ke.token_count,
    1 - (ke.embedding <=> query_embedding) as similarity,
    ke.created_at
  from public.knowledge_embeddings ke
  where
    (filter_source_type is null or ke.source_type = filter_source_type)
    and (filter_metadata is null or ke.metadata @> filter_metadata)
    and 1 - (ke.embedding <=> query_embedding) > match_threshold
  order by ke.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================
-- 4. KEYWORD-AWARE HYBRID SEARCH FUNCTION
-- ============================================================
create or replace function public.match_knowledge_hybrid(
  query_embedding vector(1536),
  query_text text,
  match_threshold float default 0.7,
  match_count int default 10,
  filter_source_type text default null,
  vector_weight float default 0.7,
  keyword_weight float default 0.3
)
returns table (
  id uuid,
  source_type text,
  source_id text,
  content text,
  metadata jsonb,
  token_count integer,
  similarity float,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  with vector_matches as (
    select
      ke.id,
      ke.source_type,
      ke.source_id,
      ke.content,
      ke.metadata,
      ke.token_count,
      1 - (ke.embedding <=> query_embedding) as vector_score,
      ke.created_at
    from public.knowledge_embeddings ke
    where
      (filter_source_type is null or ke.source_type = filter_source_type)
      and 1 - (ke.embedding <=> query_embedding) > match_threshold
  ),
  keyword_matches as (
    select
      ke.id,
      ke.source_type,
      ke.source_id,
      ke.content,
      ke.metadata,
      ke.token_count,
      ts_rank(
        to_tsvector('english', coalesce(ke.content, '')),
        plainto_tsquery('english', query_text)
      ) as keyword_score,
      ke.created_at
    from public.knowledge_embeddings ke
    where
      (filter_source_type is null or ke.source_type = filter_source_type)
      and to_tsvector('english', coalesce(ke.content, '')) @@ plainto_tsquery('english', query_text)
  )
  select
    coalesce(v.id, k.id) as id,
    coalesce(v.source_type, k.source_type) as source_type,
    coalesce(v.source_id, k.source_id) as source_id,
    coalesce(v.content, k.content) as content,
    coalesce(v.metadata, k.metadata)::jsonb as metadata,
    coalesce(v.token_count, k.token_count) as token_count,
    coalesce(v.vector_score * vector_weight, 0) + coalesce(k.keyword_score * keyword_weight, 0) as similarity,
    coalesce(v.created_at, k.created_at) as created_at
  from vector_matches v
  full outer join keyword_matches k on v.id = k.id
  order by similarity desc
  limit match_count;
end;
$$;

-- ============================================================
-- 5. FULL-TEXT SEARCH INDEX
-- ============================================================
create index if not exists idx_knowledge_content_fts
  on public.knowledge_embeddings
  using gin (to_tsvector('english', coalesce(content, '')));

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
alter table public.knowledge_embeddings enable row level security;

drop policy if exists "Anyone can read knowledge embeddings" on public.knowledge_embeddings;
create policy "Anyone can read knowledge embeddings"
  on public.knowledge_embeddings for select
  using (true);

drop policy if exists "Service role can manage knowledge embeddings" on public.knowledge_embeddings;
create policy "Service role can manage knowledge embeddings"
  on public.knowledge_embeddings for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 7. TRIGGERS
-- ============================================================
drop trigger if exists knowledge_embeddings_set_updated_at on public.knowledge_embeddings;
create trigger knowledge_embeddings_set_updated_at
  before update on public.knowledge_embeddings
  for each row execute function public.set_updated_at();

-- ============================================================
-- 8. ADD TO REALTIME PUBLICATION
-- ============================================================
alter publication supabase_realtime add table public.knowledge_embeddings;
