create extension if not exists "pgcrypto";

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  contact_email text not null,
  instagram text not null,
  address text not null,
  comuna text not null,
  city text not null,
  play_date date,
  weekday text,
  start_time time not null,
  end_time time not null,
  branch text not null check (branch in ('femenina', 'masculina', 'mixta')),
  level text not null check (level in ('principiante', 'intermedio', 'avanzado')),
  has_court boolean not null default false,
  notes text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  check (play_date is not null or weekday is not null),
  check (start_time < end_time)
);

create table if not exists suggested_matches (
  id uuid primary key default gen_random_uuid(),
  post_a_id uuid not null references posts(id) on delete cascade,
  post_b_id uuid not null references posts(id) on delete cascade,
  compatibility_score integer not null check (compatibility_score >= 0 and compatibility_score <= 100),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  check (post_a_id <> post_b_id)
);

create index if not exists idx_posts_status_created_at on posts(status, created_at desc);
create index if not exists idx_matches_score on suggested_matches(status, compatibility_score desc);
