-- OPCIONAL: reset total de datos operativos de matchmaking.
begin;

delete from public.suggested_matches;
delete from public.availabilities;

commit;
