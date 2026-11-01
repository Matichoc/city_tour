-- Fotos y videos de comentarios: registro, subida al bucket privado,
-- revisión del personal y qué ve el público. Usa supabase/content.sql.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ac01', 'media-admin@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ac01', 'admin');

create temp table t (review uuid, paths text[]);
grant all on t to anon, authenticated;

select tests.login('anon');
insert into t (review) select tests.submit_review('place', 'playa-papudo', 'Ana', 5::smallint, 'Con fotos', repeat('m', 32));
select tests.raises('otro remitente no adjunta archivos',
  $$select tests.attach_review_media((select review from t), repeat('x', 32), '[{"mime":"image/jpeg","size":1000}]')$$, 'P0002');
select tests.raises('máximo un video',
  $$select tests.attach_review_media((select review from t), repeat('m', 32),
    '[{"mime":"video/mp4","size":1000},{"mime":"video/webm","size":1000}]')$$, '22023');
select tests.raises('solo formatos permitidos',
  $$select tests.attach_review_media((select review from t), repeat('m', 32), '[{"mime":"image/gif","size":1000}]')$$, '22023');
select tests.raises('máximo 25 MB',
  $$select tests.attach_review_media((select review from t), repeat('m', 32), '[{"mime":"image/jpeg","size":30000000}]')$$, '23514');
update t set paths = tests.attach_review_media(review, repeat('m', 32),
  '[{"mime":"image/jpeg","size":1000,"scores":{"Porn":0.01}},{"mime":"video/mp4","size":5000}]');
select tests.eq('devuelve una ruta por archivo', (select array_length(paths, 1) from t), 2);
select tests.raises('no se adjunta dos veces',
  $$select tests.attach_review_media((select review from t), repeat('m', 32), '[{"mime":"image/png","size":10}]')$$, '23505');
select tests.raises('anon no lee review_media completo',
  $$select ai_scores from public.review_media$$, '42501');

-- Subida: solo a rutas registradas.
insert into storage.objects (bucket_id, name) select 'review-media', paths[1] from t;
select tests.raises('no sube a una ruta inventada',
  $$insert into storage.objects (bucket_id, name) values ('review-media', 'otra/cosa.jpg')$$, '42501');
select tests.eq('al terminar, lo subido queda pendiente',
  (select tests.finish_review_media((select review from t), repeat('m', 32))), 1);
select tests.raises('ya no sube a una ruta pendiente',
  $$insert into storage.objects (bucket_id, name) select 'review-media', paths[1] from t$$, '42501');
select tests.eq('anon no ve lo pendiente',
  (select count(*)::int from public.review_media), 0);
select tests.eq('anon no lee el archivo pendiente',
  (select count(*)::int from storage.objects where bucket_id = 'review-media'), 0);
select tests.raises('anon no aprueba',
  $$update public.review_media set status = 'approved'$$, '42501');
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000ac01');
select tests.eq('el personal ve lo pendiente y el puntaje',
  (select ai_scores ->> 'Porn' from public.review_media where status = 'pending'), '0.01');
select tests.eq('el personal lee el archivo pendiente',
  (select count(*)::int from storage.objects where bucket_id = 'review-media'), 1);
select tests.eq('admin aprueba',
  tests.rowcount($$update public.review_media set status = 'approved' where status = 'pending'$$), 1);
select tests.logout();

select tests.login('anon');
select tests.eq('anon ve lo aprobado',
  (select count(*)::int from public.review_media where status = 'approved'), 1);
select tests.eq('anon lee el archivo aprobado',
  (select count(*)::int from storage.objects where bucket_id = 'review-media'), 1);
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000ac01');
update public.reviews set status = 'hidden' where id = (select review from t);
select tests.logout();
select tests.login('anon');
select tests.eq('si se oculta el comentario, se ocultan sus archivos',
  (select count(*)::int from storage.objects where bucket_id = 'review-media'), 0);
select tests.logout();

rollback;
