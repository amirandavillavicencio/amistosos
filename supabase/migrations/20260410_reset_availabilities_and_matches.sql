-- Limpieza total para reiniciar publicaciones y matching desde cero.
-- Ejecutar en una ventana controlada de mantenimiento.

begin;

-- 1) Limpiar matches sugeridos activos/históricos.
delete from public.suggested_matches;

-- 2) Limpiar publicaciones de disponibilidad (los matches restantes también caerían por cascade).
delete from public.availabilities;

commit;

-- Refuerzo opcional de integridad para impedir pares invertidos duplicados en suggested_matches.
create unique index if not exists uq_suggested_matches_pair
  on public.suggested_matches (least(post_a_id, post_b_id), greatest(post_a_id, post_b_id));
