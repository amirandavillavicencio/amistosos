alter table if exists public.confirmed_matches
  add column if not exists club_a_email text,
  add column if not exists club_b_email text;

alter table if exists public.confirmed_matches
  alter column status set default 'suggested';

alter table if exists public.confirmed_matches
  drop constraint if exists confirmed_matches_status_check;

alter table if exists public.confirmed_matches
  add constraint confirmed_matches_status_check
  check (status in ('suggested', 'pending', 'accepted', 'confirmed', 'played'));
