-- Explicit rollback for migration 005.
-- PostGIS is intentionally retained because other database objects may depend on it.

begin;

drop function if exists public.nearby_verified_services(
  double precision, double precision, integer, text, text, integer, text
);
drop table if exists public.service_provider_links;
drop table if exists public.service_verification_log;
drop table if exists public.verified_services;
drop table if exists public.service_categories;

-- Do not run `drop extension postgis`; inspect all dependent objects first.

commit;
