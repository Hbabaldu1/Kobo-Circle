insert into public.estates (id, name, city)
values ('4f0a5bcc-5a27-46f1-bf62-507c3e1d5df1', 'Golden Estate', 'Lekki')
on conflict (id) do update set name = excluded.name, city = excluded.city;

insert into public.streets (id, estate_id, name)
values
  ('9f58d356-cdc0-4a2c-962d-5501559cee41', '4f0a5bcc-5a27-46f1-bf62-507c3e1d5df1', 'Acacia Avenue'),
  ('021309e6-5abe-4a30-835f-9c67e3b3ce22', '4f0a5bcc-5a27-46f1-bf62-507c3e1d5df1', 'Palm Grove'),
  ('c5c6b6ea-78fe-44bb-bf6f-8a67a10b1fa6', '4f0a5bcc-5a27-46f1-bf62-507c3e1d5df1', 'Coral Close'),
  ('c19eee21-e9b9-433a-95b9-265f74bcc99c', '4f0a5bcc-5a27-46f1-bf62-507c3e1d5df1', 'Orchid Way')
on conflict (id) do update set name = excluded.name, estate_id = excluded.estate_id;
