revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

drop policy if exists "mark received messages as read" on public.messages;
create policy "mark received messages as read"
  on public.messages for update to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  )
  with check (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

drop policy if exists "update own conversations" on public.conversations;
revoke update on public.conversations from authenticated;
grant update (updated_at) on public.conversations to authenticated;
create policy "update own conversations"
  on public.conversations for update to authenticated
  using (auth.uid() = participant_one or auth.uid() = participant_two)
  with check (auth.uid() = participant_one or auth.uid() = participant_two);

create or replace function public.bump_conversation_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_conversation_updated_at on public.messages;
create trigger trg_bump_conversation_updated_at
  after insert on public.messages
  for each row execute function public.bump_conversation_updated_at();
