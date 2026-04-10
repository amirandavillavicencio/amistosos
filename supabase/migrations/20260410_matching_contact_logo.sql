-- Matching simplificado sin nivel + contacto/publicación
alter table if exists public.availabilities add column if not exists contact_email text;
alter table if exists public.availabilities add column if not exists responsible_name text;
alter table if exists public.availabilities add column if not exists phone text;
alter table if exists public.availabilities add column if not exists instagram text;
alter table if exists public.availabilities add column if not exists logo_url text;

alter table if exists public.availabilities alter column level drop not null;

create unique index if not exists uq_suggested_matches_pair
  on public.suggested_matches (least(post_a_id, post_b_id), greatest(post_a_id, post_b_id));

insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do update set public = true;
