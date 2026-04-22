begin;

alter table if exists public.availabilities
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists idx_availabilities_owner_id on public.availabilities(owner_id);

commit;
