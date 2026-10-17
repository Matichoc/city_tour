-- Datos iniciales. SOLO catálogo y municipio: nada de lugares ni negocios.
-- El contenido del sitio (lugares, eventos, rutas, localidades) está en
-- supabase/content.sql, generado desde src/content (pnpm db:content).
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

-- Categorías = productos turísticos del PLADETUR de Papudo (iD, 2023, p. 136)
-- más alojamiento, que es un servicio. Deben coincidir con
-- src/content/catalog.ts (lo comprueba tests/unit/content-sql.test.ts).
-- Minutos de visita ESTIMADOS para el motor de recorridos.
with c(slug, sort_order, minutes, es, en, pt) as (values
  ('balneario', 1, 90, 'Balneario', 'Seaside', 'Balneário'),
  ('recreacion', 2, 90, 'Recreación', 'Recreation', 'Recreação'),
  ('deportes', 3, 90, 'Deportes', 'Sports', 'Esportes'),
  ('patrimonio', 4, 30, 'Cultura y patrimonio', 'Culture & heritage', 'Cultura e patrimônio'),
  ('gastronomia', 5, 60, 'Gastronomía', 'Food', 'Gastronomia'),
  ('ruralidad', 6, 60, 'Campo y ruralidad', 'Countryside', 'Campo e ruralidade'),
  ('alojamiento', 7, 0, 'Alojamiento', 'Stay', 'Hospedagem')
), ins as (
  insert into public.categories (slug, sort_order, default_visit_minutes)
  select slug, sort_order, minutes from c
  on conflict (slug) do update
    set sort_order = excluded.sort_order,
        default_visit_minutes = excluded.default_visit_minutes,
        parent_id = null
  returning id, slug
)
insert into public.category_translations (category_id, locale, name, translation_status)
select cat.id, l.locale,
       case l.locale when 'es' then c.es when 'en' then c.en else c.pt end,
       case l.locale when 'es' then null else 'draft'::public.translation_status end
from c
join public.categories cat on cat.slug = c.slug
cross join (values ('es'::public.locale), ('en'::public.locale), ('pt'::public.locale)) as l(locale)
on conflict (category_id, locale) do update set name = excluded.name;

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
