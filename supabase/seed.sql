-- Datos iniciales. SOLO catálogo y municipio: nada de lugares ni negocios.
-- Los lugares reales se cargan desde CSV con fuente y fecha (docs/PLAN.md Fase 3).
-- Se puede ejecutar varias veces.

insert into public.municipality (name, slug, map_center_lat, map_center_lng, map_default_zoom)
values ('Municipalidad de Papudo', 'papudo', -32.512, -71.449, 14)
on conflict (id) do nothing;
-- map_center_*: centro APROXIMADO para encuadrar el mapa. No es una coordenada
-- oficial ni de ningún establecimiento; ajustar con la municipalidad.

insert into public.municipality_translations (locale, description, translation_status) values
  ('es', 'Guía turística de la comuna de Papudo.', null),
  ('en', 'Tourist guide to the commune of Papudo.', 'draft')
on conflict (locale) do nothing;

-- Categorías (raíz)
with c(slug, icon, sort_order, es, en) as (values
  ('playas', 'beach', 1, 'Playas', 'Beaches'),
  ('patrimonio', 'landmark', 2, 'Patrimonio', 'Heritage'),
  ('gastronomia', 'utensils', 3, 'Gastronomía', 'Food'),
  ('alojamiento', 'bed', 4, 'Alojamiento', 'Stay'),
  ('naturaleza', 'leaf', 5, 'Naturaleza', 'Nature'),
  ('actividades', 'activity', 6, 'Actividades', 'Activities'),
  ('comercio-local', 'store', 7, 'Comercio local', 'Local shops'),
  ('miradores', 'eye', 8, 'Miradores', 'Viewpoints'),
  ('ferias-mercados', 'shopping-basket', 9, 'Ferias y mercados', 'Fairs and markets'),
  ('servicios', 'info', 10, 'Servicios útiles', 'Useful services')
), ins as (
  insert into public.categories (slug, icon, sort_order)
  select slug, icon, sort_order from c
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.category_translations (category_id, locale, name, translation_status)
select cat.id, l.locale, case l.locale when 'es' then c.es else c.en end,
       case l.locale when 'es' then null else 'draft'::public.translation_status end
from c
join public.categories cat on cat.slug = c.slug
cross join (values ('es'::public.locale), ('en'::public.locale)) as l(locale)
on conflict (category_id, locale) do nothing;

-- Subcategorías de alojamiento (tipos genéricos, no establecimientos)
with s(slug, sort_order, es, en) as (values
  ('hoteles', 1, 'Hoteles', 'Hotels'),
  ('cabanas', 2, 'Cabañas', 'Cabins'),
  ('hostales', 3, 'Hostales', 'Hostels'),
  ('camping', 4, 'Camping', 'Camping')
), ins as (
  insert into public.categories (slug, parent_id, sort_order)
  select s.slug, (select id from public.categories where slug = 'alojamiento'), s.sort_order from s
  on conflict (slug) do nothing
  returning id
)
insert into public.category_translations (category_id, locale, name, translation_status)
select cat.id, l.locale, case l.locale when 'es' then s.es else s.en end,
       case l.locale when 'es' then null else 'draft'::public.translation_status end
from s
join public.categories cat on cat.slug = s.slug
cross join (values ('es'::public.locale), ('en'::public.locale)) as l(locale)
on conflict (category_id, locale) do nothing;

-- Etiquetas / características
with t(slug, es, en) as (values
  ('apto-ninos', 'Apto para niños', 'Child-friendly'),
  ('acepta-mascotas', 'Acepta mascotas', 'Pets welcome'),
  ('accesible', 'Accesible', 'Accessible'),
  ('entrada-gratuita', 'Entrada gratuita', 'Free entry'),
  ('requiere-reserva', 'Requiere reserva', 'Reservation required'),
  ('estacionamiento', 'Estacionamiento', 'Parking'),
  ('banos', 'Baños', 'Restrooms'),
  ('todo-el-ano', 'Abierto todo el año', 'Open all year'),
  ('cobertura-limitada', 'Cobertura telefónica limitada', 'Limited phone coverage')
), ins as (
  insert into public.tags (slug) select slug from t on conflict (slug) do nothing returning id
)
insert into public.tag_translations (tag_id, locale, name, translation_status)
select tg.id, l.locale, case l.locale when 'es' then t.es else t.en end,
       case l.locale when 'es' then null else 'draft'::public.translation_status end
from t
join public.tags tg on tg.slug = t.slug
cross join (values ('es'::public.locale), ('en'::public.locale)) as l(locale)
on conflict (tag_id, locale) do nothing;
