create extension if not exists "pgcrypto";

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  club_name_key text not null,
  responsible_name text not null default 'Pendiente',
  contact_email text not null,
  email_key text not null,
  instagram text not null,
  instagram_key text not null,
  comuna text not null,
  city text not null,
  branch text not null check (branch in ('femenina', 'masculina', 'mixta')),
  age_category text not null default 'tc' check (age_category in ('sub-12', 'sub-14', 'sub-16', 'sub-18', 'sub-20', 'tc')),
  declared_level text not null check (declared_level in ('principiante', 'novato', 'intermedio', 'avanzado', 'competitivo')),
  current_elo integer not null default 1000,
  matches_played integer not null default 0 check (matches_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_teams_identity
  on teams (club_name_key, email_key, instagram_key);

create index if not exists idx_teams_elo on teams(current_elo desc, matches_played desc);

create table if not exists availabilities (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  address text,
  comuna text not null,
  city text not null,
  play_date date,
  weekday text,
  weekdays text[] not null default '{}',
  start_time time not null,
  end_time time not null,
  branch text not null check (branch in ('femenina', 'masculina', 'mixta')),
  age_category text not null default 'tc' check (age_category in ('sub-12', 'sub-14', 'sub-16', 'sub-18', 'sub-20', 'tc')),
  desired_level text not null check (desired_level in ('principiante', 'novato', 'intermedio', 'avanzado', 'competitivo')),
  has_court boolean not null default false,
  notes text,
  status text not null default 'open' check (status in ('open', 'closed')),
  legacy_post_id uuid,
  created_at timestamptz not null default now(),
  check (play_date is not null or weekday is not null or cardinality(weekdays) > 0),
  check (start_time < end_time)
);

create unique index if not exists uq_availabilities_legacy_post_id on availabilities(legacy_post_id) where legacy_post_id is not null;
create index if not exists idx_availabilities_status_created_at on availabilities(status, created_at desc);
create index if not exists idx_availabilities_team_id on availabilities(team_id, created_at desc);

create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references teams(id) on delete cascade,
  opponent_club_id uuid references teams(id) on delete set null,
  winner_club_id uuid references teams(id) on delete set null,
  opponent_name text,
  match_date date not null,
  branch text not null check (branch in ('femenina', 'masculina', 'mixta')),
  match_type text not null check (match_type in ('amistoso', 'torneo', 'entrenamiento', 'competitivo')),
  sets_won integer not null check (sets_won >= 0),
  sets_lost integer not null check (sets_lost >= 0),
  set_scores text,
  location text,
  notes text,
  proof_photo_url text,
  elo_before integer not null,
  elo_after integer not null,
  elo_delta integer not null,
  created_at timestamptz not null default now(),
  check (opponent_club_id is not null or opponent_name is not null)
);

create index if not exists idx_match_results_club_date on match_results(club_id, match_date desc);
create index if not exists idx_match_results_opponent on match_results(opponent_club_id);
create index if not exists idx_match_results_winner_club on match_results(winner_club_id);

create table if not exists elo_history (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references teams(id) on delete cascade,
  source_match_result_id uuid references match_results(id) on delete set null,
  elo_before integer not null,
  elo_after integer not null,
  delta integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_elo_history_club_created on elo_history(club_id, created_at desc);

create table if not exists suggested_matches (
  id uuid primary key default gen_random_uuid(),
  post_a_id uuid not null references availabilities(id) on delete cascade,
  post_b_id uuid not null references availabilities(id) on delete cascade,
  compatibility_score integer not null check (compatibility_score >= 0 and compatibility_score <= 100),
  schedule_score integer not null default 0 check (schedule_score >= 0 and schedule_score <= 30),
  location_score integer not null default 0 check (location_score >= 0 and location_score <= 20),
  level_score integer not null default 0 check (level_score >= 0 and level_score <= 35),
  elo_score integer not null default 0 check (elo_score >= 0 and elo_score <= 15),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  check (post_a_id <> post_b_id)
);

create index if not exists idx_matches_score on suggested_matches(status, compatibility_score desc);

create table if not exists match_intents (
  id uuid primary key default gen_random_uuid(),
  from_post_id uuid not null references availabilities(id) on delete cascade,
  to_post_id uuid not null references availabilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (from_post_id <> to_post_id)
);

create unique index if not exists uq_match_intents_pair_direction
  on match_intents(from_post_id, to_post_id);
create index if not exists idx_match_intents_from_created
  on match_intents(from_post_id, created_at desc);
create index if not exists idx_match_intents_to_created
  on match_intents(to_post_id, created_at desc);

create table if not exists confirmed_matches (
  id uuid primary key default gen_random_uuid(),
  post_a_id uuid not null references availabilities(id) on delete cascade,
  post_b_id uuid not null references availabilities(id) on delete cascade,
  club_a_email text,
  club_b_email text,
  created_at timestamptz not null default now(),
  status text not null default 'suggested' check (status in ('suggested', 'pending', 'accepted', 'confirmed', 'played')),
  check (post_a_id <> post_b_id),
  check (post_a_id < post_b_id)
);

create unique index if not exists uq_confirmed_matches_pair
  on confirmed_matches(post_a_id, post_b_id);
create index if not exists idx_confirmed_matches_status_created
  on confirmed_matches(status, created_at desc);

-- Backfill migration for legacy MVP (table posts)
do $$
begin
  if to_regclass('public.posts') is not null then
    insert into teams (
      club_name, club_name_key, responsible_name, contact_email, email_key, instagram, instagram_key,
      comuna, city, branch, age_category, declared_level, current_elo
    )
    select distinct
      p.club_name,
      lower(trim(p.club_name)),
      'Pendiente',
      p.contact_email,
      lower(trim(p.contact_email)),
      p.instagram,
      lower(replace(trim(p.instagram), '@', '')),
      p.comuna,
      p.city,
      p.branch,
      'tc',
      case
        when p.level in ('principiante', 'intermedio', 'avanzado') then p.level
        else 'intermedio'
      end,
      1000
    from posts p
    on conflict (club_name_key, email_key, instagram_key) do nothing;

    insert into availabilities (
      team_id, address, comuna, city, play_date, weekday,
      start_time, end_time, branch, age_category, desired_level, has_court,
      notes, status, created_at, legacy_post_id
    )
    select
      t.id,
      p.address,
      p.comuna,
      p.city,
      p.play_date,
      p.weekday,
      p.start_time,
      p.end_time,
      p.branch,
      'tc',
      case
        when p.level in ('principiante', 'intermedio', 'avanzado') then p.level
        else 'intermedio'
      end,
      p.has_court,
      p.notes,
      p.status,
      p.created_at,
      p.id
    from posts p
    join teams t
      on t.club_name_key = lower(trim(p.club_name))
      and t.email_key = lower(trim(p.contact_email))
      and t.instagram_key = lower(replace(trim(p.instagram), '@', ''))
    on conflict (legacy_post_id) do nothing;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('match-photos', 'match-photos', true)
on conflict (id) do update set public = true;

create table if not exists match_photos (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  club_name_key text not null,
  opponent_name text not null,
  match_date date not null,
  comuna text not null,
  result text,
  comment text,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_match_photos_match_date on match_photos(match_date desc);
create index if not exists idx_match_photos_club_key on match_photos(club_name_key);

create table if not exists club_stats (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  club_name_key text not null unique,
  matches_played integer not null default 0 check (matches_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  last_match_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_club_stats_ranking on club_stats(wins desc, matches_played desc);


-- Safe migrations for existing production DBs
alter table if exists teams add column if not exists responsible_name text;
alter table if exists teams alter column responsible_name set default 'Pendiente';
update teams set responsible_name = 'Pendiente' where responsible_name is null or trim(responsible_name) = '';
alter table if exists teams alter column responsible_name set not null;
alter table if exists teams add column if not exists age_category text;
update teams set age_category = 'tc' where age_category is null;
alter table if exists teams alter column age_category set default 'tc';
alter table if exists teams alter column age_category set not null;
alter table if exists teams drop constraint if exists teams_age_category_check;
alter table if exists teams add constraint teams_age_category_check check (age_category in ('sub-12', 'sub-14', 'sub-16', 'sub-18', 'sub-20', 'tc'));
alter table if exists teams drop constraint if exists teams_declared_level_check;
alter table if exists teams add constraint teams_declared_level_check check (declared_level in ('principiante', 'novato', 'intermedio', 'avanzado', 'competitivo'));

alter table if exists confirmed_matches add column if not exists club_a_email text;
alter table if exists confirmed_matches add column if not exists club_b_email text;
alter table if exists confirmed_matches alter column status set default 'suggested';
alter table if exists confirmed_matches drop constraint if exists confirmed_matches_status_check;
alter table if exists confirmed_matches add constraint confirmed_matches_status_check check (status in ('suggested', 'pending', 'accepted', 'confirmed', 'played'));

alter table if exists availabilities alter column address drop not null;
alter table if exists availabilities add column if not exists weekdays text[];
update availabilities set weekdays = case when weekday is not null then array[weekday]::text[] else '{}'::text[] end where weekdays is null;
alter table if exists availabilities alter column weekdays set default '{}';
alter table if exists availabilities alter column weekdays set not null;
alter table if exists availabilities add column if not exists age_category text;
update availabilities set age_category = 'tc' where age_category is null;
alter table if exists availabilities alter column age_category set default 'tc';
alter table if exists availabilities alter column age_category set not null;
alter table if exists availabilities drop constraint if exists availabilities_age_category_check;
alter table if exists availabilities add constraint availabilities_age_category_check check (age_category in ('sub-12', 'sub-14', 'sub-16', 'sub-18', 'sub-20', 'tc'));
alter table if exists availabilities drop constraint if exists availabilities_desired_level_check;
alter table if exists availabilities add constraint availabilities_desired_level_check check (desired_level in ('principiante', 'novato', 'intermedio', 'avanzado', 'competitivo'));
alter table if exists availabilities drop constraint if exists availabilities_check;
alter table if exists availabilities add constraint availabilities_check check (play_date is not null or weekday is not null or cardinality(weekdays) > 0);
alter table if exists availabilities add column if not exists contact_email text;
alter table if exists availabilities add column if not exists responsible_name text;

create unique index if not exists uq_suggested_matches_pair
  on suggested_matches (least(post_a_id, post_b_id), greatest(post_a_id, post_b_id));

alter table if exists availabilities add column if not exists phone text;
alter table if exists availabilities add column if not exists instagram text;
alter table if exists availabilities add column if not exists logo_url text;
alter table if exists availabilities alter column level drop not null;

insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do update set public = true;
