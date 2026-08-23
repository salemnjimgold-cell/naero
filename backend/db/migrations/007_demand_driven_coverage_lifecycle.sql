-- LDE-4 demand-driven coverage lifecycle. Inserts no place data.
begin;

alter table public.discovery_cells
  add column if not exists coverage_status text not null default 'PARTIAL',
  add column if not exists last_successful_status text,
  add column if not exists coverage_complete boolean not null default false,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists last_failure_code text,
  add column if not exists refresh_claimed_until timestamptz,
  add column if not exists refresh_claim_token uuid,
  add column if not exists next_eligible_refresh timestamptz,
  add column if not exists providers_attempted text[] not null default '{}',
  add column if not exists providers_succeeded text[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.discovery_cells add constraint discovery_cells_coverage_status_check
    check (coverage_status in ('SUFFICIENT','PARTIAL','EXHAUSTED','REFRESHING','REFRESH_FAILED'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.discovery_cells add constraint discovery_cells_last_successful_status_check
    check (last_successful_status is null or last_successful_status in ('SUFFICIENT','PARTIAL','EXHAUSTED'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.discovery_cells add constraint discovery_cells_failure_code_check
    check (last_failure_code is null or last_failure_code ~ '^[A-Z][A-Z0-9_]{1,63}$');
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.discovery_cells add constraint discovery_cells_provider_names_check
    check (providers_attempted <@ array['geoapify','google','osm']::text[]
      and providers_succeeded <@ array['geoapify','google','osm']::text[]
      and cardinality(providers_attempted)<=3 and cardinality(providers_succeeded)<=3);
exception when duplicate_object then null; end $$;

create index if not exists idx_discovery_cells_refresh_eligibility
  on public.discovery_cells(coverage_status,next_eligible_refresh,refresh_claimed_until,expires_at);

create or replace function public.manage_discovery_coverage(
  p_operation text,
  p_dimensions jsonb,
  p_outcome jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_cell text := nullif(btrim(p_dimensions->>'cellId'),'');
  v_category text := nullif(btrim(p_dimensions->>'category'),'');
  v_radius integer;
  v_country text := upper(coalesce(p_dimensions->>'countryCode',''));
  v_language text := lower(coalesce(p_dimensions->>'language',''));
  v_policy text := nullif(btrim(p_dimensions->>'sourcePolicyVersion'),'');
  v_schema text := nullif(btrim(p_dimensions->>'schemaVersion'),'');
  v_now timestamptz := now();
  v_status text;
  v_count integer;
  v_complete boolean;
  v_failures boolean;
  v_attempted text[];
  v_succeeded text[];
  v_failure text;
  v_claim_token uuid;
  v_row public.discovery_cells%rowtype;
  v_claimed boolean := false;
begin
  if auth.role()<>'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501';
  end if;
  begin v_radius := (p_dimensions->>'radiusBucket')::integer;
  exception when others then raise exception 'INVALID_COVERAGE_DIMENSIONS' using errcode='22023'; end;
  if p_operation not in ('read','claim','complete','fail')
    or v_cell is null or v_cell !~ '^[0-9]+:[0-9]+:[0-9]+$'
    or not exists(select 1 from public.service_categories where key=v_category and active)
    or v_radius not in (1000,2000,5000,10000,25000,50000)
    or v_country !~ '^[A-Z]{2}$' or v_language not in ('en','ar','fr','hu')
    or v_policy<>'lde-4' or v_schema<>'coverage-v2' then
    raise exception 'INVALID_COVERAGE_OPERATION' using errcode='22023';
  end if;

  if p_operation='read' then
    select * into v_row from public.discovery_cells where cell_id=v_cell and category_key=v_category
      and radius_bucket=v_radius and country_code=v_country and language=v_language;
    if not found or v_row.source_policy_version<>v_policy or v_row.schema_version<>v_schema then
      return jsonb_build_object('state','UNSEEN');
    end if;
    return jsonb_build_object(
      'state',case
        when v_row.coverage_status='REFRESHING' and v_row.refresh_claimed_until>v_now then 'REFRESHING'
        when v_row.coverage_status='REFRESH_FAILED' and coalesce(v_row.next_eligible_refresh,v_now)>v_now then 'REFRESH_FAILED'
        when v_row.coverage_status in ('REFRESHING','REFRESH_FAILED') and v_row.last_successful_status is null then 'UNSEEN'
        when v_row.expires_at<=v_now then 'STALE'
        when v_row.coverage_status in ('REFRESHING','REFRESH_FAILED') then v_row.last_successful_status
        else v_row.coverage_status end,
      'lastSuccessfulStatus',v_row.last_successful_status,
      'coverageComplete',v_row.coverage_complete,
      'resultCount',v_row.result_count,
      'expiresAt',v_row.expires_at,
      'nextEligibleRefresh',v_row.next_eligible_refresh,
      'providersAttempted',to_jsonb(v_row.providers_attempted),
      'providersSucceeded',to_jsonb(v_row.providers_succeeded));
  end if;

  if p_operation='claim' then
    insert into public.discovery_cells(cell_id,category_key,radius_bucket,country_code,language,
      last_successful_refresh,expires_at,result_count,source_policy_version,schema_version,
      coverage_status,last_successful_status,coverage_complete)
    values(v_cell,v_category,v_radius,v_country,v_language,'epoch','epoch',0,v_policy,v_schema,
      'PARTIAL',null,false)
    on conflict(cell_id,category_key,radius_bucket,country_code,language) do nothing;
    update public.discovery_cells set coverage_status='REFRESHING',refresh_claimed_until=v_now+interval '90 seconds',
      refresh_claim_token=gen_random_uuid(),
      last_attempt_at=v_now,last_failure_code=null,updated_at=v_now,
      source_policy_version=v_policy,schema_version=v_schema
    where cell_id=v_cell and category_key=v_category and radius_bucket=v_radius
      and country_code=v_country and language=v_language
      and (refresh_claimed_until is null or refresh_claimed_until<=v_now)
      and (next_eligible_refresh is null or next_eligible_refresh<=v_now)
      and not (coverage_status in ('SUFFICIENT','EXHAUSTED') and expires_at>v_now
        and source_policy_version=v_policy and schema_version=v_schema)
    returning * into v_row;
    v_claimed := found;
    return jsonb_build_object('claimed',v_claimed,'leaseSeconds',case when v_claimed then 90 else 0 end,
      'claimToken',case when v_claimed then v_row.refresh_claim_token else null end);
  end if;

  select array(select jsonb_array_elements_text(coalesce(p_outcome->'providersAttempted','[]'::jsonb))) into v_attempted;
  select array(select jsonb_array_elements_text(coalesce(p_outcome->'providersSucceeded','[]'::jsonb))) into v_succeeded;
  if not coalesce(v_attempted,'{}') <@ array['geoapify','google','osm']::text[]
    or not coalesce(v_succeeded,'{}') <@ array['geoapify','google','osm']::text[] then
    raise exception 'INVALID_COVERAGE_PROVIDERS' using errcode='22023';
  end if;

  if p_operation='complete' then
    begin v_claim_token := (p_outcome->>'claimToken')::uuid;
    exception when others then raise exception 'INVALID_CLAIM_TOKEN' using errcode='22023'; end;
    v_status := p_outcome->>'status';
    begin v_count := (p_outcome->>'resultCount')::integer;
    exception when others then raise exception 'INVALID_COVERAGE_OUTCOME' using errcode='22023'; end;
    v_complete := coalesce((p_outcome->>'coverageComplete')::boolean,false);
    v_failures := coalesce((p_outcome->>'providerFailures')::boolean,true);
    if v_status not in ('SUFFICIENT','PARTIAL','EXHAUSTED') or v_count not between 0 and 50
      or (v_status='EXHAUSTED' and (not v_complete or v_failures or coalesce(array_length(v_succeeded,1),0)=0))
      or (v_status='SUFFICIENT' and v_count=0) then
      raise exception 'INVALID_COVERAGE_OUTCOME' using errcode='22023';
    end if;
    update public.discovery_cells set coverage_status=v_status,last_successful_status=v_status,
      coverage_complete=v_complete,last_successful_refresh=v_now,expires_at=v_now+interval '7 days',
      result_count=v_count,last_failure_code=null,refresh_claimed_until=null,refresh_claim_token=null,next_eligible_refresh=null,
      providers_attempted=coalesce(v_attempted,'{}'),providers_succeeded=coalesce(v_succeeded,'{}'),updated_at=v_now
    where cell_id=v_cell and category_key=v_category and radius_bucket=v_radius
      and country_code=v_country and language=v_language and coverage_status='REFRESHING'
      and refresh_claimed_until is not null and refresh_claimed_until>v_now
      and refresh_claim_token=v_claim_token returning * into v_row;
    if not found then raise exception 'REFRESH_CLAIM_REQUIRED' using errcode='55000'; end if;
    return jsonb_build_object('state',v_status,'resultCount',v_count,'coverageComplete',v_complete);
  end if;

  v_failure := p_outcome->>'failureCode';
  begin v_claim_token := (p_outcome->>'claimToken')::uuid;
  exception when others then raise exception 'INVALID_CLAIM_TOKEN' using errcode='22023'; end;
  if v_failure is null or v_failure !~ '^[A-Z][A-Z0-9_]{1,63}$' then
    raise exception 'INVALID_FAILURE_CODE' using errcode='22023';
  end if;
  update public.discovery_cells set coverage_status='REFRESH_FAILED',last_failure_code=v_failure,
    refresh_claimed_until=null,refresh_claim_token=null,next_eligible_refresh=v_now+interval '60 seconds',
    providers_attempted=coalesce(v_attempted,'{}'),providers_succeeded=coalesce(v_succeeded,'{}'),updated_at=v_now
  where cell_id=v_cell and category_key=v_category and radius_bucket=v_radius
    and country_code=v_country and language=v_language and coverage_status='REFRESHING'
    and refresh_claimed_until is not null and refresh_claimed_until>v_now
    and refresh_claim_token=v_claim_token
  returning * into v_row;
  if not found then raise exception 'REFRESH_CLAIM_REQUIRED' using errcode='55000'; end if;
  return jsonb_build_object('state','REFRESH_FAILED','retryAfterSeconds',60,
    'lastSuccessfulStatus',v_row.last_successful_status);
end $$;

revoke all on function public.manage_discovery_coverage(text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.manage_discovery_coverage(text,jsonb,jsonb) to service_role;

commit;
