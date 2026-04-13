begin;

-- 1) Limpieza completa de suggested_matches (tabla derivada).
delete from public.suggested_matches;

-- 2) Borrar huérfanas.
delete from public.suggested_matches sm
where not exists (select 1 from public.availabilities a where a.id = sm.post_a_id)
   or not exists (select 1 from public.availabilities b where b.id = sm.post_b_id);

-- 3) Borrar self-match.
delete from public.suggested_matches
where post_a_id = post_b_id;

-- 4) Borrar matches de mismo club.
delete from public.suggested_matches sm
using public.availabilities a, public.availabilities b
where a.id = sm.post_a_id
  and b.id = sm.post_b_id
  and lower(trim(a.club_name)) = lower(trim(b.club_name));

-- 5) Borrar duplicados invertidos (deja el más antiguo por id).
with canonical as (
  select
    id,
    least(post_a_id, post_b_id) as canon_a,
    greatest(post_a_id, post_b_id) as canon_b,
    row_number() over (
      partition by least(post_a_id, post_b_id), greatest(post_a_id, post_b_id)
      order by created_at asc, id asc
    ) as rn
  from public.suggested_matches
  where status = 'active'
)
delete from public.suggested_matches sm
using canonical c
where sm.id = c.id
  and c.rn > 1;

-- 6) Índice único canónico para pares activos.
create unique index if not exists uq_suggested_matches_active_pair_canonical
  on public.suggested_matches (least(post_a_id, post_b_id), greatest(post_a_id, post_b_id))
  where status = 'active';

-- 7) RLS + políticas de lectura pública.
alter table public.availabilities enable row level security;
alter table public.suggested_matches enable row level security;

drop policy if exists "Public read open availabilities" on public.availabilities;
create policy "Public read open availabilities"
  on public.availabilities
  for select
  using (status = 'open');

drop policy if exists "Public read active suggested matches" on public.suggested_matches;
create policy "Public read active suggested matches"
  on public.suggested_matches
  for select
  using (status = 'active');

commit;
