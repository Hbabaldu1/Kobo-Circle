create extension if not exists pgcrypto;

create table public.estates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  created_at timestamptz not null default now()
);

create table public.streets (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  name text not null
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  street_id uuid not null references public.streets(id),
  estate_id uuid not null references public.estates(id),
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  estate_id uuid not null references public.estates(id),
  type text not null check (type in ('sale', 'service', 'request')),
  title text not null check (char_length(title) <= 120),
  price text,
  description text not null check (char_length(description) <= 500),
  status text not null default 'active' check (status in ('active', 'sold', 'closed')),
  created_at timestamptz not null default now()
);

create table public.vouches (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.users(id) on delete cascade,
  vouched_for_id uuid not null references public.users(id) on delete cascade,
  note text not null check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  constraint vouches_no_self_vouch check (voucher_id <> vouched_for_id),
  constraint vouches_one_per_pair unique (voucher_id, vouched_for_id)
);

create index listings_estate_created_at_idx on public.listings (estate_id, created_at desc);
create index streets_estate_id_idx on public.streets (estate_id);
create index vouches_vouched_for_id_idx on public.vouches (vouched_for_id);

-- Keep a profile's estate aligned with its selected street even if input bypasses the UI.
create function public.assert_user_street_belongs_to_estate()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.streets where id = new.street_id and estate_id = new.estate_id
  ) then
    raise exception 'street must belong to the selected estate';
  end if;
  return new;
end;
$$;

create trigger users_street_estate_match
before insert or update of street_id, estate_id on public.users
for each row execute function public.assert_user_street_belongs_to_estate();

-- A profile email is always the confirmed Auth account's email, never client input.
create function public.assert_user_email_matches_auth_account()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if not exists (
    select 1 from auth.users
    where id = auth.uid() and email = new.email and email_confirmed_at is not null
  ) then
    raise exception 'profile email must match a confirmed signed-in auth account';
  end if;
  return new;
end;
$$;

create trigger users_email_matches_auth_account
before insert or update of email on public.users
for each row execute function public.assert_user_email_matches_auth_account();

-- Security-definer helpers avoid recursive RLS policy evaluation. They expose no data.
create schema if not exists private;
revoke all on schema private from public;

create function private.current_user_estate_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$ select estate_id from public.users where id = auth.uid() $$;

create function private.is_same_estate(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = target_user_id and estate_id = private.current_user_estate_id()
  )
$$;

-- This security-invoker function preserves RLS when retrieving the feed.
create function public.listings_with_trust()
returns table (id uuid, user_id uuid, estate_id uuid, type text, title text, price text, description text, status text, created_at timestamptz, seller_name text, street_name text, vouch_count bigint)
language sql stable security invoker set search_path = public
as $$
  select l.id, l.user_id, l.estate_id, l.type, l.title, l.price, l.description, l.status,
    l.created_at, u.name, s.name, count(v.id)
  from public.listings l
  join public.users u on u.id = l.user_id
  join public.streets s on s.id = u.street_id
  left join public.vouches v on v.vouched_for_id = u.id
  where l.status = 'active'
  group by l.id, u.name, s.name
  order by l.created_at desc
$$;

revoke all on function private.current_user_estate_id() from public;
revoke all on function private.is_same_estate(uuid) from public;
revoke all on function public.listings_with_trust() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_user_estate_id() to authenticated;
grant execute on function private.is_same_estate(uuid) to authenticated;
grant execute on function public.listings_with_trust() to authenticated;

alter table public.estates enable row level security;
alter table public.streets enable row level security;
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.vouches enable row level security;

-- Reference data is visible only after authentication; it is never client-writable.
create policy "authenticated users can read estates" on public.estates
for select to authenticated using (true);
create policy "authenticated users can read streets" on public.streets
for select to authenticated using (true);

create policy "users can read profiles in their estate" on public.users
for select to authenticated using (estate_id = private.current_user_estate_id());
create policy "users can create their own profile" on public.users
for insert to authenticated with check (id = auth.uid());
create policy "users can update their own profile" on public.users
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "users can read estate listings" on public.listings
for select to authenticated using (estate_id = private.current_user_estate_id());
create policy "users can create own estate listings" on public.listings
for insert to authenticated with check (
  user_id = auth.uid() and estate_id = private.current_user_estate_id()
);
create policy "users can update own listings" on public.listings
for update to authenticated using (user_id = auth.uid()) with check (
  user_id = auth.uid() and estate_id = private.current_user_estate_id()
);
create policy "users can delete own listings" on public.listings
for delete to authenticated using (user_id = auth.uid());

create policy "users can read estate vouches" on public.vouches
for select to authenticated using (
  private.is_same_estate(voucher_id) and private.is_same_estate(vouched_for_id)
);
create policy "users can create their own vouches" on public.vouches
for insert to authenticated with check (
  voucher_id = auth.uid()
  and voucher_id <> vouched_for_id
  and private.is_same_estate(vouched_for_id)
);
create policy "users can delete own vouches" on public.vouches
for delete to authenticated using (voucher_id = auth.uid());

-- Explicitly grant no access to anon; authenticated grants are deliberately narrow.
revoke all on all tables in schema public from anon;
grant select on public.estates, public.streets to authenticated;
grant select, insert, update on public.users to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, delete on public.vouches to authenticated;
