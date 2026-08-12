-- Sprint 3 Database Sprint 1: Core data tables for Naero platform.
-- Apply through Supabase SQL Editor after 001_core_auth_profiles.sql.
-- Requires: public.profiles, auth.users(id) from migration 001.

-- ============================================================
-- 1. PLACES
-- ============================================================
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  subcategory text,
  address text,
  city text not null,
  country text not null default 'Hungary',
  latitude double precision,
  longitude double precision,
  phone text,
  website text,
  email text,
  opening_hours jsonb,
  tags text[],
  verified boolean not null default false,
  source text not null default 'user',
  source_id text,
  metadata jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  title text,
  content text,
  language text not null default 'en',
  helpful_count integer not null default 0,
  reported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_review_per_user_per_place unique (place_id, user_id)
);

-- ============================================================
-- 3. REPORTS (content moderation)
-- ============================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reportable_type text not null,
  reportable_id uuid not null,
  reason text not null,
  description text,
  status text not null default 'pending',
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. AI CONVERSATIONS
-- ============================================================
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  topic text,
  message_count integer not null default 0,
  language text not null default 'en',
  is_archived boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. AI MESSAGES
-- ============================================================
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  content_redacted boolean not null default false,
  tokens_in integer,
  tokens_out integer,
  model text,
  latency_ms integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. SAVED PLACES (user bookmarks)
-- ============================================================
create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  list_name text not null default 'default',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint one_place_per_list unique (user_id, place_id, list_name)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Places
create index if not exists idx_places_city on public.places(city);
create index if not exists idx_places_category on public.places(category);
create index if not exists idx_places_tags on public.places using gin(tags);
create index if not exists idx_places_verified on public.places(verified);
create index if not exists idx_places_source on public.places(source);
create index if not exists idx_places_created_by on public.places(created_by);
create index if not exists idx_places_location on public.places(latitude, longitude);
create index if not exists idx_places_city_category on public.places(city, category);

-- Reviews
create index if not exists idx_reviews_place_id on public.reviews(place_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);
create index if not exists idx_reviews_rating on public.reviews(rating);
create index if not exists idx_reviews_created_at on public.reviews(created_at);
create index if not exists idx_reviews_place_rating on public.reviews(place_id, rating);

-- Reports
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_reporter on public.reports(reporter_id);
create index if not exists idx_reports_type_target on public.reports(reportable_type, reportable_id);
create index if not exists idx_reports_resolved_by on public.reports(resolved_by);

-- AI Conversations
create index if not exists idx_ai_convs_user on public.ai_conversations(user_id);
create index if not exists idx_ai_convs_created on public.ai_conversations(created_at);
create index if not exists idx_ai_convs_user_archived on public.ai_conversations(user_id, is_archived);

-- AI Messages
create index if not exists idx_ai_msgs_conversation on public.ai_messages(conversation_id);
create index if not exists idx_ai_msgs_conv_created on public.ai_messages(conversation_id, created_at);
create index if not exists idx_ai_msgs_role on public.ai_messages(role);

-- Saved Places
create index if not exists idx_saved_places_user on public.saved_places(user_id);
create index if not exists idx_saved_places_place on public.saved_places(place_id);
create index if not exists idx_saved_places_user_list on public.saved_places(user_id, list_name);
create index if not exists idx_saved_places_sort on public.saved_places(user_id, list_name, sort_order);

-- ============================================================
-- TRIGGERS (updated_at)
-- ============================================================
drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

drop trigger if exists ai_conversations_set_updated_at on public.ai_conversations;
create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

drop trigger if exists saved_places_set_updated_at on public.saved_places;
create trigger saved_places_set_updated_at
  before update on public.saved_places
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Places
alter table public.places enable row level security;

-- Anyone can read places
drop policy if exists "Anyone can read places" on public.places;
create policy "Anyone can read places"
  on public.places for select
  using (true);

-- Authenticated users can create places
drop policy if exists "Authenticated users can create places" on public.places;
create policy "Authenticated users can create places"
  on public.places for insert
  with check (auth.role() = 'authenticated');

-- Owners can update their own places
drop policy if exists "Owners can update own places" on public.places;
create policy "Owners can update own places"
  on public.places for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Owners can delete their own places
drop policy if exists "Owners can delete own places" on public.places;
create policy "Owners can delete own places"
  on public.places for delete
  using (auth.uid() = created_by);

-- Reviews
alter table public.reviews enable row level security;

-- Anyone can read reviews
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

-- Authenticated users can create reviews
drop policy if exists "Authenticated users can create reviews" on public.reviews;
create policy "Authenticated users can create reviews"
  on public.reviews for insert
  with check (auth.role() = 'authenticated');

-- Review owners can update their own reviews
drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Review owners can delete their own reviews
drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Reports
alter table public.reports enable row level security;

-- Users can create reports
drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
  on public.reports for insert
  with check (auth.role() = 'authenticated');

-- Users can read their own reports
drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- Users can update their own reports
drop policy if exists "Users can update own reports" on public.reports;
create policy "Users can update own reports"
  on public.reports for update
  using (auth.uid() = reporter_id)
  with check (auth.uid() = reporter_id);

-- AI Conversations
alter table public.ai_conversations enable row level security;

-- Users can CRUD own conversations
drop policy if exists "Users can read own conversations" on public.ai_conversations;
create policy "Users can read own conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own conversations" on public.ai_conversations;
create policy "Users can create own conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own conversations" on public.ai_conversations;
create policy "Users can update own conversations"
  on public.ai_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own conversations" on public.ai_conversations;
create policy "Users can delete own conversations"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

-- AI Messages
alter table public.ai_messages enable row level security;

-- Users can read messages in their conversations
drop policy if exists "Users can read own messages" on public.ai_messages;
create policy "Users can read own messages"
  on public.ai_messages for select
  using (
    exists (
      select 1 from public.ai_conversations
      where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
    )
  );

-- Users can create messages in their conversations
drop policy if exists "Users can create own messages" on public.ai_messages;
create policy "Users can create own messages"
  on public.ai_messages for insert
  with check (
    exists (
      select 1 from public.ai_conversations
      where ai_conversations.id = conversation_id
      and ai_conversations.user_id = auth.uid()
    )
  );

-- Messages are immutable after creation (no update/delete policies)

-- Saved Places
alter table public.saved_places enable row level security;

-- Users can CRUD own saved places
drop policy if exists "Users can read own saved places" on public.saved_places;
create policy "Users can read own saved places"
  on public.saved_places for select
  using (auth.uid() = user_id);

drop policy if exists "Users can save places" on public.saved_places;
create policy "Users can save places"
  on public.saved_places for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved places" on public.saved_places;
create policy "Users can update own saved places"
  on public.saved_places for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove own saved places" on public.saved_places;
create policy "Users can remove own saved places"
  on public.saved_places for delete
  using (auth.uid() = user_id);
