-- Repair environments where the previous pair-only conversation migration was not applied.
do $$
declare record record;
begin
  for record in
    select conname from pg_constraint
    where conrelid = 'public.conversations'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like '%listing_id%'
  loop
    execute format('alter table public.conversations drop constraint %I', record.conname);
  end loop;
end $$;
drop index if exists public.conversations_participants_listing_key;
-- Preserve message history while collapsing legacy per-listing rows into one pair thread.
with ranked as (
  select id, first_value(id) over (partition by participant_one, participant_two order by created_at, id) as canonical_id,
    row_number() over (partition by participant_one, participant_two order by created_at, id) as position
  from public.conversations
), moved as (
  update public.messages message set conversation_id = ranked.canonical_id
  from ranked where message.conversation_id = ranked.id and ranked.position > 1
  returning message.id
)
delete from public.conversations conversation using ranked
where conversation.id = ranked.id and ranked.position > 1;
create unique index if not exists conversations_participants_key on public.conversations (participant_one, participant_two);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  vouch_enabled boolean not null default true,
  message_enabled boolean not null default true,
  listing_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists "manage own notification preferences" on public.notification_preferences;
create policy "manage own notification preferences" on public.notification_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$ begin alter publication supabase_realtime add table public.vouches; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.listings; exception when duplicate_object then null; end $$;
