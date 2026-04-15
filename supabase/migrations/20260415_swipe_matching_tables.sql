create table if not exists public.match_intents (
  id uuid primary key default gen_random_uuid(),
  from_post_id uuid not null references public.availabilities(id) on delete cascade,
  to_post_id uuid not null references public.availabilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (from_post_id <> to_post_id)
);

create unique index if not exists uq_match_intents_pair_direction
  on public.match_intents(from_post_id, to_post_id);
create index if not exists idx_match_intents_from_created
  on public.match_intents(from_post_id, created_at desc);
create index if not exists idx_match_intents_to_created
  on public.match_intents(to_post_id, created_at desc);

create table if not exists public.confirmed_matches (
  id uuid primary key default gen_random_uuid(),
  post_a_id uuid not null references public.availabilities(id) on delete cascade,
  post_b_id uuid not null references public.availabilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'played')),
  check (post_a_id <> post_b_id),
  check (post_a_id < post_b_id)
);

create unique index if not exists uq_confirmed_matches_pair
  on public.confirmed_matches(post_a_id, post_b_id);
create index if not exists idx_confirmed_matches_status_created
  on public.confirmed_matches(status, created_at desc);

alter table if exists public.match_intents enable row level security;
alter table if exists public.confirmed_matches enable row level security;

drop policy if exists "Public read match intents" on public.match_intents;
create policy "Public read match intents"
  on public.match_intents
  for select
  using (true);

drop policy if exists "Public read confirmed matches" on public.confirmed_matches;
create policy "Public read confirmed matches"
  on public.confirmed_matches
  for select
  using (true);
