create extension if not exists "uuid-ossp";

create table if not exists public.states (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.lgas (
  id uuid primary key default uuid_generate_v4(),
  state_id uuid not null references public.states(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (state_id, name),
  unique (id, state_id)
);

create table if not exists public.wards (
  id uuid primary key default uuid_generate_v4(),
  lga_id uuid not null,
  state_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (lga_id, name),
  unique (id, lga_id),
  constraint wards_lga_state_fk foreign key (lga_id, state_id)
    references public.lgas (id, state_id) on delete cascade
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  email text not null unique,
  phone text,
  avatar_url text,
  state_id uuid not null references public.states(id),
  lga_id uuid not null,
  ward_id uuid,
  created_at timestamptz not null default now(),
  constraint users_lga_state_fk foreign key (lga_id, state_id)
    references public.lgas (id, state_id),
  constraint users_ward_lga_fk foreign key (ward_id, lga_id)
    references public.wards (id, lga_id)
);

create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  state_id uuid not null references public.states(id),
  lga_id uuid not null,
  ward_id uuid,
  type text not null check (type in ('sale', 'service', 'request')),
  title text not null check (char_length(title) <= 120),
  price text,
  description text check (char_length(description) <= 500),
  photo_url text,
  status text not null default 'active' check (status in ('active', 'sold', 'closed')),
  created_at timestamptz not null default now(),
  constraint listings_lga_state_fk foreign key (lga_id, state_id)
    references public.lgas (id, state_id),
  constraint listings_ward_lga_fk foreign key (ward_id, lga_id)
    references public.wards (id, lga_id)
);

create index if not exists idx_lgas_state_id on public.lgas(state_id);
create index if not exists idx_wards_lga_id on public.wards(lga_id);
create index if not exists idx_users_location on public.users(state_id, lga_id, ward_id);
create index if not exists idx_listings_location on public.listings(state_id, lga_id, ward_id);
create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_listings_type on public.listings(type);
create index if not exists idx_listings_created_at on public.listings(created_at desc);

create table if not exists public.vouches (
  id uuid primary key default uuid_generate_v4(),
  voucher_id uuid not null references public.users(id) on delete cascade,
  vouched_for_id uuid not null references public.users(id) on delete cascade,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  constraint no_self_vouch check (voucher_id <> vouched_for_id),
  constraint one_vouch_per_pair unique (voucher_id, vouched_for_id)
);

create or replace view public.seller_trust as
select u.id as user_id, count(v.id) as vouch_count,
  least(count(v.id), 12)::numeric / 12 as trust_ratio
from public.users u left join public.vouches v on v.vouched_for_id = u.id
group by u.id;

create or replace function public.get_my_state_id() returns uuid language sql stable security definer set search_path = public as $$
  select state_id from public.users where id = auth.uid()
$$;
create or replace function public.get_my_lga_id() returns uuid language sql stable security definer set search_path = public as $$
  select lga_id from public.users where id = auth.uid()
$$;
create or replace function public.get_my_ward_id() returns uuid language sql stable security definer set search_path = public as $$
  select ward_id from public.users where id = auth.uid()
$$;
grant execute on function public.get_my_state_id(), public.get_my_lga_id(), public.get_my_ward_id() to authenticated;

alter table public.states enable row level security;
alter table public.lgas enable row level security;
alter table public.wards enable row level security;
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.vouches enable row level security;

create policy "read states for onboarding" on public.states for select to authenticated using (true);
create policy "read lgas for onboarding" on public.lgas for select to authenticated using (true);
create policy "read wards for onboarding" on public.wards for select to authenticated using (true);
create policy "read own user row" on public.users for select to authenticated using (id = auth.uid());
create policy "read users in own lga" on public.users for select to authenticated using (lga_id = public.get_my_lga_id());
create policy "insert own user row" on public.users for insert to authenticated with check (id = auth.uid());
create policy "update own user row" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "read listings in own lga" on public.listings for select to authenticated using (lga_id = public.get_my_lga_id());
create policy "insert own listings in lga" on public.listings for insert to authenticated with check (
  user_id = auth.uid() and state_id = public.get_my_state_id() and lga_id = public.get_my_lga_id()
  and ward_id is not distinct from public.get_my_ward_id()
);
create policy "update own listings" on public.listings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read vouches in own lga" on public.vouches for select to authenticated using (
  vouched_for_id in (select id from public.users where lga_id = public.get_my_lga_id())
);
create policy "insert own vouches" on public.vouches for insert to authenticated with check (
  voucher_id = auth.uid()
  and vouched_for_id in (select id from public.users where lga_id = public.get_my_lga_id())
);

create or replace function public.check_listing_rate_limit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.listings where user_id = new.user_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Rate limit exceeded: max 5 listings per 24 hours';
  end if;
  return new;
end;
$$;
create trigger trg_listing_rate_limit before insert on public.listings for each row execute function public.check_listing_rate_limit();

create or replace function public.check_vouch_rate_limit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.vouches where voucher_id = new.voucher_id and created_at > now() - interval '7 days') >= 1 then
    raise exception 'Rate limit exceeded: max 1 vouch per week';
  end if;
  return new;
end;
$$;
create trigger trg_vouch_rate_limit before insert on public.vouches for each row execute function public.check_vouch_rate_limit();

create or replace function public.check_vouch_eligibility() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.listings where user_id = new.voucher_id
    union
    select 1 from public.vouches where voucher_id = new.voucher_id
  ) then
    raise exception 'Vouch not allowed: account has no prior listing or vouch history';
  end if;
  return new;
end;
$$;
create trigger trg_vouch_eligibility before insert on public.vouches for each row execute function public.check_vouch_eligibility();
