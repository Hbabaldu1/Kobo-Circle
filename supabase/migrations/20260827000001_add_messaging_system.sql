create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  participant_one uuid not null references public.users(id) on delete cascade,
  participant_two uuid not null references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (participant_one <> participant_two)
);

create unique index if not exists conversations_participants_key
  on public.conversations (participant_one, participant_two);
create index if not exists idx_conversations_participant_one on public.conversations (participant_one, updated_at desc);
create index if not exists idx_conversations_participant_two on public.conversations (participant_two, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation_created_at on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "read own conversations" on public.conversations;
create policy "read own conversations" on public.conversations for select to authenticated
  using (auth.uid() = participant_one or auth.uid() = participant_two);

drop policy if exists "insert own conversations" on public.conversations;
create policy "insert own conversations" on public.conversations for insert to authenticated
  with check (auth.uid() = participant_one or auth.uid() = participant_two);

drop policy if exists "read messages in own conversations" on public.messages;
create policy "read messages in own conversations" on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
  ));

drop policy if exists "insert messages in own conversations" on public.messages;
create policy "insert messages in own conversations" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
