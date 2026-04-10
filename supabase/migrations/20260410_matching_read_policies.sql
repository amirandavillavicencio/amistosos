-- Public read policies needed by home matching cards.
-- Only expose open availabilities and active suggested matches.

alter table if exists public.availabilities enable row level security;
alter table if exists public.suggested_matches enable row level security;

drop policy if exists "public can read open availabilities" on public.availabilities;
create policy "public can read open availabilities"
  on public.availabilities
  for select
  to anon, authenticated
  using (status = 'open');

drop policy if exists "public can read active suggested matches" on public.suggested_matches;
create policy "public can read active suggested matches"
  on public.suggested_matches
  for select
  to anon, authenticated
  using (status = 'active');
