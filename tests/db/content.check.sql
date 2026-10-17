-- Después de cargar supabase/content.sql: el contenido quedó publicado,
-- pendiente de verificación y visible para un visitante anónimo.
begin;
select tests.eq('ningún contenido cargado aparece verificado',
  (select count(*)::int from public.places where verification_status <> 'pending'), 0);
select tests.eq('todo lugar publicado tiene ficha en español',
  (select count(*)::int from public.places p where publication_status = 'published'
     and not exists (select 1 from public.place_translations t where t.place_id = p.id and t.locale = 'es')), 0);
select tests.eq('las fichas de ejemplo quedan marcadas',
  (select count(*)::int > 0 from public.places where is_demo and slug like 'demo-%'), true);
select tests.eq('ningún lugar real quedó marcado como ejemplo',
  (select count(*)::int from public.places where is_demo and slug not like 'demo-%'), 0);
select tests.eq('hay traducciones al portugués',
  (select count(*)::int > 0 from public.place_translations where locale = 'pt'), true);
select tests.eq('cada evento tiene categoría',
  (select count(*)::int from public.events where category_id is null), 0);
select tests.login('anon', null);
select tests.eq('anon ve la ruta costera con sus paradas',
  (select count(*)::int > 0 from public.route_stops s join public.routes r on r.id = s.route_id
     where r.slug = 'ruta-costera-papudo'), true);
select tests.eq('anon ve eventos',
  (select count(*)::int > 0 from public.events), true);
select tests.logout();
-- Datos entregados por un comercio (Roots Salinas): horarios por temporada,
-- Instagram, enlace de Maps, botón de WhatsApp y fecha de actualización.
select tests.login('anon');
select tests.eq('horarios por temporada (7 días en verano + sáb y dom el resto)',
  (select count(*)::int from public.place_hours h join public.places p on p.id = h.place_id
   where p.slug = 'roots-salinas'), 9);
select tests.eq('festivos en temporada baja',
  (select bool_and(holidays) from public.place_hours h join public.places p on p.id = h.place_id
   where p.slug = 'roots-salinas' and from_month = 3), true);
select tests.eq('Instagram, Maps y WhatsApp del local',
  (select instagram || ' ' || maps_url || ' ' || cta_kind from public.places where slug = 'roots-salinas'),
  'https://www.instagram.com/roots.salinas/ https://maps.app.goo.gl/ephntUVKSy3yhpAN7 whatsapp');
select tests.eq('logo, carta y dos promociones del local, en orden',
  (select string_agg(kind, ',' order by position) from public.place_images i
   join public.places p on p.id = i.place_id where p.slug = 'roots-salinas'), 'logo,menu,promo,promo');
select tests.eq('registro SERNATUR informado por el local',
  (select sernatur_number || ' ' || sernatur_valid_until from public.places where slug = 'roots-salinas'),
  '93605 2027-01-31');
select tests.eq('fecha en que el local confirmó sus datos',
  (select info_updated_at = '2026-10-17T03:53:04Z' from public.places where slug = 'roots-salinas'), true);
select tests.logout();

rollback;
