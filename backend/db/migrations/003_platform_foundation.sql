-- Sprint 3.5 Platform Foundation: Storage, Realtime, Notifications, Audit, Moderation.
-- Apply through Supabase SQL Editor after 002_core_data_tables.sql.
-- Requires: public.profiles, public.places, public.reviews from migrations 001-002.

-- ============================================================
-- 1. STORAGE BUCKETS (Supabase Storage)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('place-images', 'place-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('review-images', 'review-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('documents', 'documents', false, 10485760, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
on conflict (id) do nothing;

-- ============================================================
-- 2. STORAGE RLS POLICIES
-- ============================================================

-- Avatars: public read, authenticated users can upload/update own
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Place images: public read, any authenticated user can upload
drop policy if exists "Public read place images" on storage.objects;
create policy "Public read place images"
  on storage.objects for select
  using (bucket_id = 'place-images');

drop policy if exists "Authenticated users can upload place images" on storage.objects;
create policy "Authenticated users can upload place images"
  on storage.objects for insert
  with check (
    bucket_id = 'place-images'
    and auth.role() = 'authenticated'
  );

-- Review images: public read, authenticated upload
drop policy if exists "Public read review images" on storage.objects;
create policy "Public read review images"
  on storage.objects for select
  using (bucket_id = 'review-images');

drop policy if exists "Authenticated users can upload review images" on storage.objects;
create policy "Authenticated users can upload review images"
  on storage.objects for insert
  with check (
    bucket_id = 'review-images'
    and auth.role() = 'authenticated'
  );

-- Documents: owner-only access (not public)
drop policy if exists "Users can read own documents" on storage.objects;
create policy "Users can read own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload own documents" on storage.objects;
create policy "Users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 3. NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  channel text not null default 'in-app',
  status text not null default 'pending',
  read_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_user_status on public.notifications(user_id, status);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_type on public.notifications(type);

-- ============================================================
-- 4. ACTIVITY LOGS
-- ============================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  activity_type text not null,
  resource_type text,
  resource_id uuid,
  description text,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_user on public.activity_logs(user_id);
create index if not exists idx_activity_logs_type on public.activity_logs(activity_type);
create index if not exists idx_activity_logs_resource on public.activity_logs(resource_type, resource_id);
create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);
create index if not exists idx_activity_logs_user_created on public.activity_logs(user_id, created_at desc);

-- ============================================================
-- 5. MODERATION QUEUE
-- ============================================================
create type if not exists public.moderation_status as enum ('pending', 'reviewed', 'approved', 'rejected', 'escalated');

alter table public.reviews add column if not exists moderation_status public.moderation_status not null default 'pending';
alter table public.reviews add column if not exists moderated_by uuid references auth.users(id) on delete set null;
alter table public.reviews add column if not exists moderated_at timestamptz;
alter table public.reviews add column if not exists moderation_note text;

create table if not exists public.moderation_queue (
  id uuid primary key default gen_random_uuid(),
  reportable_type text not null,
  reportable_id uuid not null,
  reason text not null,
  description text,
  status public.moderation_status not null default 'pending',
  priority text not null default 'normal',
  assigned_to uuid references auth.users(id) on delete set null,
  flagged_by uuid references auth.users(id) on delete set null,
  flags jsonb default '[]'::jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mod_queue_status on public.moderation_queue(status);
create index if not exists idx_mod_queue_priority on public.moderation_queue(priority);
create index if not exists idx_mod_queue_type on public.moderation_queue(reportable_type, reportable_id);
create index if not exists idx_mod_queue_assigned on public.moderation_queue(assigned_to);
create index if not exists idx_mod_queue_created on public.moderation_queue(created_at desc);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderation_id uuid not null references public.moderation_queue(id) on delete cascade,
  action_type text not null,
  actioned_by uuid references auth.users(id) on delete set null,
  reason text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mod_actions_moderation on public.moderation_actions(moderation_id);
create index if not exists idx_mod_actions_type on public.moderation_actions(action_type);

-- ============================================================
-- 6. REVIEW STATUS WORKFLOW CONSTRAINTS
-- ============================================================
-- approved reviews must have moderated_by and moderated_at set
-- rejected reviews must have a moderation_note

-- ============================================================
-- 7. ENABLE REALTIME FOR RELEVANT TABLES
-- ============================================================
-- These enable the Supabase Realtime publication for change events
-- Note: Realtime must also be enabled via the Supabase dashboard UI

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activity_logs;
alter publication supabase_realtime add table public.moderation_queue;
alter publication supabase_realtime add table public.moderation_actions;
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.saved_places;
alter publication supabase_realtime add table public.ai_conversations;

-- ============================================================
-- 8. RLS POLICIES FOR NEW TABLES
-- ============================================================

-- Notifications
alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can insert notifications (handled by backend)
drop policy if exists "Service role can insert notifications" on public.notifications;
create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'service_role' or auth.uid() = user_id);

-- Activity Logs
alter table public.activity_logs enable row level security;

drop policy if exists "Users can read own activity logs" on public.activity_logs;
create policy "Users can read own activity logs"
  on public.activity_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can insert activity logs" on public.activity_logs;
create policy "Service role can insert activity logs"
  on public.activity_logs for insert
  with check (auth.role() = 'service_role');

-- Moderation Queue
alter table public.moderation_queue enable row level security;

drop policy if exists "Service role can manage moderation queue" on public.moderation_queue;
create policy "Service role can manage moderation queue"
  on public.moderation_queue for all
  using (auth.role() = 'service_role');

-- Moderation Actions
alter table public.moderation_actions enable row level security;

drop policy if exists "Service role can manage moderation actions" on public.moderation_actions;
create policy "Service role can manage moderation actions"
  on public.moderation_actions for all
  using (auth.role() = 'service_role');

-- Review moderation columns — service role only
drop policy if exists "Service role can update review moderation" on public.reviews;
create policy "Service role can update review moderation"
  on public.reviews for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- 9. PERFORMANCE INDEXES
-- ============================================================
-- Additional indexes for common query patterns

-- Reviews: composite for moderation workflow
create index if not exists idx_reviews_moderation on public.reviews(moderation_status, created_at desc) where moderation_status != 'approved';
create index if not exists idx_reviews_moderated_by on public.reviews(moderated_by);

-- Places: full-text search on name and description
create index if not exists idx_places_name_trgm on public.places using gin (name gin_trgm_ops);
create index if not exists idx_places_description_trgm on public.places using gin (description gin_trgm_ops);

-- ============================================================
-- 10. TRIGGERS (updated_at for new tables)
-- ============================================================
drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

drop trigger if exists moderation_queue_set_updated_at on public.moderation_queue;
create trigger moderation_queue_set_updated_at
  before update on public.moderation_queue
  for each row execute function public.set_updated_at();

-- ============================================================
-- 11. STORAGE BUCKET RLS
-- ============================================================
-- Ensure storage.objects has RLS enabled (should be default)
alter table storage.objects enable row level security;
