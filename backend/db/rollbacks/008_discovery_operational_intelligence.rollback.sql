begin;
drop function if exists public.prune_discovery_operational_metrics(date,integer);
drop function if exists public.increment_discovery_operational_metrics(date,text,text,text,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer,integer);
drop table if exists public.discovery_operational_metrics_daily;
commit;
