-- Pruebas de permisos (RLS), reglas editoriales y auditoría.
-- Todo corre en una transacción que se revierte.
begin;

-- ── Fixtures (como superusuario) ─────────────────────────────────────────
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@test'),
  ('00000000-0000-0000-0000-0000000000e1', 'editor@test'),
  ('00000000-0000-0000-0000-0000000000b1', 'verifier@test'),
  ('00000000-0000-0000-0000-0000000000c1', 'visitor@test'),
  ('00000000-0000-0000-0000-0000000000d1', 'inactive@test');
insert into papudo.profiles (user_id, role, active) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin', true),
  ('00000000-0000-0000-0000-0000000000e1', 'editor', true),
  ('00000000-0000-0000-0000-0000000000b1', 'verifier', true),
  ('00000000-0000-0000-0000-0000000000d1', 'editor', false);

insert into papudo.places (id, category_id, slug, publication_status)
select '10000000-0000-0000-0000-000000000001', id, 'playa-publicada', 'draft'
  from papudo.categories where slug = 'playas';
insert into papudo.place_translations (place_id, locale, name, short_description) values
  ('10000000-0000-0000-0000-000000000001', 'es', 'Playa publicada', 'Descripción');
update papudo.places set publication_status = 'published'
  where id = '10000000-0000-0000-0000-000000000001';

insert into papudo.places (id, category_id, slug)
select '10000000-0000-0000-0000-000000000002', id, 'lugar-borrador'
  from papudo.categories where slug = 'patrimonio';
insert into papudo.place_translations (place_id, locale, name) values
  ('10000000-0000-0000-0000-000000000002', 'es', 'Lugar borrador');
insert into papudo.place_hours (place_id, day_of_week, opens_at, closes_at) values
  ('10000000-0000-0000-0000-000000000002', 1, '09:00', '18:00'),
  ('10000000-0000-0000-0000-000000000001', 1, '09:00', '18:00');

-- ── Lectura pública ──────────────────────────────────────────────────────
select tests.login('anon');
select tests.eq('anon ve solo lugares publicados',
  (select count(*)::int from papudo.places), 1);
select tests.eq('anon no ve traducciones de borradores',
  (select count(*)::int from papudo.place_translations), 1);
select tests.eq('anon no ve horarios de borradores',
  (select count(*)::int from papudo.place_hours), 1);
select tests.eq('anon lee categorías',
  (select count(*)::int > 5 from papudo.categories), true);
select tests.eq('anon ve el municipio', (select count(*)::int from papudo.municipality), 1);
select tests.raises('anon no puede insertar lugares',
  $$insert into papudo.places (category_id, slug) select id, 'x' from papudo.categories limit 1$$, '42501');
select tests.eq('anon no ve profiles', (select count(*)::int from papudo.profiles), 0);
select tests.eq('anon no ve audit_log', (select count(*)::int from papudo.audit_log), 0);
select tests.eq('anon no ve el reporte de desactualizados',
  (select count(*)::int from papudo.v_report_stale), 0);
select tests.logout();

-- ── Analítica anónima ────────────────────────────────────────────────────
select tests.login('anon');
insert into papudo.analytics_events (name, properties) values ('place_view', '{"slug":"x"}');
select tests.raises('analítica: evento no permitido',
  $$insert into papudo.analytics_events (name) values ('hackeo')$$, '23514');
select tests.raises('analítica: propiedades enormes',
  $$insert into papudo.analytics_events (name, properties) values ('share', jsonb_build_object('x', repeat('a', 3000)))$$, '23514');
select tests.eq('anon no lee analítica', (select count(*)::int from papudo.analytics_events), 0);
select tests.raises('anon no modifica analítica',
  $$update papudo.analytics_events set name = 'share'$$, '42501');
select tests.logout();

-- ── Itinerarios: solo por token ──────────────────────────────────────────
insert into papudo.itineraries (id, public_token, available_minutes)
  values ('20000000-0000-0000-0000-000000000001', 'tok-vigente', 120);
insert into papudo.itineraries (id, public_token, expires_at)
  values ('20000000-0000-0000-0000-000000000002', 'tok-vencido', now() - interval '1 day');
insert into papudo.itinerary_stops (itinerary_id, place_id, position, explanation) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0, 'Porque sí'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, 'Borrador');
select tests.login('anon');
select tests.raises('anon no lee la tabla itineraries', $$select * from papudo.itineraries$$, '42501');
select tests.eq('token vigente devuelve el itinerario',
  (papudo.get_itinerary_by_token('tok-vigente') ->> 'available_minutes')::int, 120);
select tests.eq('el itinerario omite paradas no publicadas',
  jsonb_array_length(papudo.get_itinerary_by_token('tok-vigente') -> 'stops'), 1);
select tests.eq('token vencido devuelve null',
  papudo.get_itinerary_by_token('tok-vencido') is null, true);
select tests.eq('token inexistente devuelve null',
  papudo.get_itinerary_by_token('nope') is null, true);
select tests.logout();

-- ── Editor ───────────────────────────────────────────────────────────────
select tests.login('authenticated', '00000000-0000-0000-0000-0000000000e1');
select tests.eq('editor ve borradores', (select count(*)::int from papudo.places), 2);
insert into papudo.places (id, category_id, slug)
  select '10000000-0000-0000-0000-000000000003', id, 'nuevo-del-editor' from papudo.categories where slug = 'playas';
select tests.raises('editor no crea contenido ya publicado',
  $$insert into papudo.places (category_id, slug, publication_status)
    select id, 'y', 'published' from papudo.categories limit 1$$, '42501');
select tests.raises('editor no publica',
  $$update papudo.places set publication_status = 'published'
    where id = '10000000-0000-0000-0000-000000000002'$$, '42501');
select tests.raises('editor no archiva',
  $$update papudo.places set publication_status = 'archived'
    where id = '10000000-0000-0000-0000-000000000002'$$, '42501');
select tests.raises('editor no cambia verificación a mano',
  $$update papudo.places set verification_status = 'verified'
    where id = '10000000-0000-0000-0000-000000000002'$$, '42501');
select tests.raises('editor no puede usar verify_entity',
  $$select papudo.verify_entity('place', '10000000-0000-0000-0000-000000000002', 'verified')$$, '42501');
update papudo.places set phone = '+56 9 0000 0000' where id = '10000000-0000-0000-0000-000000000002';
select tests.eq('editor edita contenido',
  (select phone from papudo.places where id = '10000000-0000-0000-0000-000000000002'), '+56 9 0000 0000');
select tests.raises('editor no se asigna un rol',
  $$insert into papudo.profiles (user_id, role) values ('00000000-0000-0000-0000-0000000000c1', 'admin')$$, '42501');
select tests.eq('editor no puede escribir categorías (0 filas)',
  tests.rowcount($$update papudo.categories set icon = 'x'$$), 0);
select tests.raises('editor no escribe en la bitácora',
  $$insert into papudo.audit_log (table_name, row_key, action) values ('a', 'b', 'INSERT')$$, '42501');
select tests.raises('imagen sin texto alternativo',
  $$insert into papudo.place_images (place_id, storage_path, alt_text)
    values ('10000000-0000-0000-0000-000000000002', 'a.jpg', '  ')$$, '23514');
insert into storage.objects (bucket_id, name) values ('papudo-place-images', 'foto.jpg');
select tests.logout();

-- Perfil inactivo: pierde todos los permisos.
select tests.login('authenticated', '00000000-0000-0000-0000-0000000000d1');
select tests.eq('perfil inactivo ve solo lo publicado', (select count(*)::int from papudo.places), 1);
select tests.logout();

-- Visitante autenticado sin perfil (p. ej. alguien con sesión pero sin rol).
select tests.login('authenticated', '00000000-0000-0000-0000-0000000000c1');
select tests.eq('usuario sin rol ve solo lo publicado', (select count(*)::int from papudo.places), 1);
select tests.raises('usuario sin rol no escribe',
  $$insert into papudo.places (category_id, slug) select id, 'z' from papudo.categories limit 1$$, '42501');
select tests.raises('usuario sin rol no sube imágenes',
  $$insert into storage.objects (bucket_id, name) values ('papudo-place-images', 'x.jpg')$$, '42501');
select tests.logout();

-- ── Verificador ──────────────────────────────────────────────────────────
select tests.login('authenticated', '00000000-0000-0000-0000-0000000000b1');
select tests.eq('verificador ve borradores', (select count(*)::int from papudo.places), 3);
select tests.eq('verificador no edita contenido (0 filas)',
  tests.rowcount($$update papudo.places set phone = '1'$$), 0);
select tests.eq('verificador no cambia verificación directo (0 filas)',
  tests.rowcount($$update papudo.places set verification_status = 'verified'$$), 0);
select papudo.verify_entity('place', '10000000-0000-0000-0000-000000000002', 'verified',
  'Visita en terreno', 'https://ejemplo.cl/evidencia');
select tests.eq('verify_entity cambia el estado',
  (select verification_status::text from papudo.places where id = '10000000-0000-0000-0000-000000000002'), 'verified');
select tests.eq('verify_entity fija last_verified_at',
  (select last_verified_at is not null from papudo.places where id = '10000000-0000-0000-0000-000000000002'), true);
select tests.eq('verify_entity deja registro',
  (select count(*)::int from papudo.verification_logs
    where place_id = '10000000-0000-0000-0000-000000000002' and new_status = 'verified'), 1);
select tests.raises('verify_entity: entidad desconocida',
  $$select papudo.verify_entity('cosa', gen_random_uuid(), 'verified')$$, '22023');
select tests.raises('verify_entity: no existe',
  $$select papudo.verify_entity('place', gen_random_uuid(), 'verified')$$, 'P0002');
select tests.raises('verificador no escribe logs a mano',
  $$insert into papudo.verification_logs (place_id, new_status)
    values ('10000000-0000-0000-0000-000000000002', 'verified')$$, '42501');
select tests.logout();

-- ── Administrador: reglas editoriales ────────────────────────────────────
select tests.login('authenticated', '00000000-0000-0000-0000-0000000000a1');
select tests.raises('no se publica sin español',
  $$update papudo.places set publication_status = 'published'
    where id = '10000000-0000-0000-0000-000000000003'$$, '23514');
insert into papudo.place_translations (place_id, locale, name)
  values ('10000000-0000-0000-0000-000000000003', 'es', 'Nuevo del editor');
update papudo.places set publication_status = 'published'
  where id = '10000000-0000-0000-0000-000000000003';
select tests.eq('admin publica con español',
  (select publication_status::text from papudo.places where id = '10000000-0000-0000-0000-000000000003'), 'published');
select tests.eq('al publicar se fija published_at',
  (select published_at is not null from papudo.places where id = '10000000-0000-0000-0000-000000000003'), true);
select tests.raises('una fuente apunta a una sola entidad',
  $$insert into papudo.sources (title) values ('sin entidad')$$, '23514');
insert into papudo.sources (place_id, title, url)
  values ('10000000-0000-0000-0000-000000000003', 'Fuente demo', 'https://ejemplo.cl');
select tests.raises('traducción en español no lleva estado',
  $$insert into papudo.place_translations (place_id, locale, name, translation_status)
    values ('10000000-0000-0000-0000-000000000001', 'es', 'dup', 'draft')$$, null);
select tests.raises('traducción en inglés requiere estado',
  $$insert into papudo.place_translations (place_id, locale, name)
    values ('10000000-0000-0000-0000-000000000001', 'en', 'Beach')$$, '23514');
select tests.logout();

-- Fuente pública solo de lo publicado.
select tests.login('anon');
select tests.eq('anon ve la fuente de un lugar publicado',
  (select count(*)::int from papudo.sources), 1);
select tests.logout();

-- ── Traducciones: marcar "requiere revisión" ─────────────────────────────
insert into papudo.place_translations (place_id, locale, name, translation_status)
  values ('10000000-0000-0000-0000-000000000001', 'en', 'Published beach', 'reviewed');
update papudo.place_translations set short_description = 'Texto nuevo en español'
  where place_id = '10000000-0000-0000-0000-000000000001' and locale = 'es';
select tests.eq('cambiar el español marca el inglés para revisión',
  (select translation_status::text from papudo.place_translations
    where place_id = '10000000-0000-0000-0000-000000000001' and locale = 'en'), 'needs_review');
select tests.login('authenticated', '00000000-0000-0000-0000-0000000000e1');
select tests.eq('el reporte muestra el inglés pendiente de revisión', (
  select english_status from papudo.v_report_translations
  where slug = 'playa-publicada' and entity = 'place'), 'needs_review');
select tests.eq('lugar sin inglés figura como solo español', (
  select english_status from papudo.v_report_translations where slug = 'lugar-borrador'), 'spanish_only');
select tests.logout();

-- ── Auditoría ────────────────────────────────────────────────────────────
select tests.eq('la bitácora registró cambios en places',
  (select count(*)::int > 0 from papudo.audit_log where table_name = 'places'), true);
select tests.eq('la bitácora guarda el diff de verificación', (
  select diff -> 'verification_status' ->> 'new' from papudo.audit_log
  where table_name = 'places' and row_key = '10000000-0000-0000-0000-000000000002'
    and action = 'UPDATE' and diff ? 'verification_status' limit 1), 'verified');

-- ── Reordenar paradas (restricción diferida) ─────────────────────────────
insert into papudo.routes (id, slug) values ('30000000-0000-0000-0000-000000000001', 'ruta-demo');
insert into papudo.route_stops (id, route_id, place_id, position) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1);
update papudo.route_stops set position = 1 - position where route_id = '30000000-0000-0000-0000-000000000001';
select tests.eq('se pueden intercambiar posiciones de paradas',
  (select place_id::text from papudo.route_stops where route_id = '30000000-0000-0000-0000-000000000001' and position = 0),
  '10000000-0000-0000-0000-000000000002');

-- ── Reporte y storage para staff ─────────────────────────────────────────
select tests.login('authenticated', '00000000-0000-0000-0000-0000000000e1');
select tests.eq('staff ve registros sin verificar en el reporte',
  (select count(*)::int > 0 from papudo.v_report_stale), true);
select tests.logout();

rollback;
