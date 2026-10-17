-- Videos de comercios y validación del representante. Usa supabase/content.sql.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ae01', 'vid-editor@test'),
  ('00000000-0000-0000-0000-00000000be01', 'vid-verifier@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ae01', 'editor'),
  ('00000000-0000-0000-0000-00000000be01', 'verifier');

select tests.eq('el bucket de videos es público, de 50 MB y solo de video',
  (select public::text || ' ' || file_size_limit::text || ' ' || array_to_string(allowed_mime_types, ',')
   from storage.buckets where id = 'place-videos'),
  'true 52428800 video/mp4,video/webm,video/quicktime');

select tests.login('authenticated', '00000000-0000-0000-0000-00000000ae01');
select tests.eq('un editor registra un video en la ficha',
  tests.rowcount($$insert into public.place_images (place_id, storage_path, kind, width, height, alt_text, position)
    select id, 'https://x.supabase.co/storage/v1/object/public/place-videos/a/b.mp4', 'video', 1280, 720, 'Video de Roots', 9
    from public.places where slug = 'roots-salinas'$$), 1);
select tests.raises('un tipo de imagen desconocido se rechaza',
  $$insert into public.place_images (place_id, storage_path, kind, alt_text)
    select id, '/x.webp', 'gif', 'x' from public.places where slug = 'roots-salinas'$$, '23514');
select tests.eq('un editor sube un video al bucket',
  tests.rowcount($$insert into storage.objects (bucket_id, name) values ('place-videos', 'a/b.mp4')$$), 1);
select tests.eq('el editor marca la ficha como validada por el representante',
  tests.rowcount($$update public.places set owner_validated = true where slug = 'playa-chica-papudo'$$), 1);
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000be01');
select tests.raises('un verificador no sube videos',
  $$insert into storage.objects (bucket_id, name) values ('place-videos', 'c/d.mp4')$$, '42501');
select tests.logout();

select tests.login('anon');
select tests.raises('anon no sube videos',
  $$insert into storage.objects (bucket_id, name) values ('place-videos', 'e/f.mp4')$$, '42501');
select tests.eq('anon ve el video de una ficha publicada',
  (select count(*)::int from public.place_images where kind = 'video'), 1);
select tests.eq('anon lee el video del bucket público',
  (select count(*)::int from storage.objects where bucket_id = 'place-videos'), 1);
select tests.eq('anon ve que Roots Salinas está validada por el representante',
  (select owner_validated from public.places where slug = 'roots-salinas'), true);
select tests.eq('las fichas sin confirmar no lo están',
  (select owner_validated from public.places where slug = 'playa-papudo'), false);
select tests.logout();

rollback;
