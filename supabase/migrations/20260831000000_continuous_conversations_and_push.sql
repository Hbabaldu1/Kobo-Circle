-- One thread is shared by each participant pair; listing_id remains first-context metadata.
drop index if exists public.conversations_participants_listing_key;
create unique index if not exists conversations_participants_key on public.conversations (participant_one, participant_two);

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "manage own push subscriptions" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
