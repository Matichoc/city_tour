-- Comercios: botón de acción, avisos con vigencia y configuración del sitio.
-- Usa el contenido de supabase/content.sql.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ab01', 'biz-admin@test'),
  ('00000000-0000-0000-0000-00000000eb01', 'biz-editor@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ab01', 'admin'),
  ('00000000-0000-0000-0000-00000000eb01', 'editor');

select tests.raises('el botón web exige un enlace http',
  $$update public.places set cta_kind = 'menu', cta_value = 'javascript:alert(1)' where slug = 'playa-papudo'$$, '23514');
select tests.raises('tipo y valor van juntos',
  $$update public.places set cta_kind = 'phone' where slug = 'playa-papudo'$$, '23514');

select tests.login('authenticated', '00000000-0000-0000-0000-00000000eb01');
select tests.eq('editor fija el botón de WhatsApp',
  tests.rowcount($$update public.places set cta_kind = 'whatsapp', cta_value = '+56 9 1234 5678'
    where slug = 'playa-papudo'$$), 1);
insert into public.notices (place_id, title, ends_at)
  select id, 'Aviso vigente', now() + interval '7 days' from public.places where slug = 'playa-papudo';
insert into public.notices (title, starts_at, ends_at)
  values ('Aviso vencido', now() - interval '10 days', now() - interval '1 day');
insert into public.notices (title, ends_at, active)
  values ('Aviso desactivado', now() + interval '7 days', false);
select tests.eq('editor no cambia la configuración (0 filas)',
  tests.rowcount($$update public.site_settings set business_invite = false$$), 0);
select tests.logout();

select tests.login('anon');
select tests.eq('anon ve el botón de acción',
  (select cta_kind from public.places where slug = 'playa-papudo'), 'whatsapp');
select tests.eq('anon ve solo avisos vigentes y activos',
  (select string_agg(title, ',') from public.notices), 'Aviso vigente');
select tests.raises('anon no crea avisos',
  $$insert into public.notices (title, ends_at) values ('spam', now() + interval '1 day')$$, '42501');
select tests.eq('anon lee la configuración',
  (select business_invite from public.site_settings), true);
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000ab01');
select tests.eq('admin cambia la configuración',
  tests.rowcount($$update public.site_settings set business_form_url = 'https://forms.gle/abc', business_invite = false$$), 1);
select tests.eq('staff ve todos los avisos',
  (select count(*)::int from public.notices), 3);
select tests.logout();

select tests.raises('el aviso no puede terminar antes de empezar',
  $$insert into public.notices (title, starts_at, ends_at) values ('x x', now(), now() - interval '1 hour')$$, '23514');

rollback;
