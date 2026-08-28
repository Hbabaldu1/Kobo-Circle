-- Additive location hierarchy. Legacy estate/street data remains intact for existing accounts.
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
  unique (state_id, name)
);
create table if not exists public.wards (
  id uuid primary key default uuid_generate_v4(),
  lga_id uuid not null references public.lgas(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (lga_id, name)
);
create index if not exists idx_lgas_state_id on public.lgas(state_id);
create index if not exists idx_wards_lga_id on public.wards(lga_id);

alter table public.users add column if not exists state_id uuid references public.states(id);
alter table public.users add column if not exists lga_id uuid references public.lgas(id);
alter table public.users add column if not exists ward_id uuid references public.wards(id);
alter table public.listings add column if not exists state_id uuid references public.states(id);
alter table public.listings add column if not exists lga_id uuid references public.lgas(id);
alter table public.users alter column estate_id drop not null;
alter table public.users alter column street_id drop not null;
alter table public.listings alter column estate_id drop not null;
create index if not exists idx_users_state_id on public.users(state_id);
create index if not exists idx_users_lga_id on public.users(lga_id);
create index if not exists idx_users_ward_id on public.users(ward_id);
create index if not exists idx_listings_state_id on public.listings(state_id);
create index if not exists idx_listings_lga_id on public.listings(lga_id);

-- Preserve all legacy records by mapping each historical estate city to an LGA in Jigawa,
-- and each historical street to a ward under that LGA. Production data can be renamed later.
insert into public.states (name) values ('Jigawa') on conflict (name) do nothing;
insert into public.lgas (state_id, name)
select s.id, e.city from public.estates e cross join public.states s
where s.name = 'Jigawa' on conflict (state_id, name) do nothing;
insert into public.wards (lga_id, name)
select l.id, st.name from public.streets st join public.estates e on e.id = st.estate_id
join public.states s on s.name = 'Jigawa' join public.lgas l on l.state_id = s.id and l.name = e.city
on conflict (lga_id, name) do nothing;
update public.users u set ward_id = w.id, lga_id = w.lga_id, state_id = l.state_id
from public.streets st join public.estates e on e.id = st.estate_id join public.states s on s.name = 'Jigawa'
join public.lgas l on l.state_id = s.id and l.name = e.city join public.wards w on w.lga_id = l.id and w.name = st.name
where u.street_id = st.id and (u.ward_id is null or u.lga_id is null or u.state_id is null);
update public.listings li set lga_id = u.lga_id, state_id = u.state_id from public.users u
where li.user_id = u.id and (li.lga_id is null or li.state_id is null);

create or replace function public.get_my_lga_id() returns uuid language sql stable security definer set search_path = public as $$
  select lga_id from public.users where id = auth.uid()
$$;
create or replace function public.get_my_state_id() returns uuid language sql stable security definer set search_path = public as $$
  select state_id from public.users where id = auth.uid()
$$;
grant execute on function public.get_my_lga_id() to authenticated;
grant execute on function public.get_my_state_id() to authenticated;

alter table public.states enable row level security;
alter table public.lgas enable row level security;
alter table public.wards enable row level security;
create policy "read states for onboarding" on public.states for select to authenticated using (true);
create policy "read lgas for onboarding" on public.lgas for select to authenticated using (true);
create policy "read wards for onboarding" on public.wards for select to authenticated using (true);
create policy "read sellers in same lga" on public.users for select to authenticated using (lga_id = public.get_my_lga_id());
create policy "read listings in own lga" on public.listings for select to authenticated using (lga_id = public.get_my_lga_id());
create policy "insert own listings in lga" on public.listings for insert to authenticated with check (
 user_id = auth.uid() and lga_id = public.get_my_lga_id() and state_id = public.get_my_state_id());

-- Verification: this must return zero rows before the following NOT NULL statements are applied.
-- select id, email, estate_id, street_id, state_id, lga_id, ward_id from public.users where state_id is null or lga_id is null or ward_id is null;
-- alter table public.users alter column state_id set not null;
-- alter table public.users alter column lga_id set not null;
-- alter table public.users alter column ward_id set not null;
-- alter table public.listings alter column state_id set not null;
-- alter table public.listings alter column lga_id set not null;
