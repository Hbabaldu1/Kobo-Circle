create table if not exists public.phone_update_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_phone_update_attempts_user_attempted_at
  on public.phone_update_attempts (user_id, attempted_at desc);

alter table public.phone_update_attempts enable row level security;
-- No policies: this audit table is deliberately inaccessible to browser clients.
