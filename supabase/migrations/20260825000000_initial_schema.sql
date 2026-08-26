create extension if not exists "uuid-ossp";

create table if not exists public.estates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.streets (
  id uuid primary key default uuid_generate_v4(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  name text not null
);

create index if not exists idx_streets_estate_id on public.streets(estate_id);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  email text not null unique,
  phone text,
  street_id uuid not null references public.streets(id),
  estate_id uuid not null references public.estates(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_users_estate_id on public.users(estate_id);
create index if not exists idx_users_street_id on public.users(street_id);

create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  estate_id uuid not null references public.estates(id),
  type text not null check (type in ('sale', 'service', 'request')),
  title text not null check (char_length(title) <= 120),
  price text,
  description text check (char_length(description) <= 500),
  status text not null default 'active' check (status in ('active', 'sold', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_estate_id on public.listings(estate_id);
create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_listings_type on public.listings(type);
create index if not exists idx_listings_created_at on public.listings(created_at desc);

create table if not exists public.vouches (
  id uuid primary key default uuid_generate_v4(),
  voucher_id uuid not null references public.users(id) on delete cascade,
  vouched_for_id uuid not null references public.users(id) on delete cascade,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  constraint no_self_vouch check (voucher_id != vouched_for_id),
  constraint one_vouch_per_pair unique (voucher_id, vouched_for_id)
);

create index if not exists idx_vouches_vouched_for_id on public.vouches(vouched_for_id);
create index if not exists idx_vouches_voucher_id on public.vouches(voucher_id);

create or replace view public.seller_trust as
select
  u.id as user_id,
  count(v.id) as vouch_count,
  least(count(v.id), 12)::numeric / 12 as trust_ratio
from public.users u
left join public.vouches v on v.vouched_for_id = u.id
group by u.id;

alter table public.estates enable row level security;
alter table public.streets enable row level security;
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.vouches enable row level security;

drop policy if exists "read own estate" on public.estates;
create policy "read own estate"
  on public.estates for select
  to authenticated
  using (
    id in (select estate_id from public.users where id = auth.uid())
  );

drop policy if exists "read streets for onboarding" on public.streets;
create policy "read streets for onboarding"
  on public.streets for select
  to authenticated
  using (true);

drop policy if exists "read own user row" on public.users;
create policy "read own user row"
  on public.users for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "read sellers in same estate" on public.users;
create policy "read sellers in same estate"
  on public.users for select
  to authenticated
  using (
    estate_id in (select estate_id from public.users where id = auth.uid())
  );

drop policy if exists "insert own user row" on public.users;
create policy "insert own user row"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "update own user row" on public.users;
create policy "update own user row"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "read listings in own estate" on public.listings;
create policy "read listings in own estate"
  on public.listings for select
  to authenticated
  using (
    estate_id in (select estate_id from public.users where id = auth.uid())
  );

drop policy if exists "insert own listings" on public.listings;
create policy "insert own listings"
  on public.listings for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and estate_id = (select estate_id from public.users where id = auth.uid())
  );

drop policy if exists "update own listings" on public.listings;
create policy "update own listings"
  on public.listings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "read vouches in own estate" on public.vouches;
create policy "read vouches in own estate"
  on public.vouches for select
  to authenticated
  using (
    vouched_for_id in (
      select id from public.users where estate_id = (select estate_id from public.users where id = auth.uid())
    )
  );

drop policy if exists "insert own vouches" on public.vouches;
create policy "insert own vouches"
  on public.vouches for insert
  to authenticated
  with check (
    voucher_id = auth.uid()
    and voucher_id != vouched_for_id
    and vouched_for_id in (
      select id from public.users where estate_id = (select estate_id from public.users where id = auth.uid())
    )
  );

create or replace function public.check_listing_rate_limit()
returns trigger as $$
begin
  if (
    select count(*) from public.listings
    where user_id = new.user_id
      and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'Rate limit exceeded: max 5 listings per 24 hours';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_listing_rate_limit on public.listings;
create trigger trg_listing_rate_limit
  before insert on public.listings
  for each row execute function public.check_listing_rate_limit();

create or replace function public.check_vouch_rate_limit()
returns trigger as $$
begin
  if (
    select count(*) from public.vouches
    where voucher_id = new.voucher_id
      and created_at > now() - interval '7 days'
  ) >= 1 then
    raise exception 'Rate limit exceeded: max 1 vouch per week';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_vouch_rate_limit on public.vouches;
create trigger trg_vouch_rate_limit
  before insert on public.vouches
  for each row execute function public.check_vouch_rate_limit();

create or replace function public.check_vouch_eligibility()
returns trigger as $$
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
$$ language plpgsql security definer;

drop trigger if exists trg_vouch_eligibility on public.vouches;
create trigger trg_vouch_eligibility
  before insert on public.vouches
  for each row execute function public.check_vouch_eligibility();

insert into public.estates (name, city)
select 'Golden Estate', 'Lekki'
where not exists (select 1 from public.estates where name = 'Golden Estate');

insert into public.streets (estate_id, name)
select e.id, s.name
from public.estates e
cross join (values
  ('Palm Avenue'),
  ('Coral Close'),
  ('Silverbird Row'),
  ('Estate Gate — Phase 2')
) as s(name)
where e.name = 'Golden Estate'
and not exists (
  select 1 from public.streets st where st.estate_id = e.id and st.name = s.name
);
