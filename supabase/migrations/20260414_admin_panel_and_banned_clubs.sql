begin;

create table if not exists public.banned_clubs (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  club_name_key text not null unique,
  reason text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_banned_clubs_active
  on public.banned_clubs (is_active, club_name_key);

alter table public.banned_clubs enable row level security;

create table if not exists public.admin_manual_matches (
  id uuid primary key default gen_random_uuid(),
  post_a_id uuid references public.availabilities(id) on delete set null,
  post_b_id uuid references public.availabilities(id) on delete set null,
  post_a_club_name text not null,
  post_b_club_name text not null,
  branch text,
  age_category text,
  status text not null default 'active' check (status in ('active', 'archived', 'cancelled')),
  notes text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((post_a_id is null or post_b_id is null) or post_a_id <> post_b_id)
);

create index if not exists idx_admin_manual_matches_status_created
  on public.admin_manual_matches (status, created_at desc);

create unique index if not exists uq_admin_manual_matches_active_pair
  on public.admin_manual_matches (least(post_a_id, post_b_id), greatest(post_a_id, post_b_id))
  where status = 'active' and post_a_id is not null and post_b_id is not null;

alter table public.admin_manual_matches enable row level security;

commit;
