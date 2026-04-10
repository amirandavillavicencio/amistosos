-- Safe migration: contact email fields for availability edits + dedupe support for suggested matches

alter table if exists availabilities
  add column if not exists contact_email text;

alter table if exists availabilities
  add column if not exists responsible_name text;

-- Canonical pair uniqueness for suggested matches to avoid duplicate A/B and B/A rows.
create unique index if not exists uq_suggested_matches_pair
  on suggested_matches (least(post_a_id, post_b_id), greatest(post_a_id, post_b_id));
