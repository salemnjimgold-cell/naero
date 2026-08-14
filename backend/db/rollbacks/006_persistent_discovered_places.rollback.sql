begin;
drop function if exists public.upsert_discovered_place(jsonb);
drop function if exists public.nearby_discovered_places(double precision,double precision,integer,text,text,integer,boolean);
drop table if exists public.discovery_cells;
drop table if exists public.discovered_place_sources;
drop table if exists public.discovered_places;
commit;
