begin;
drop function if exists public.manage_discovery_coverage(text,jsonb,jsonb);
drop index if exists public.idx_discovery_cells_refresh_eligibility;
alter table public.discovery_cells
  drop constraint if exists discovery_cells_provider_names_check,
  drop constraint if exists discovery_cells_failure_code_check,
  drop constraint if exists discovery_cells_last_successful_status_check,
  drop constraint if exists discovery_cells_coverage_status_check,
  drop column if exists updated_at,
  drop column if exists providers_succeeded,
  drop column if exists providers_attempted,
  drop column if exists next_eligible_refresh,
  drop column if exists refresh_claimed_until,
  drop column if exists refresh_claim_token,
  drop column if exists last_failure_code,
  drop column if exists last_attempt_at,
  drop column if exists coverage_complete,
  drop column if exists last_successful_status,
  drop column if exists coverage_status;
commit;
