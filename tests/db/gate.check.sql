-- ABUSE-01/02: comentarios y archivos solo con prueba firmada, topes que no
-- dependen del visitante, subidas abandonadas y aviso de comentarios nuevos.
-- Usa supabase/content.sql y los ayudantes de tests/db/helpers.sql.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ba01', 'gate-editor@test'),
  ('00000000-0000-0000-0000-00000000ba02', 'gate-sinrol@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ba01', 'editor');

create temp table t (proof text);
grant all on t to anon, authenticated;

-- ── Las funciones antiguas ya no existen (0029) ──────────────────────────
select tests.eq('submit_review antigua eliminada',
  to_regprocedure('public.submit_review(text,text,text,smallint,text,text)') is null, true);
select tests.eq('attach_review_media antigua eliminada',
  to_regprocedure('public.attach_review_media(uuid,text,jsonb)') is null, true);
select tests.eq('finish_review_media antigua eliminada',
  to_regprocedure('public.finish_review_media(uuid,text)') is null, true);

-- ── Vectores compartidos con Node (tests/unit/review-gate.test.ts) ───────
select tests.eq('la firma coincide con la de Node',
  translate(rtrim(encode(extensions.hmac(
    convert_to('eyJ2IjoxLCJhY3QiOiJyZXZpZXciLCJzZW5kZXIiOiJzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3NzcyIsImJpbmQiOiJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiIiwiZXhwIjoyMDAwMDAwMDAwLCJub25jZSI6Im5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5uIn0', 'UTF8'),
    convert_to('vector-secret-0123456789-0123456789-abcdef', 'UTF8'), 'sha256'), 'base64'), '='), '+/', '-_'),
  'ZXsTUO6WxSakahM_zW6O0xpTAmqPY6md4A1YHLq02eI');
select tests.eq('la huella del contenido coincide con la de Node',
  (select private.review_bind('place', 'playa-papudo', 'Ana', 5::smallint, 'Muy linda la playa')),
  'fb5e5d591d98e2947cecb35aca29782d7d1bd952dc11852032562b502f544cd6');

-- ── Sin prueba válida no se entra ────────────────────────────────────────
select tests.login('anon');
select tests.raises('sin prueba',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Hola hola',repeat('a',32),null)$$, '28000');
select tests.raises('prueba inventada',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Hola hola',repeat('a',32),'abc.def')$$, '28000');
select tests.raises('firmada con otro secreto',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Hola hola',repeat('a',32),
      tests.review_proof('place','playa-papudo','Ana',5::smallint,'Hola hola',repeat('a',32),
        120, null, 'otro-secreto-distinto-0123456789abcdef-0123'))$$, '28000');
select tests.raises('prueba vencida',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Hola hola',repeat('a',32),
      tests.review_proof('place','playa-papudo','Ana',5::smallint,'Hola hola',repeat('a',32), -120))$$, '28000');
select tests.raises('vigencia absurda (no se aceptan pruebas «eternas»)',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Hola hola',repeat('a',32),
      tests.review_proof('place','playa-papudo','Ana',5::smallint,'Hola hola',repeat('a',32), 100000))$$, '28000');

-- La prueba sirve solo para ese texto, ese remitente y esa acción.
update t set proof = null;
insert into t (proof) values (tests.review_proof('place','playa-papudo','Ana',5::smallint,'Texto original',repeat('a',32)));
select tests.raises('una prueba no sirve para otro texto',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Texto distinto',repeat('a',32),(select proof from t))$$, '28000');
select tests.raises('ni para otro remitente',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Texto original',repeat('b',32),(select proof from t))$$, '28000');
select tests.raises('ni para otra ficha',
  $$select public.submit_review_v2('place','playa-chica-papudo','Ana',5::smallint,'Texto original',repeat('a',32),(select proof from t))$$, '28000');
select tests.raises('una prueba de otra acción no sirve',
  $$select public.finish_review_media_v2(gen_random_uuid(), repeat('a',32), (select proof from t))$$, '28000');

-- Uso único.
select tests.eq('la prueba válida entra',
  (select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Texto original',repeat('a',32),(select proof from t))) is not null, true);
select tests.raises('la misma prueba, usada otra vez, se rechaza',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Texto original',repeat('a',32),(select proof from t))$$, '28000');
select tests.logout();

-- Los nonces vencidos se limpian solos.
insert into private.used_proofs (nonce, expires_at) values (repeat('z', 32), now() - interval '2 hours');
select tests.login('anon');
select tests.submit_review('place', 'playa-papudo', 'Beto', 4::smallint, 'Otro comentario', repeat('b', 32));
select tests.logout();
select tests.eq('el nonce vencido se borró',
  (select count(*)::int from private.used_proofs where nonce = repeat('z', 32)), 0);

-- ── Esquema privado: invisible para los visitantes ───────────────────────
select tests.login('anon');
select tests.raises('anon no lee los secretos',
  $$select secret from private.gate_secrets$$, '42501');
select tests.raises('anon no llama a la verificación',
  $$select private.verify_proof('a.b', 'review', 'x', 'y')$$, '42501');
select tests.raises('anon no cambia los topes',
  $$update private.abuse_limits set value = 1000000$$, '42501');
select tests.logout();
select tests.login('authenticated', '00000000-0000-0000-0000-00000000ba01');
select tests.raises('ni siquiera el personal lee los secretos por la API',
  $$select secret from private.gate_secrets$$, '42501');
select tests.logout();

-- ── Falla cerrado, y la rotación del secreto ─────────────────────────────
update private.gate_secrets set slot = 'previous' where slot = 'current';
select tests.login('anon');
select tests.raises('sin secreto vigente, una prueba con el secreto nuevo no vale',
  $$select tests.submit_review('place', 'playa-papudo', 'Ana', 5::smallint, 'Rotación uno', repeat('r', 32))$$, '28000');
select tests.logout();
-- Con el nuevo cargado y el anterior todavía, valen ambos.
insert into private.gate_secrets (slot, secret) values ('current', 'secreto-nuevo-0123456789abcdef-0123456789-xyz');
select tests.login('anon');
select tests.eq('vale la prueba firmada con el secreto nuevo',
  (select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Rotación dos',repeat('r',32),
     tests.review_proof('place','playa-papudo','Ana',5::smallint,'Rotación dos',repeat('r',32), 120, null,
       'secreto-nuevo-0123456789abcdef-0123456789-xyz'))) is not null, true);
select tests.eq('y la firmada con el anterior, mientras exista',
  (select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Rotación tres',repeat('r',32),
     tests.review_proof('place','playa-papudo','Ana',5::smallint,'Rotación tres',repeat('r',32), 120, null,
       'secreto-de-pruebas-0123456789abcdef-0123456789'))) is not null, true);
select tests.logout();
delete from private.gate_secrets where slot = 'previous';
select tests.login('anon');
select tests.raises('borrado el anterior, deja de valer',
  $$select public.submit_review_v2('place','playa-papudo','Ana',5::smallint,'Rotación cuatro',repeat('r',32),
     tests.review_proof('place','playa-papudo','Ana',5::smallint,'Rotación cuatro',repeat('r',32), 120, null,
       'secreto-de-pruebas-0123456789abcdef-0123456789'))$$, '28000');
select tests.logout();
-- Se vuelve al secreto de pruebas para el resto.
update private.gate_secrets set secret = 'secreto-de-pruebas-0123456789abcdef-0123456789' where slot = 'current';
delete from public.reviews where sender_hash = repeat('r', 32);

-- ── Topes que no dependen de la huella ───────────────────────────────────
-- Por ficha: 10 por hora aunque cada comentario venga de un remitente distinto.
select tests.login('anon');
do $$
declare i int;
begin
  for i in 1..20 loop
    begin
      perform tests.submit_review('place', 'playa-chica-papudo', 'Visita', 4::smallint,
        'Comentario ' || i, md5('ficha-' || i) || md5('x' || i));
    exception when others then null;
    end;
  end loop;
end $$;
select tests.logout();
select tests.eq('una ficha recibe como máximo 10 por hora, con remitentes distintos',
  (select count(*)::int from public.reviews r join public.places p on p.id = r.place_id
    where p.slug = 'playa-chica-papudo'), 10);

-- Global: con otro remitente y otra ficha, igual se rechaza al llegar al tope.
update private.abuse_limits set value = (select count(*) from public.reviews) where key = 'global_reviews_day';
select tests.login('anon');
select tests.raises('el tope global frena aunque la huella sea nueva',
  $$select tests.submit_review('place', 'playa-papudo', 'Nuevo', 4::smallint, 'Otro más', md5('nuevo') || md5('nuevo2'))$$, '54000');
select tests.logout();
update private.abuse_limits set value = 150 where key = 'global_reviews_day';

-- ── Archivos: topes globales, espacio y reservas abandonadas ─────────────
create temp table r (name text primary key, id uuid, paths text[]);
grant all on r to anon, authenticated;
select tests.login('anon');
insert into r (name, id) values
  ('A', tests.submit_review('place', 'playa-papudo', 'Con fotos', 5::smallint, 'Comentario con fotos', repeat('m', 32))),
  ('B', tests.submit_review('place', 'playa-papudo', 'Con fotos 2', 5::smallint, 'Segundo con fotos', repeat('n', 32)));
select tests.logout();

-- Tope diario de archivos.
update private.abuse_limits set value = 2 where key = 'global_files_day';
select tests.login('anon');
select tests.raises('más archivos nuevos por día que el tope global',
  $$select tests.attach_review_media((select id from r where name = 'A'), repeat('m', 32),
    '[{"mime":"image/jpeg","size":1000},{"mime":"image/png","size":1000},{"mime":"image/webp","size":1000}]')$$, '54000');
select tests.logout();
update private.abuse_limits set value = 100 where key = 'global_files_day';

-- Espacio: lo que se está subiendo cuenta con el máximo del bucket (25 MB),
-- no con el tamaño que declara quien llama (1000 bytes).
update private.abuse_limits set value = 30 * 1048576 where key = 'pending_bytes';
select tests.login('anon');
update r set paths = tests.attach_review_media(id, repeat('m', 32), '[{"mime":"image/jpeg","size":1000}]')
  where name = 'A';
select tests.raises('el siguiente archivo no cabe, aunque declare pesar poco',
  $$select tests.attach_review_media((select id from r where name = 'B'), repeat('n', 32),
    '[{"mime":"image/jpeg","size":1000}]')$$, '54000');
select tests.logout();

-- Al terminar la subida, cuenta lo que pesa de verdad y libera cupo.
insert into storage.objects (bucket_id, name, metadata)
  select 'review-media', paths[1], '{"size": 2000}'::jsonb from r where name = 'A';
select tests.login('anon');
select tests.eq('lo subido queda pendiente',
  (select tests.finish_review_media((select id from r where name = 'A'), repeat('m', 32))), 1);
select tests.eq('con el peso real, el otro comentario ya cabe',
  array_length(tests.attach_review_media((select id from r where name = 'B'), repeat('n', 32),
    '[{"mime":"image/jpeg","size":1000}]'), 1), 1);
select tests.logout();
update private.abuse_limits set value = 314572800 where key = 'pending_bytes';

-- Una reserva que nadie terminó de subir en una hora se da por abandonada.
insert into public.review_media (review_id, path, kind, mime, size_bytes, status, created_at)
  select id, id || '/vieja.jpg', 'image', 'image/jpeg', 10, 'uploading', now() - interval '3 hours'
  from r where name = 'A';
select tests.login('anon');
insert into r (name, id) values
  ('C', tests.submit_review('place', 'playa-papudo', 'Tercero', 5::smallint, 'Comentario para adjuntar', repeat('q', 32)));
select tests.attach_review_media((select id from r where name = 'C'), repeat('q', 32), '[{"mime":"image/png","size":10}]');
select tests.logout();
select tests.eq('la reserva vieja pasó a descartada',
  (select status from public.review_media where path like '%/vieja.jpg'), 'rejected');

-- ── Aviso de comentarios nuevos (0028) ───────────────────────────────────
select tests.login('authenticated', '00000000-0000-0000-0000-00000000ba01');
select tests.eq('los comentarios nuevos quedan sin revisar',
  (select count(*)::int > 0 from public.reviews where reviewed_at is null), true);
select tests.eq('el editor marca un comentario como revisado',
  tests.rowcount($$update public.reviews set reviewed_at = now(), reviewed_by = auth.uid()
    where body = 'Comentario con fotos'$$), 1);
select tests.logout();
select tests.login('anon');
select tests.raises('un visitante no ve el estado de revisión',
  $$select reviewed_at from public.reviews$$, '42501');
select tests.raises('ni lo cambia',
  $$update public.reviews set reviewed_at = now()$$, '42501');
select tests.logout();
select tests.login('authenticated', '00000000-0000-0000-0000-00000000ba02');
select tests.eq('un usuario sin rol no marca nada',
  tests.rowcount($$update public.reviews set reviewed_at = now()$$), 0);
select tests.logout();

-- ── analytics_events: ya no se inserta desde afuera (DB-01) ──────────────
select tests.login('anon');
select tests.raises('anon no inserta eventos de analítica',
  $$insert into public.analytics_events (name) values ('share')$$, '42501');
select tests.logout();
select tests.login('authenticated', '00000000-0000-0000-0000-00000000ba01');
select tests.eq('el personal sigue pudiendo leerlos',
  (select count(*)::int >= 0 from public.analytics_events), true);
select tests.logout();

rollback;
