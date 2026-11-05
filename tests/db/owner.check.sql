-- Locatarios: enlace personal del local y propuestas que valida el personal.
-- Usa el contenido de supabase/content.sql (Roots Salinas es comercio).
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ab31', 'owner-admin@test'),
  ('00000000-0000-0000-0000-00000000eb31', 'owner-editor@test'),
  ('00000000-0000-0000-0000-00000000cb31', 'owner-ajeno@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ab31', 'admin'),
  ('00000000-0000-0000-0000-00000000eb31', 'editor');

create temporary table owner_t (k text primary key, v text) on commit drop;
grant all on owner_t to anon, authenticated;

-- Nadie fuera del personal genera enlaces.
select tests.login('anon');
select tests.raises('anon no genera enlaces',
  $$select public.create_owner_key((select id from public.places where slug = 'roots-salinas'))$$, '42501');
select tests.logout();
select tests.login('authenticated', '00000000-0000-0000-0000-00000000cb31');
select tests.raises('una cuenta sin rol no genera enlaces',
  $$select public.create_owner_key((select id from public.places where slug = 'roots-salinas'))$$, '42501');
select tests.logout();

-- El editor genera el enlace de un comercio (no de una playa).
select tests.login('authenticated', '00000000-0000-0000-0000-00000000eb31');
select tests.raises('el enlace es solo para comercios',
  $$select public.create_owner_key((select id from public.places where slug = 'playa-papudo'))$$, '22023');
insert into owner_t
  select 'old', public.create_owner_key((select id from public.places where slug = 'roots-salinas'));
insert into owner_t
  select 'key', public.create_owner_key((select id from public.places where slug = 'roots-salinas'));
select tests.eq('el enlace es largo y aleatorio',
  (select length(v) from owner_t where k = 'key'), 48);
select tests.eq('el personal ve que hay un enlace vigente',
  (select count(*)::int from public.owner_key_status((select id from public.places where slug = 'roots-salinas'))), 1);
select tests.logout();

select tests.eq('del enlace solo se guarda la huella',
  (select count(*)::int from private.owner_keys k join owner_t t on k.token_hash = t.v), 0);

-- El locatario entra con su enlace (el anterior quedó cortado).
select tests.login('anon');
select tests.eq('con el enlace ve su local',
  public.owner_session((select v from owner_t where k = 'key')) ->> 'slug', 'roots-salinas');
select tests.eq('ve los datos actuales',
  public.owner_session((select v from owner_t where k = 'key')) #>> '{current,short_description}',
  (select short_description from public.place_translations t join public.places p on p.id = t.place_id
    where p.slug = 'roots-salinas' and t.locale = 'es'));
select tests.eq('generar uno nuevo corta el anterior',
  public.owner_session((select v from owner_t where k = 'old')), null::jsonb);
select tests.eq('un código inventado no entra',
  public.owner_session(repeat('a', 48)), null::jsonb);
select tests.eq('anon no ve las propuestas directo',
  (select count(*)::int from public.place_change_requests), 0);
select tests.raises('anon no inserta propuestas directo',
  $$insert into public.place_change_requests (place_id, changes, submitter_name)
    select id, '{"hours_text":"x"}', 'Spam' from public.places limit 1$$, '42501');

-- Propuestas: validación.
select tests.raises('sin enlace válido no se propone',
  $$select public.submit_owner_proposal(repeat('b', 48), '{"hours_text":"Todos los días"}', 'Ana')$$, '28000');
select tests.raises('no se proponen campos fuera de la lista',
  $$select public.submit_owner_proposal((select v from owner_t where k = 'key'), '{"publication_status":"published"}', 'Ana')$$, '22023');
select tests.raises('el botón va con su valor',
  $$select public.submit_owner_proposal((select v from owner_t where k = 'key'), '{"cta_kind":"whatsapp"}', 'Ana')$$, '22023');
select tests.raises('textos con largo máximo',
  $$select public.submit_owner_proposal((select v from owner_t where k = 'key'),
    jsonb_build_object('short_description', repeat('x', 201)), 'Ana')$$, '22023');
select tests.raises('propuesta vacía no',
  $$select public.submit_owner_proposal((select v from owner_t where k = 'key'), '{}', 'Ana')$$, '22023');

insert into owner_t select 'p1', public.submit_owner_proposal((select v from owner_t where k = 'key'),
  '{"hours_text":"Lunes a domingo, 12:00 a 22:00"}', 'Ana Pérez', 'Horario de verano');
insert into owner_t select 'p2', public.submit_owner_proposal((select v from owner_t where k = 'key'),
  '{"hours_text":"Todos los días, 12:00 a 23:00","cta_kind":"whatsapp","cta_value":"+56 9 8765 4321","short_description":"Churrascos y más frente a Las Salinas."}',
  'Ana Pérez');
select tests.eq('ve su última propuesta pendiente',
  public.owner_session((select v from owner_t where k = 'key')) #>> '{last,status}', 'pending');
select tests.logout();

select tests.eq('la nueva reemplaza a la pendiente anterior',
  (select status::text from public.place_change_requests where id = (select v::uuid from owner_t where k = 'p1')), 'replaced');
select tests.eq('nada se publica sin revisión',
  (select hours_text from public.places where slug = 'roots-salinas') is distinct from 'Todos los días, 12:00 a 23:00', true);

-- Revisión del personal.
select tests.login('authenticated', '00000000-0000-0000-0000-00000000cb31');
select tests.eq('una cuenta sin rol no ve propuestas',
  (select count(*)::int from public.place_change_requests), 0);
select tests.raises('una cuenta sin rol no aprueba',
  $$select public.review_owner_proposal((select v::uuid from owner_t where k = 'p2'), true)$$, '42501');
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000eb31');
select tests.eq('el personal ve las propuestas',
  (select count(*)::int from public.place_change_requests where status = 'pending'), 1);
select public.review_owner_proposal((select v::uuid from owner_t where k = 'p2'), true, 'Revisado por teléfono');
select tests.raises('no se revisa dos veces',
  $$select public.review_owner_proposal((select v::uuid from owner_t where k = 'p2'), false)$$, '22023');
select tests.logout();

select tests.eq('al aprobar se aplica el horario',
  (select hours_text from public.places where slug = 'roots-salinas'), 'Todos los días, 12:00 a 23:00');
select tests.eq('y el botón de WhatsApp',
  (select cta_kind || ' ' || cta_value from public.places where slug = 'roots-salinas'), 'whatsapp +56 9 8765 4321');
select tests.eq('y la descripción corta en español',
  (select short_description from public.place_translations t join public.places p on p.id = t.place_id
    where p.slug = 'roots-salinas' and t.locale = 'es'), 'Churrascos y más frente a Las Salinas.');
select tests.eq('la ficha queda validada y con fecha de actualización',
  (select owner_validated and info_updated_at > now() - interval '1 minute' and managed_in_panel
    from public.places where slug = 'roots-salinas'), true);
select tests.eq('la propuesta queda aprobada con quién y cuándo',
  (select status::text || ' ' || (reviewed_by is not null)::text from public.place_change_requests
    where id = (select v::uuid from owner_t where k = 'p2')), 'approved true');

-- Rechazar no toca la ficha; cortar el enlace deja fuera al locatario.
select tests.login('anon');
insert into owner_t select 'p3', public.submit_owner_proposal((select v from owner_t where k = 'key'),
  '{"website":"https://ejemplo.cl"}', 'Ana Pérez');
select tests.logout();
select tests.login('authenticated', '00000000-0000-0000-0000-00000000ab31');
select public.review_owner_proposal((select v::uuid from owner_t where k = 'p3'), false, 'Ese sitio no es del local');
select tests.eq('rechazar no cambia la ficha',
  (select website is distinct from 'https://ejemplo.cl' from public.places where slug = 'roots-salinas'), true);
select tests.eq('cortar el enlace',
  public.revoke_owner_keys((select id from public.places where slug = 'roots-salinas')), 1);
select tests.logout();
select tests.login('anon');
select tests.eq('con el enlace cortado ya no entra',
  public.owner_session((select v from owner_t where k = 'key')), null::jsonb);
select tests.logout();

rollback;
