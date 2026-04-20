alter table public.match_results
  add column if not exists winner_club_id uuid references public.teams(id) on delete set null,
  add column if not exists proof_photo_url text;

create index if not exists idx_match_results_winner_club
  on public.match_results(winner_club_id);
