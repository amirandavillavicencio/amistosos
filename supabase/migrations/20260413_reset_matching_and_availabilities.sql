-- Reset operativo para partir matching desde cero.
-- Incluye respaldo temporal en la misma transacción para rollback manual si se requiere.

begin;

create temporary table tmp_backup_suggested_matches on commit drop as
select * from public.suggested_matches;

create temporary table tmp_backup_availabilities on commit drop as
select * from public.availabilities;

-- Primero suggested_matches por posibles FK desde availabilities.
delete from public.suggested_matches;

-- Luego publicaciones activas/históricas de disponibilidad.
delete from public.availabilities;

-- Refuerzo para evitar duplicados invertidos A/B vs B/A.
create unique index if not exists uq_suggested_matches_pair
  on public.suggested_matches (least(post_a_id, post_b_id), greatest(post_a_id, post_b_id));

commit;
