-- PRIV-01: el snapshot de importación (import_snapshot) no se lee en público.
-- Contención: el rol anónimo no tiene SELECT sobre esa columna, y sigue
-- leyendo todo lo demás de `places` que usa el sitio público.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000bb01', 'priv-editor@test'),
  ('00000000-0000-0000-0000-00000000bb02', 'priv-sin-rol@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000bb01', 'editor');

-- Un comercio publicado con datos personales de prueba en su snapshot.
insert into public.places (slug, category_id, is_business, managed_in_panel, import_key,
                           import_snapshot)
  select 'priv-comercio', id, true, true, 'priv-comercio',
         '{"name":"Comercio","contactName":"Persona Prueba","contactEmail":"persona@prueba.test"}'::jsonb
  from public.categories where slug = 'alojamiento';
insert into public.place_translations (place_id, locale, name, short_description)
  select id, 'es', 'Comercio', 'Descripción' from public.places where slug = 'priv-comercio';
update public.places set publication_status = 'published' where slug = 'priv-comercio';

select tests.login('anon');
select tests.raises('anon no lee import_snapshot',
  $$select import_snapshot from public.places$$, '42501');
select tests.raises('anon no lo saca por una expresión sobre la columna',
  $$select import_snapshot ->> 'contactEmail' from public.places$$, '42501');
select tests.raises('anon no lo saca con select *',
  $$select * from public.places$$, '42501');
select tests.raises('anon no filtra por su contenido',
  $$select slug from public.places where import_snapshot ? 'contactEmail'$$, '42501');

-- Lo que usa el sitio público (columnas de content-source.ts) sigue funcionando.
select tests.eq('anon sigue leyendo las columnas públicas de la ficha',
  (select count(*)::int from (
     select slug, latitude, longitude, address, is_demo, is_business, verification_status,
            cta_kind, cta_value, last_verified_at, info_updated_at, instagram, maps_url,
            sernatur_number, sernatur_valid_until, hours_text, website, owner_validated,
            category_id, locality_id, import_key
     from public.places where publication_status = 'published' and slug = 'priv-comercio') s), 1);
select tests.eq('anon sigue leyendo las traducciones de lo publicado (política con subconsulta)',
  (select count(*)::int from public.place_translations where place_id in
     (select id from public.places where slug = 'priv-comercio')), 1);
select tests.logout();

-- Guarda para el futuro: si una migración agrega una columna a `places`, debe
-- darle `grant select (columna) on public.places to anon` (o ser privada).
select tests.eq('toda columna de places, salvo import_snapshot, es legible por anon',
  (select coalesce(string_agg(attname, ', '), '') from pg_attribute
   where attrelid = 'public.places'::regclass and attnum > 0 and not attisdropped
     and attname <> 'import_snapshot'
     and not has_column_privilege('anon', 'public.places', attname, 'select')), '');
select tests.eq('import_snapshot no es legible por anon',
  has_column_privilege('anon', 'public.places', 'import_snapshot', 'select'), false);

-- El personal (importador y panel) sigue leyéndolo.
select tests.login('authenticated', '00000000-0000-0000-0000-00000000bb01');
select tests.eq('el editor lee import_snapshot (lo necesita la importación)',
  (select import_snapshot ->> 'name' from public.places where slug = 'priv-comercio'), 'Comercio');
select tests.logout();

-- 0026: el contacto de la importación vive en una tabla solo para personal.
select tests.login('authenticated', '00000000-0000-0000-0000-00000000bb01');
insert into public.place_import_private (place_id, contact)
  select id, '{"contactName":"Persona Prueba","contactEmail":"persona@prueba.test"}'::jsonb
  from public.places where slug = 'priv-comercio';
select tests.eq('el editor guarda y lee el contacto privado',
  (select contact ->> 'contactEmail' from public.place_import_private), 'persona@prueba.test');
select tests.logout();

select tests.login('anon');
select tests.raises('anon no lee el contacto privado',
  $$select contact from public.place_import_private$$, '42501');
select tests.raises('anon no escribe el contacto privado',
  $$insert into public.place_import_private (place_id) select id from public.places limit 1$$, '42501');
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000bb02');
select tests.eq('un usuario sin rol no ve el contacto privado',
  (select count(*)::int from public.place_import_private), 0);
select tests.raises('un usuario sin rol no lo escribe',
  $$insert into public.place_import_private (place_id) select id from public.places limit 1$$, '42501');
select tests.logout();

select tests.eq('la tabla privada no tiene trigger de auditoría (copiaría el contacto a audit_log)',
  (select count(*)::int from pg_trigger
   where tgrelid = 'public.place_import_private'::regclass and not tgisinternal), 0);

rollback;
