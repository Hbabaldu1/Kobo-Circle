-- Test geography for location-based onboarding.
insert into public.states (name) values ('Jigawa') on conflict (name) do nothing;
insert into public.lgas (state_id, name)
select id, 'Birnin Kudu' from public.states where name = 'Jigawa'
on conflict (state_id, name) do nothing;
insert into public.wards (lga_id, state_id, name)
select l.id, l.state_id, ward.name
from public.lgas l cross join (values ('Kiyako Ward'), ('Kangire Ward'), ('Wurno Ward')) as ward(name)
join public.states s on s.id = l.state_id
where s.name = 'Jigawa' and l.name = 'Birnin Kudu'
on conflict (lga_id, name) do nothing;
