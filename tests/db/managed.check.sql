-- Se corre DESPUÉS de editar a mano una ficha del repo (managed_in_panel) y de
-- volver a cargar supabase/content.sql: esa ficha no debe haberse pisado.
begin;
select tests.eq('content.sql no pisa los textos de una ficha del panel',
  (select short_description from public.place_translations t
   join public.places p on p.id = t.place_id where p.slug = 'playa-papudo' and t.locale = 'es'),
  'EDITADA EN EL PANEL');
select tests.eq('ni su dirección',
  (select address from public.places where slug = 'playa-papudo'), 'Dirección editada');
select tests.eq('pero sí actualiza las demás fichas del repo',
  (select short_description <> 'EDITADA EN EL PANEL' from public.place_translations t
   join public.places p on p.id = t.place_id where p.slug = 'playa-chica-papudo' and t.locale = 'es'), true);
rollback;
