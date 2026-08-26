alter table public.listings add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public read listing photos" on storage.objects;
create policy "public read listing photos"
  on storage.objects for select
  to public
  using (bucket_id = 'listing-photos');

drop policy if exists "authenticated users upload own listing photos" on storage.objects;
create policy "authenticated users upload own listing photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
