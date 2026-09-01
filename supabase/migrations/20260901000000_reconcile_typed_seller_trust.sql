-- Keep source-controlled schema aligned with the typed-vouch trust model.
alter table public.vouches
  add column if not exists vouch_type text;

update public.vouches
set vouch_type = 'community'
where vouch_type is null;

alter table public.vouches
  alter column vouch_type set not null,
  alter column vouch_type set default 'community';

alter table public.vouches
  drop constraint if exists vouches_vouch_type_check;
alter table public.vouches
  add constraint vouches_vouch_type_check
  check (vouch_type in ('community', 'tenure', 'transaction'));

alter table public.vouches
  drop constraint if exists one_vouch_per_pair;
alter table public.vouches
  drop constraint if exists one_vouch_per_type_per_pair;
alter table public.vouches
  add constraint one_vouch_per_type_per_pair unique (voucher_id, vouched_for_id, vouch_type);

drop view if exists public.seller_trust;

create view public.seller_trust as
select
  u.id as user_id,
  count(v.id) filter (where v.vouch_type = 'community') as community_vouch_count,
  count(v.id) filter (where v.vouch_type = 'tenure') as tenure_vouch_count,
  count(v.id) filter (where v.vouch_type = 'transaction') as transaction_vouch_count,
  least(
    count(v.id) filter (where v.vouch_type = 'community')
    + 2 * count(v.id) filter (where v.vouch_type = 'tenure')
    + 3 * count(v.id) filter (where v.vouch_type = 'transaction'),
    24
  ) as weighted_score,
  least(
    count(v.id) filter (where v.vouch_type = 'community')
    + 2 * count(v.id) filter (where v.vouch_type = 'tenure')
    + 3 * count(v.id) filter (where v.vouch_type = 'transaction'),
    24
  )::numeric / 24 as trust_ratio
from public.users u
left join public.vouches v on v.vouched_for_id = u.id
group by u.id;
