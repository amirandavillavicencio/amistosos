create table if not exists public.match_conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.confirmed_matches(id) on delete cascade,
  club_a_email text not null,
  club_b_email text not null,
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  unique(match_id),
  check (club_a_email <> club_b_email)
);

create index if not exists idx_match_conversations_match on public.match_conversations(match_id);
create index if not exists idx_match_conversations_status_created on public.match_conversations(status, created_at desc);

create table if not exists public.match_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.match_conversations(id) on delete cascade,
  sender_email text not null,
  message_text text not null,
  created_at timestamptz not null default now(),
  check (length(trim(message_text)) > 0)
);

create index if not exists idx_match_messages_conversation_created
  on public.match_messages(conversation_id, created_at asc);
