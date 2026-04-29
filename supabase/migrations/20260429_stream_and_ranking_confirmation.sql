alter table if exists suggested_matches
  add column if not exists stream_url text null,
  add column if not exists stream_submitted_by_post_id uuid null,
  add column if not exists stream_submitted_at timestamptz null;

alter table if exists match_results
  add column if not exists team_a_code_hash text null,
  add column if not exists team_b_code_hash text null,
  add column if not exists team_a_result_confirmed_at timestamptz null,
  add column if not exists team_b_result_confirmed_at timestamptz null,
  add column if not exists ranking_validated_at timestamptz null,
  add column if not exists ranking_status text not null default 'pendiente';
