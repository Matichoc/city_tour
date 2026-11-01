-- Fichas del panel: contacto interno privado, publicación solo por admin y
-- datos de importación. Usa el contenido de supabase/content.sql.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ad01', 'panel-admin@test'),
  ('00000000-0000-0000-0000-00000000ed01', 'panel-editor@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin'),
  ('00000000-0000-0000-0000-00000000ed01', 'editor');

create temp table t (id uuid);
grant all on t to anon, authenticated;

-- El editor crea la ficha en borrador y su contacto interno.
select tests.login('authenticated', '00000000-0000-0000-0000-00000000ed01');
insert into public.places (slug, category_id, is_business, managed_in_panel, import_key, import_snapshot, hours_text)
  select 'casa-del-mar', id, true, true, 'casa-del-mar', '{"name":"Casa del Mar"}'::jsonb, 'Todos los días 10 a 20'
  from public.categories where slug = 'alojamiento';
insert into public.place_translations (place_id, locale, name, short_description)
  select id, 'es', 'Casa del Mar', 'Cabañas frente al mar' from public.places where slug = 'casa-del-mar';
insert into public.place_contacts (place_id, name, email)
  select id, 'Ana', 'ana@ejemplo.cl' from public.places where slug = 'casa-del-mar';
select tests.raises('un editor no publica',
  $$update public.places set publication_status = 'published' where slug = 'casa-del-mar'$$, '42501');
select tests.raises('un mismo correo no se repite en la misma ficha',
  $$insert into public.place_contacts (place_id, email) select id, 'ana@ejemplo.cl' from public.places where slug = 'casa-del-mar'$$, '23505');
select tests.raises('el registro SERNATUR va con su vigencia',
  $$update public.places set sernatur_number = '93605' where slug = 'casa-del-mar'$$, '23514');
select tests.logout();

-- El público no ve ni la ficha en borrador ni el contacto.
select tests.login('anon');
select tests.eq('anon no ve el borrador',
  (select count(*)::int from public.places where slug = 'casa-del-mar'), 0);
select tests.raises('anon no lee contactos', $$select email from public.place_contacts$$, '42501');
select tests.logout();

-- El admin publica; el contacto sigue privado.
select tests.login('authenticated', '00000000-0000-0000-0000-00000000ad01');
select tests.eq('el admin ve el contacto',
  (select count(*)::int from public.place_contacts), 1);
select tests.eq('el admin publica',
  tests.rowcount($$update public.places set publication_status = 'published' where slug = 'casa-del-mar'$$), 1);
select tests.logout();

select tests.login('anon');
select tests.eq('anon ve la ficha publicada y su horario escrito',
  (select hours_text from public.places where slug = 'casa-del-mar'), 'Todos los días 10 a 20');
select tests.eq('la clave de importación es única',
  (select count(*)::int from public.places where import_key = 'casa-del-mar'), 1);
select tests.eq('anon no cambia la planilla de importación (0 filas)',
  tests.rowcount($$update public.site_settings set import_sheet_url = 'https://docs.google.com/spreadsheets/d/x'$$), 0);
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000ad01');
select tests.raises('solo se aceptan planillas de Google',
  $$update public.site_settings set import_sheet_url = 'https://evil.com/x'$$, '23514');
select tests.eq('el admin guarda la planilla',
  tests.rowcount($$update public.site_settings set import_sheet_url = 'https://docs.google.com/spreadsheets/d/1abc'$$), 1);
select tests.logout();

rollback;
