-- Comentarios de visitantes: envío, límites, visibilidad y moderación.
-- Usa el contenido de supabase/content.sql (se corre después de cargarlo).
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000aa01', 'mod-admin@test'),
  ('00000000-0000-0000-0000-00000000ee01', 'mod-editor@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000aa01', 'admin'),
  ('00000000-0000-0000-0000-00000000ee01', 'editor');

select tests.login('anon');
select tests.eq('anon comenta un lugar publicado',
  (select public.submit_review('place', 'playa-papudo', 'Ana', 5::smallint, 'Muy linda la playa', repeat('a', 32))) is not null, true);
select tests.eq('anon comenta un evento publicado',
  (select public.submit_review('event', 'demo-noche-de-bandas', 'Beto', 4::smallint, 'Buen ambiente', repeat('b', 32))) is not null, true);
select tests.raises('no se comenta lo que no existe',
  $$select public.submit_review('place', 'no-existe', 'Ana', 5::smallint, 'Hola hola', repeat('c', 32))$$, 'P0002');
select tests.raises('estrellas fuera de rango',
  $$select public.submit_review('place', 'playa-papudo', 'Ana', 6::smallint, 'Hola hola', repeat('c', 32))$$, '23514');
select tests.raises('texto vacío',
  $$select public.submit_review('place', 'playa-papudo', 'Ana', 3::smallint, '  ', repeat('c', 32))$$, '23514');
select public.submit_review('place', 'playa-papudo', 'Ana', 4::smallint, 'Segunda opinión', repeat('a', 32));
select public.submit_review('place', 'playa-papudo', 'Ana', 4::smallint, 'Tercera opinión', repeat('a', 32));
select tests.raises('máximo 3 por hora por remitente',
  $$select public.submit_review('place', 'playa-papudo', 'Ana', 4::smallint, 'Cuarta opinión', repeat('a', 32))$$, '54000');
select tests.raises('anon no inserta directo',
  $$insert into public.reviews (place_id, author_name, rating, body, sender_hash)
    select id, 'X', 5, 'directo', repeat('d', 32) from public.places limit 1$$, '42501');
select tests.raises('anon no ve la huella del remitente',
  $$select sender_hash from public.reviews$$, '42501');
select tests.eq('anon ve los comentarios visibles',
  (select count(*)::int from public.reviews), 4);
select tests.raises('anon no modera',
  $$update public.reviews set status = 'hidden'$$, '42501');
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000ee01');
select tests.eq('editor oculta un comentario',
  tests.rowcount($$update public.reviews set status = 'hidden', moderated_at = now()
    where body = 'Tercera opinión'$$), 1);
select tests.eq('editor no borra (0 filas)',
  tests.rowcount($$delete from public.reviews where body = 'Segunda opinión'$$), 0);
select tests.logout();

select tests.login('anon');
select tests.eq('el oculto ya no se ve',
  (select count(*)::int from public.reviews where body = 'Tercera opinión'), 0);
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000aa01');
select tests.eq('admin ve también los ocultos',
  (select count(*)::int from public.reviews), 4);
select tests.eq('admin borra',
  tests.rowcount($$delete from public.reviews where body = 'Segunda opinión'$$), 1);
select tests.logout();

select tests.eq('la moderación queda en la bitácora',
  (select count(*)::int > 0 from public.audit_log where table_name = 'reviews' and action = 'DELETE'), true);

rollback;
