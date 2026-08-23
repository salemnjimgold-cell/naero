-- LDE-5 privacy-safe daily operational aggregates. Inserts no place or user data.
begin;

create or replace function public.is_valid_operational_region(p_region text)
returns boolean language plpgsql immutable strict set search_path=public,extensions
as $$
declare
  v_lat_index integer;
  v_lon_count integer;
  v_lon_index integer;
  v_center_latitude double precision;
  v_expected_lon_count integer;
begin
  if p_region !~ '^op5-v1:[0-9]{1,5}:[0-9]{1,5}:[0-9]{1,5}$' then return false; end if;
  v_lat_index := split_part(p_region,':',2)::integer;
  v_lon_count := split_part(p_region,':',3)::integer;
  v_lon_index := split_part(p_region,':',4)::integer;
  if v_lat_index not between 0 and 4007 then return false; end if;
  v_center_latitude := -90 + (v_lat_index*5000.0+2500.0)/111320.0;
  v_expected_lon_count := greatest(1,ceil(360.0*111320.0
    * greatest(0.0,cos(radians(v_center_latitude)))/5000.0)::integer);
  return v_lon_count=v_expected_lon_count and v_lon_index>=0 and v_lon_index<v_lon_count;
exception when others then return false;
end $$;
revoke all on function public.is_valid_operational_region(text) from public,anon,authenticated;

create table if not exists public.discovery_operational_metrics_daily (
  metric_date date not null,
  operational_region text not null check (public.is_valid_operational_region(operational_region)),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  category text not null references public.service_categories(key),
  radius_bucket integer not null check (radius_bucket in (1000,2000,5000,10000,25000,50000)),
  nearby_requests bigint not null default 0,
  l1_fresh_hits bigint not null default 0,
  l1_stale_rescues bigint not null default 0,
  l2_sufficient_responses bigint not null default 0,
  refresh_claims_acquired bigint not null default 0,
  refresh_claims_contended bigint not null default 0,
  refresh_completions bigint not null default 0,
  refresh_failures bigint not null default 0,
  refresh_await_existing_suppressions bigint not null default 0,
  refresh_backoff_suppressions bigint not null default 0,
  coverage_live_suppressions bigint not null default 0,
  partial_responses bigint not null default 0,
  stale_responses bigint not null default 0,
  exhausted_responses bigint not null default 0,
  latency_lt10_ms bigint not null default 0,
  latency_lt50_ms bigint not null default 0,
  latency_lt250_ms bigint not null default 0,
  latency_lt1000_ms bigint not null default 0,
  latency_gte1000_ms bigint not null default 0,
  geoapify_attempts bigint not null default 0,
  geoapify_successes bigint not null default 0,
  geoapify_empty_results bigint not null default 0,
  geoapify_failures bigint not null default 0,
  geoapify_yield bigint not null default 0,
  google_attempts bigint not null default 0,
  google_successes bigint not null default 0,
  google_empty_results bigint not null default 0,
  google_failures bigint not null default 0,
  google_yield bigint not null default 0,
  osm_attempts bigint not null default 0,
  osm_successes bigint not null default 0,
  osm_empty_results bigint not null default 0,
  osm_failures bigint not null default 0,
  osm_yield bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key(metric_date,operational_region,country_code,category,radius_bucket),
  constraint discovery_operational_metrics_nonnegative check (
    nearby_requests>=0 and l1_fresh_hits>=0 and l1_stale_rescues>=0 and l2_sufficient_responses>=0
    and refresh_claims_acquired>=0 and refresh_claims_contended>=0 and refresh_completions>=0 and refresh_failures>=0
    and refresh_await_existing_suppressions>=0 and refresh_backoff_suppressions>=0 and coverage_live_suppressions>=0
    and partial_responses>=0 and stale_responses>=0 and exhausted_responses>=0
    and latency_lt10_ms>=0 and latency_lt50_ms>=0 and latency_lt250_ms>=0 and latency_lt1000_ms>=0 and latency_gte1000_ms>=0
    and geoapify_attempts>=0 and geoapify_successes>=0 and geoapify_empty_results>=0 and geoapify_failures>=0 and geoapify_yield>=0
    and google_attempts>=0 and google_successes>=0 and google_empty_results>=0 and google_failures>=0 and google_yield>=0
    and osm_attempts>=0 and osm_successes>=0 and osm_empty_results>=0 and osm_failures>=0 and osm_yield>=0)
);

create index if not exists idx_discovery_operational_metrics_date
  on public.discovery_operational_metrics_daily(metric_date);
create index if not exists idx_discovery_operational_metrics_region_category
  on public.discovery_operational_metrics_daily(operational_region,category,metric_date desc);

alter table public.discovery_operational_metrics_daily enable row level security;
alter table public.discovery_operational_metrics_daily force row level security;
revoke all on table public.discovery_operational_metrics_daily from public,anon,authenticated;

create or replace function public.increment_discovery_operational_metrics(
  p_metric_date date, p_operational_region text, p_country_code text, p_category text, p_radius_bucket integer,
  p_nearby_requests integer default 0, p_l1_fresh_hits integer default 0, p_l1_stale_rescues integer default 0,
  p_l2_sufficient_responses integer default 0, p_refresh_claims_acquired integer default 0,
  p_refresh_claims_contended integer default 0, p_refresh_completions integer default 0,
  p_refresh_failures integer default 0, p_refresh_await_existing_suppressions integer default 0,
  p_refresh_backoff_suppressions integer default 0, p_coverage_live_suppressions integer default 0,
  p_partial_responses integer default 0, p_stale_responses integer default 0,
  p_exhausted_responses integer default 0, p_latency_lt10_ms integer default 0, p_latency_lt50_ms integer default 0,
  p_latency_lt250_ms integer default 0, p_latency_lt1000_ms integer default 0, p_latency_gte1000_ms integer default 0,
  p_geoapify_attempts integer default 0, p_geoapify_successes integer default 0, p_geoapify_empty_results integer default 0,
  p_geoapify_failures integer default 0, p_geoapify_yield integer default 0, p_google_attempts integer default 0,
  p_google_successes integer default 0, p_google_empty_results integer default 0, p_google_failures integer default 0,
  p_google_yield integer default 0, p_osm_attempts integer default 0, p_osm_successes integer default 0,
  p_osm_empty_results integer default 0, p_osm_failures integer default 0, p_osm_yield integer default 0
) returns void
language plpgsql security definer set search_path=public,extensions
as $$
declare
  v_max constant bigint := 9000000000000000;
  v_values integer[] := array[p_nearby_requests,p_l1_fresh_hits,p_l1_stale_rescues,p_l2_sufficient_responses,
    p_refresh_claims_acquired,p_refresh_claims_contended,p_refresh_completions,p_refresh_failures,
    p_refresh_await_existing_suppressions,p_refresh_backoff_suppressions,p_coverage_live_suppressions,
    p_partial_responses,p_stale_responses,p_exhausted_responses,p_latency_lt10_ms,p_latency_lt50_ms,
    p_latency_lt250_ms,p_latency_lt1000_ms,p_latency_gte1000_ms,p_geoapify_attempts,p_geoapify_successes,
    p_geoapify_empty_results,p_geoapify_failures,p_geoapify_yield,p_google_attempts,p_google_successes,p_google_empty_results,
    p_google_failures,p_google_yield,p_osm_attempts,p_osm_successes,p_osm_empty_results,p_osm_failures,p_osm_yield];
begin
  if auth.role()<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if p_metric_date is null or p_metric_date < current_date-interval '31 days' or p_metric_date > current_date+interval '1 day'
    or not public.is_valid_operational_region(p_operational_region)
    or p_country_code !~ '^[A-Z]{2}$'
    or not exists(select 1 from public.service_categories where key=p_category and active)
    or p_radius_bucket not in (1000,2000,5000,10000,25000,50000)
    or exists(select 1 from unnest(v_values) value where value is null or value<0 or value>1000000) then
    raise exception 'INVALID_OPERATIONAL_METRIC' using errcode='22023';
  end if;
  insert into public.discovery_operational_metrics_daily values (
    p_metric_date,p_operational_region,p_country_code,p_category,p_radius_bucket,
    p_nearby_requests,p_l1_fresh_hits,p_l1_stale_rescues,p_l2_sufficient_responses,
    p_refresh_claims_acquired,p_refresh_claims_contended,p_refresh_completions,p_refresh_failures,
    p_refresh_await_existing_suppressions,p_refresh_backoff_suppressions,p_coverage_live_suppressions,
    p_partial_responses,p_stale_responses,p_exhausted_responses,p_latency_lt10_ms,p_latency_lt50_ms,
    p_latency_lt250_ms,p_latency_lt1000_ms,p_latency_gte1000_ms,p_geoapify_attempts,p_geoapify_successes,
    p_geoapify_empty_results,p_geoapify_failures,p_geoapify_yield,p_google_attempts,p_google_successes,p_google_empty_results,
    p_google_failures,p_google_yield,p_osm_attempts,p_osm_successes,p_osm_empty_results,p_osm_failures,p_osm_yield,now())
  on conflict(metric_date,operational_region,country_code,category,radius_bucket) do update set
    nearby_requests=least(v_max,discovery_operational_metrics_daily.nearby_requests+excluded.nearby_requests),
    l1_fresh_hits=least(v_max,discovery_operational_metrics_daily.l1_fresh_hits+excluded.l1_fresh_hits),
    l1_stale_rescues=least(v_max,discovery_operational_metrics_daily.l1_stale_rescues+excluded.l1_stale_rescues),
    l2_sufficient_responses=least(v_max,discovery_operational_metrics_daily.l2_sufficient_responses+excluded.l2_sufficient_responses),
    refresh_claims_acquired=least(v_max,discovery_operational_metrics_daily.refresh_claims_acquired+excluded.refresh_claims_acquired),
    refresh_claims_contended=least(v_max,discovery_operational_metrics_daily.refresh_claims_contended+excluded.refresh_claims_contended),
    refresh_completions=least(v_max,discovery_operational_metrics_daily.refresh_completions+excluded.refresh_completions),
    refresh_failures=least(v_max,discovery_operational_metrics_daily.refresh_failures+excluded.refresh_failures),
    refresh_await_existing_suppressions=least(v_max,discovery_operational_metrics_daily.refresh_await_existing_suppressions+excluded.refresh_await_existing_suppressions),
    refresh_backoff_suppressions=least(v_max,discovery_operational_metrics_daily.refresh_backoff_suppressions+excluded.refresh_backoff_suppressions),
    coverage_live_suppressions=least(v_max,discovery_operational_metrics_daily.coverage_live_suppressions+excluded.coverage_live_suppressions),
    partial_responses=least(v_max,discovery_operational_metrics_daily.partial_responses+excluded.partial_responses),
    stale_responses=least(v_max,discovery_operational_metrics_daily.stale_responses+excluded.stale_responses),
    exhausted_responses=least(v_max,discovery_operational_metrics_daily.exhausted_responses+excluded.exhausted_responses),
    latency_lt10_ms=least(v_max,discovery_operational_metrics_daily.latency_lt10_ms+excluded.latency_lt10_ms),
    latency_lt50_ms=least(v_max,discovery_operational_metrics_daily.latency_lt50_ms+excluded.latency_lt50_ms),
    latency_lt250_ms=least(v_max,discovery_operational_metrics_daily.latency_lt250_ms+excluded.latency_lt250_ms),
    latency_lt1000_ms=least(v_max,discovery_operational_metrics_daily.latency_lt1000_ms+excluded.latency_lt1000_ms),
    latency_gte1000_ms=least(v_max,discovery_operational_metrics_daily.latency_gte1000_ms+excluded.latency_gte1000_ms),
    geoapify_attempts=least(v_max,discovery_operational_metrics_daily.geoapify_attempts+excluded.geoapify_attempts),
    geoapify_successes=least(v_max,discovery_operational_metrics_daily.geoapify_successes+excluded.geoapify_successes),
    geoapify_empty_results=least(v_max,discovery_operational_metrics_daily.geoapify_empty_results+excluded.geoapify_empty_results),
    geoapify_failures=least(v_max,discovery_operational_metrics_daily.geoapify_failures+excluded.geoapify_failures),
    geoapify_yield=least(v_max,discovery_operational_metrics_daily.geoapify_yield+excluded.geoapify_yield),
    google_attempts=least(v_max,discovery_operational_metrics_daily.google_attempts+excluded.google_attempts),
    google_successes=least(v_max,discovery_operational_metrics_daily.google_successes+excluded.google_successes),
    google_empty_results=least(v_max,discovery_operational_metrics_daily.google_empty_results+excluded.google_empty_results),
    google_failures=least(v_max,discovery_operational_metrics_daily.google_failures+excluded.google_failures),
    google_yield=least(v_max,discovery_operational_metrics_daily.google_yield+excluded.google_yield),
    osm_attempts=least(v_max,discovery_operational_metrics_daily.osm_attempts+excluded.osm_attempts),
    osm_successes=least(v_max,discovery_operational_metrics_daily.osm_successes+excluded.osm_successes),
    osm_empty_results=least(v_max,discovery_operational_metrics_daily.osm_empty_results+excluded.osm_empty_results),
    osm_failures=least(v_max,discovery_operational_metrics_daily.osm_failures+excluded.osm_failures),
    osm_yield=least(v_max,discovery_operational_metrics_daily.osm_yield+excluded.osm_yield),updated_at=now();
end $$;

create or replace function public.prune_discovery_operational_metrics(p_before_date date, p_limit integer default 1000)
returns integer language plpgsql security definer set search_path=public,extensions
as $$
declare v_deleted integer;
begin
  if auth.role()<>'service_role' then raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  if p_before_date is null or p_before_date>current_date-interval '30 days' or p_limit not between 1 and 1000 then
    raise exception 'INVALID_RETENTION_REQUEST' using errcode='22023';
  end if;
  with doomed as (select ctid from public.discovery_operational_metrics_daily
    where metric_date<p_before_date order by metric_date limit p_limit)
  delete from public.discovery_operational_metrics_daily target using doomed where target.ctid=doomed.ctid;
  get diagnostics v_deleted=row_count;
  return v_deleted;
end $$;

revoke all on function public.increment_discovery_operational_metrics(date,text,text,text,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.increment_discovery_operational_metrics(date,text,text,text,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer) to service_role;
revoke all on function public.prune_discovery_operational_metrics(date,integer) from public,anon,authenticated;
grant execute on function public.prune_discovery_operational_metrics(date,integer) to service_role;

commit;
