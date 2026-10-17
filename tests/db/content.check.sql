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
rollback;
