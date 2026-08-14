-- LDE-3 backend-only persistent discovered-place store. Inserts no data.
begin;
create table if not exists public.discovered_places (
 id uuid primary key default gen_random_uuid(), category_key text not null references public.service_categories(key),
 name text not null check(btrim(name)<>''), location extensions.geography(Point,4326) not null,
 address text, city text, district text, region text, postal_code text, country_code text not null check(country_code~'^[A-Z]{2}$'),
 phone text, website text, opening_hours jsonb, permanently_closed boolean not null default false, active boolean not null default true,
 first_seen_at timestamptz not null, last_seen_at timestamptz not null, refreshed_at timestamptz not null, expires_at timestamptz not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(expires_at>refreshed_at), check(last_seen_at>=first_seen_at)
);
create table if not exists public.discovered_place_sources (
 id uuid primary key default gen_random_uuid(), place_id uuid not null references public.discovered_places(id) on delete cascade,
 provider text not null check(provider~'^[a-z][a-z0-9_-]{1,31}$'), provider_record_id text not null check(btrim(provider_record_id)<>''),
 attribution text not null check(btrim(attribution)<>''), licence_id text not null, licence_url text not null,
 osm_copyright_url text not null, provider_url text not null, terms_url text not null, content_fingerprint text,
 first_seen_at timestamptz not null, last_seen_at timestamptz not null, fetched_at timestamptz not null,
 unique(provider,provider_record_id)
);
create table if not exists public.discovery_cells (
 cell_id text not null, category_key text not null references public.service_categories(key), radius_bucket integer not null check(radius_bucket in(1000,2000,5000,10000,25000,50000)),
 country_code text not null check(country_code~'^[A-Z]{2}$'), language text not null check(language in('en','ar','fr','hu')),
 last_successful_refresh timestamptz not null, expires_at timestamptz not null, result_count integer not null check(result_count between 0 and 50),
 source_policy_version text not null default 'lde-3', schema_version text not null default 'discovered-v1',
 primary key(cell_id,category_key,radius_bucket,country_code,language)
);
create index if not exists idx_discovered_places_location_gist on public.discovered_places using gist(location);
create index if not exists idx_discovered_places_lookup on public.discovered_places(category_key,country_code,active,expires_at);
create index if not exists idx_discovered_sources_place on public.discovered_place_sources(place_id);
create index if not exists idx_discovery_cells_freshness on public.discovery_cells(category_key,country_code,expires_at);
alter table public.discovered_places enable row level security; alter table public.discovered_places force row level security;
alter table public.discovered_place_sources enable row level security; alter table public.discovered_place_sources force row level security;
alter table public.discovery_cells enable row level security; alter table public.discovery_cells force row level security;
revoke all on public.discovered_places,public.discovered_place_sources,public.discovery_cells from public,anon,authenticated;
grant select,insert,update,delete on public.discovered_places,public.discovered_place_sources,public.discovery_cells to service_role;

create or replace function public.nearby_discovered_places(p_latitude double precision,p_longitude double precision,p_radius_meters integer,p_category_key text,p_filter_country_code text,p_result_limit integer,p_include_stale boolean default false)
returns table(id uuid,provider text,provider_id text,category text,name text,latitude double precision,longitude double precision,distance_meters double precision,address text,city text,district text,region text,postal_code text,country_code text,phone text,website text,opening_hours jsonb,fetched_at timestamptz,expires_at timestamptz,source_attribution text,licence_id text,licence_url text,osm_copyright_url text,provider_url text,terms_url text,stale boolean)
language sql stable security definer set search_path=public,extensions as $$
 select p.id,s.provider,s.provider_record_id,p.category_key,p.name,extensions.st_y(p.location::extensions.geometry),extensions.st_x(p.location::extensions.geometry),extensions.st_distance(p.location,extensions.st_setsrid(extensions.st_makepoint(p_longitude,p_latitude),4326)::extensions.geography),p.address,p.city,p.district,p.region,p.postal_code,p.country_code,p.phone,p.website,p.opening_hours,s.fetched_at,p.expires_at,s.attribution,s.licence_id,s.licence_url,s.osm_copyright_url,s.provider_url,s.terms_url,p.expires_at<=now()
 from public.discovered_places p join public.discovered_place_sources s on s.place_id=p.id
 where p.active and not p.permanently_closed and p_latitude between -90 and 90 and p_longitude between -180 and 180
 and p_radius_meters between 1 and 50000 and p_result_limit between 1 and 50
 and (p_filter_country_code is null or p_filter_country_code~'^[A-Z]{2}$')
 and (p_include_stale or p.expires_at>now()) and (p_category_key is null or p.category_key=p_category_key) and (p_filter_country_code is null or p.country_code=p_filter_country_code)
 and extensions.st_dwithin(p.location,extensions.st_setsrid(extensions.st_makepoint(p_longitude,p_latitude),4326)::extensions.geography,p_radius_meters)
 order by p.location <-> extensions.st_setsrid(extensions.st_makepoint(p_longitude,p_latitude),4326)::extensions.geography limit least(greatest(p_result_limit,1),50)
$$;
revoke all on function public.nearby_discovered_places(double precision,double precision,integer,text,text,integer,boolean) from public,anon,authenticated;
grant execute on function public.nearby_discovered_places(double precision,double precision,integer,text,text,integer,boolean) to service_role;

create or replace function public.upsert_discovered_place(p_record jsonb) returns uuid language plpgsql security definer set search_path=public,extensions as $$
declare v_place uuid; v_now timestamptz:=now();
begin
 if auth.role()<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
 if p_record->>'provider'<>'geoapify' or nullif(btrim(p_record->>'providerId'),'') is null
   or nullif(btrim(p_record->>'name'),'') is null or nullif(btrim(p_record->>'sourceAttribution'),'') is null
   or not exists(select 1 from public.service_categories where key=p_record->>'category' and active)
   or (p_record->>'latitude')::double precision not between -90 and 90
   or (p_record->>'longitude')::double precision not between -180 and 180
   or upper(p_record->>'countryCode')!~'^[A-Z]{2}$'
   or (p_record->>'expiresAt')::timestamptz<=v_now
   or (p_record->>'expiresAt')::timestamptz>v_now+interval '8 days'
   or p_record->>'licenceId'<>'ODbL-1.0'
   or p_record->>'licenceUrl'<>'https://opendatacommons.org/licenses/odbl/1-0/'
   or p_record->>'osmCopyrightUrl'<>'https://www.openstreetmap.org/copyright'
   or p_record->>'providerUrl'<>'https://www.geoapify.com/'
   or p_record->>'termsUrl'<>'https://www.geoapify.com/terms-and-conditions/'
   or p_record->>'sourceAttribution'<>'© OpenStreetMap contributors; Powered by Geoapify'
 then raise exception 'INVALID_DISCOVERY_RECORD' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended((p_record->>'provider')||':'||(p_record->>'providerId'),0));
 select place_id into v_place from public.discovered_place_sources where provider=p_record->>'provider' and provider_record_id=p_record->>'providerId' for update;
 if v_place is null then
  insert into public.discovered_places(category_key,name,location,address,city,district,region,postal_code,country_code,phone,website,opening_hours,first_seen_at,last_seen_at,refreshed_at,expires_at)
  values(p_record->>'category',p_record->>'name',extensions.st_setsrid(extensions.st_makepoint((p_record->>'longitude')::double precision,(p_record->>'latitude')::double precision),4326)::extensions.geography,p_record->>'address',p_record->>'city',p_record->>'district',p_record->>'region',p_record->>'postalCode',upper(p_record->>'countryCode'),p_record->>'phone',p_record->>'website',p_record->'openingHours',v_now,v_now,v_now,(p_record->>'expiresAt')::timestamptz) returning id into v_place;
  insert into public.discovered_place_sources(place_id,provider,provider_record_id,attribution,licence_id,licence_url,osm_copyright_url,provider_url,terms_url,content_fingerprint,first_seen_at,last_seen_at,fetched_at) values(v_place,p_record->>'provider',p_record->>'providerId',p_record->>'sourceAttribution',p_record->>'licenceId',p_record->>'licenceUrl',p_record->>'osmCopyrightUrl',p_record->>'providerUrl',p_record->>'termsUrl',p_record->>'contentFingerprint',v_now,v_now,(p_record->>'fetchedAt')::timestamptz);
 else
  update public.discovered_places set name=p_record->>'name',location=extensions.st_setsrid(extensions.st_makepoint((p_record->>'longitude')::double precision,(p_record->>'latitude')::double precision),4326)::extensions.geography,address=p_record->>'address',city=p_record->>'city',region=p_record->>'region',postal_code=p_record->>'postalCode',country_code=upper(p_record->>'countryCode'),phone=p_record->>'phone',website=p_record->>'website',opening_hours=p_record->'openingHours',last_seen_at=v_now,refreshed_at=v_now,expires_at=(p_record->>'expiresAt')::timestamptz,active=true,updated_at=v_now where id=v_place;
  update public.discovered_place_sources set attribution=p_record->>'sourceAttribution',licence_id=p_record->>'licenceId',licence_url=p_record->>'licenceUrl',osm_copyright_url=p_record->>'osmCopyrightUrl',provider_url=p_record->>'providerUrl',terms_url=p_record->>'termsUrl',content_fingerprint=p_record->>'contentFingerprint',last_seen_at=v_now,fetched_at=(p_record->>'fetchedAt')::timestamptz where provider=p_record->>'provider' and provider_record_id=p_record->>'providerId';
 end if; return v_place;
end $$;
revoke all on function public.upsert_discovered_place(jsonb) from public,anon,authenticated;
grant execute on function public.upsert_discovered_place(jsonb) to service_role;
commit;
