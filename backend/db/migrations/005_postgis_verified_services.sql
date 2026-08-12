-- Milestone 4: Naero-owned verified geospatial service registry.
-- No production service listings are inserted by this migration.

begin;

create schema if not exists extensions;

do $$
declare
  installed_schema text;
begin
  select namespace.nspname
    into installed_schema
  from pg_extension extension_record
  join pg_namespace namespace on namespace.oid = extension_record.extnamespace
  where extension_record.extname = 'postgis';

  if installed_schema is not null and installed_schema <> 'extensions' then
    raise exception
      'POSTGIS_SCHEMA_MISMATCH: expected extensions, found %',
      installed_schema
      using errcode = '55000';
  end if;
end;
$$;

create extension if not exists postgis with schema extensions;

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text,
  icon_key text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_categories_key_unique unique (key),
  constraint service_categories_key_format check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint service_categories_name_nonempty check (btrim(name) <> '')
);

create table if not exists public.verified_services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id) on delete restrict,
  name text not null,
  description text,
  organization_name text,
  status text not null default 'active',
  verification_status text not null default 'draft',
  confidence text not null default 'medium',
  source_type text not null,
  source_organization text,
  source_url text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  district text,
  region text,
  postal_code text,
  country_code text,
  location extensions.geography(Point, 4326) not null,
  languages text[] not null default '{}',
  accessibility jsonb,
  opening_hours jsonb,
  is_free boolean,
  appointment_required boolean,
  active boolean not null default true,
  last_verified_at timestamptz,
  verification_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint verified_services_name_nonempty check (btrim(name) <> ''),
  constraint verified_services_country_code check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint verified_services_status check (status in ('active', 'inactive', 'suspended')),
  constraint verified_services_verification_status check (verification_status in ('draft', 'pending', 'approved', 'rejected', 'expired')),
  constraint verified_services_confidence check (confidence in ('high', 'medium', 'low')),
  constraint verified_services_source_type check (source_type in ('government', 'official', 'ngo', 'partner', 'manual_review')),
  constraint verified_services_location_not_origin check (
    not (
      extensions.st_x(location::extensions.geometry) = 0
      and extensions.st_y(location::extensions.geometry) = 0
    )
  ),
  constraint verified_services_expiry_order check (
    verification_expires_at is null
    or last_verified_at is null
    or verification_expires_at > last_verified_at
  )
);

create table if not exists public.service_verification_log (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.verified_services(id) on delete cascade,
  action text not null,
  previous_status text,
  new_status text,
  source_url text,
  notes text,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint service_verification_log_action check (action in ('created', 'submitted', 'approved', 'rejected', 'reverified', 'expired', 'deactivated', 'updated'))
);

create table if not exists public.service_provider_links (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.verified_services(id) on delete cascade,
  provider text not null,
  provider_id text not null,
  created_at timestamptz not null default now(),
  constraint service_provider_links_provider check (provider in ('google', 'osm', 'official')),
  constraint service_provider_links_id_nonempty check (btrim(provider_id) <> ''),
  constraint service_provider_links_unique unique (provider, provider_id),
  constraint service_provider_links_service_provider_unique unique (service_id, provider)
);

insert into public.service_categories (key, name)
values
  ('immigration_office', 'Immigration office'),
  ('government_office', 'Government office'),
  ('legal_aid', 'Legal aid'),
  ('ngo', 'NGO'),
  ('translator', 'Translator'),
  ('hospital', 'Hospital'),
  ('clinic', 'Clinic'),
  ('pharmacy', 'Pharmacy'),
  ('police', 'Police'),
  ('emergency', 'Emergency'),
  ('shelter', 'Shelter'),
  ('community_center', 'Community center'),
  ('job_center', 'Job center'),
  ('school', 'School'),
  ('language_school', 'Language school'),
  ('public_transport', 'Public transport'),
  ('bank', 'Bank'),
  ('atm', 'ATM'),
  ('post_office', 'Post office'),
  ('supermarket', 'Supermarket'),
  ('halal_food', 'Halal food'),
  ('religious_center', 'Religious center'),
  ('childcare', 'Childcare'),
  ('social_services', 'Social services')
on conflict (key) do nothing;

drop trigger if exists service_categories_set_updated_at on public.service_categories;
create trigger service_categories_set_updated_at
before update on public.service_categories
for each row execute function public.set_updated_at();

drop trigger if exists verified_services_set_updated_at on public.verified_services;
create trigger verified_services_set_updated_at
before update on public.verified_services
for each row execute function public.set_updated_at();

create index if not exists idx_verified_services_location_gist
  on public.verified_services using gist (location);
create index if not exists idx_verified_services_country_city
  on public.verified_services (country_code, city);
create index if not exists idx_verified_services_category
  on public.verified_services (category_id);
create index if not exists idx_verified_services_public_state
  on public.verified_services (active, status, verification_status, verification_expires_at);
create index if not exists idx_verified_services_last_verified
  on public.verified_services (last_verified_at desc);
create index if not exists idx_service_verification_log_service_created
  on public.service_verification_log (service_id, created_at desc);
create index if not exists idx_service_provider_links_service
  on public.service_provider_links (service_id);

alter table public.service_categories enable row level security;
alter table public.verified_services enable row level security;
alter table public.service_verification_log enable row level security;
alter table public.service_provider_links enable row level security;
alter table public.service_categories force row level security;
alter table public.verified_services force row level security;
alter table public.service_verification_log force row level security;
alter table public.service_provider_links force row level security;

drop policy if exists "Public can read active service categories" on public.service_categories;
create policy "Public can read active service categories"
on public.service_categories for select
using (active = true);

drop policy if exists "Public can read approved verified services" on public.verified_services;
create policy "Public can read approved verified services"
on public.verified_services for select
using (
  active = true
  and status = 'active'
  and verification_status = 'approved'
  and (verification_expires_at is null or verification_expires_at > now())
);

revoke all on public.service_categories from anon, authenticated;
revoke all on public.verified_services from anon, authenticated;
revoke all on public.service_verification_log from anon, authenticated;
revoke all on public.service_provider_links from anon, authenticated;
grant select on public.service_categories to anon, authenticated;
grant select, insert, update, delete on public.service_categories to service_role;
grant select, insert, update, delete on public.verified_services to service_role;
grant select, insert, update, delete on public.service_verification_log to service_role;
grant select, insert, update, delete on public.service_provider_links to service_role;
grant usage on schema extensions to service_role;

create or replace function public.nearby_verified_services(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer default 5000,
  p_category_key text default null,
  p_filter_country_code text default null,
  p_result_limit integer default 20,
  p_language text default 'en'
)
returns table (
  id uuid,
  provider text,
  provider_id text,
  category text,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  address text,
  city text,
  district text,
  region text,
  postal_code text,
  country_code text,
  phone text,
  website text,
  opening_hours jsonb,
  verified boolean,
  confidence text,
  last_verified_at timestamptz,
  source_attribution text,
  navigation_url text
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  origin extensions.geography(Point, 4326);
begin
  if p_latitude is null or p_longitude is null
    or p_latitude < -90 or p_latitude > 90
    or p_longitude < -180 or p_longitude > 180
    or (p_latitude = 0 and p_longitude = 0) then
    raise exception 'INVALID_COORDINATES' using errcode = '22023';
  end if;
  if p_radius_meters is null or p_radius_meters < 1 or p_radius_meters > 50000 then
    raise exception 'INVALID_RADIUS' using errcode = '22023';
  end if;
  if p_result_limit is null or p_result_limit < 1 or p_result_limit > 50 then
    raise exception 'INVALID_LIMIT' using errcode = '22023';
  end if;
  if p_filter_country_code is not null and p_filter_country_code !~ '^[A-Z]{2}$' then
    raise exception 'INVALID_COUNTRY_CODE' using errcode = '22023';
  end if;
  if p_language not in ('en', 'ar', 'fr', 'hu') then
    raise exception 'INVALID_LANGUAGE' using errcode = '22023';
  end if;

  origin := extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography;

  return query
  select
    service.id,
    'naero'::text,
    service.id::text,
    category.key,
    service.name,
    service.description,
    extensions.st_y(service.location::extensions.geometry),
    extensions.st_x(service.location::extensions.geometry),
    extensions.st_distance(service.location, origin),
    service.address,
    service.city,
    service.district,
    service.region,
    service.postal_code,
    service.country_code,
    service.phone,
    service.website,
    service.opening_hours,
    true,
    service.confidence,
    service.last_verified_at,
    coalesce(service.source_organization, 'Naero verified service'),
    'https://www.google.com/maps/dir/?api=1&destination='
      || extensions.st_y(service.location::extensions.geometry)::text
      || ',' || extensions.st_x(service.location::extensions.geometry)::text
  from public.verified_services service
  join public.service_categories category on category.id = service.category_id
  where category.active = true
    and service.active = true
    and service.status = 'active'
    and service.verification_status = 'approved'
    and (service.verification_expires_at is null or service.verification_expires_at > now())
    and (p_category_key is null or category.key = p_category_key)
    and (p_filter_country_code is null or service.country_code = p_filter_country_code)
    and extensions.st_dwithin(service.location, origin, p_radius_meters)
  order by service.location <-> origin
  limit p_result_limit;
end;
$$;

revoke all on function public.nearby_verified_services(double precision, double precision, integer, text, text, integer, text) from public;
grant execute on function public.nearby_verified_services(double precision, double precision, integer, text, text, integer, text)
  to anon, authenticated, service_role;

comment on function public.nearby_verified_services is
  'Public-safe nearby query that exposes only approved, active, unexpired Naero verified services.';

commit;
