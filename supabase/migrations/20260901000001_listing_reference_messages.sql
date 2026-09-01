-- Rich listing context cards for direct-message threads.
alter table public.messages
  add column if not exists message_type text not null default 'text'
    check (message_type in ('text', 'listing_reference')),
  add column if not exists reference_listing_id uuid null
    references public.listings(id) on delete set null;

create index if not exists messages_reference_listing_id_idx
  on public.messages (reference_listing_id)
  where reference_listing_id is not null;
