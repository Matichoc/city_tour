-- GENERADO desde src/content con `pnpm db:content`. No editar a mano.
-- Carga en Supabase el contenido que hoy muestra el sitio. Requiere las
-- migraciones hasta 0024 y supabase/seed.sql. Se puede ejecutar varias veces.
-- El repo manda sobre sus fichas, salvo las que se crearon o editaron en el
-- panel (managed_in_panel): esas no se tocan.
begin;

-- Localidades
insert into public.localities (slug, latitude, longitude, sort_order, source_url, source_label) values
  ('papudo', -32.506887299999995, -71.445776, 1, 'https://www.munipapudo.cl', 'Guía Turística Papudo 2026 — Municipalidad de Papudo'),
  ('pullally', -32.4330819, -71.32377009999999, 2, 'https://www.munipapudo.cl', 'Guía Turística Papudo 2026 — Municipalidad de Papudo'),
  ('las-salinas-papudo', -32.411236599999995, -71.4108425, 3, 'https://www.munipapudo.cl', 'Guía Turística Papudo 2026 — Municipalidad de Papudo')
on conflict (slug) do update set
  latitude = excluded.latitude, longitude = excluded.longitude, sort_order = excluded.sort_order,
  source_url = excluded.source_url, source_label = excluded.source_label;

delete from public.locality_translations
  where locality_id in (select id from public.localities where slug in ('papudo', 'pullally', 'las-salinas-papudo'));
insert into public.locality_translations (locality_id, locale, name, summary, translation_status)
select l.id, v.locale::public.locale, v.name, v.summary, v.status::public.translation_status
from (values
  ('papudo', 'es', 'Papudo', 'Fundado en 1857, es uno de los balnearios más tradicionales de la Región de Valparaíso. Mezcla un pasado ilustre —lo visitaron Arturo Prat y el expresidente Manuel Montt, y Pedro de Valdivia lo describió como «el paraíso de Dios»— con una vida costera vibrante. Está a 170 km de Santiago por la Ruta 5 Norte y a 82 km de Viña del Mar y Valparaíso por el camino costero, donde la cordillera de la costa se encuentra con el mar.', null),
  ('papudo', 'en', 'Papudo', 'Seat of the Papudo commune (6,356 inhabitants, 2017 Census), a seaside resort with the pedestrian promenade La Terraza, which runs along Playa Chica and Playa Grande and is the town''s gathering place in summer.', 'draft'),
  ('pullally', 'es', 'Pullally', 'A 18 km al oriente de Papudo, Pullally tiene un profundo arraigo rural y tradiciones campesinas ligadas a la vocación agropecuaria de la zona. Su parque, el bosque relicto de olivillos y las ruinas de la ex Hacienda cuentan su historia, y sus fiestas, ferias y las carreras a la chilena en El Llano mantienen viva la tradición.', null),
  ('pullally', 'en', 'Pullally', 'It gives its name to the Salinas de Pullally wetland, a Nature Sanctuary that extends alongside the Longotoma dunes, between La Ligua and Papudo.', 'draft'),
  ('las-salinas-papudo', 'es', 'Las Salinas', 'A 12 km al norte de Papudo, Las Salinas es un poblado rural y costero para una experiencia de playa más auténtica, lejos del bullicio. Su caleta reúne a los pescadores y sus mariscos frescos, y su playa es ideal para dar las primeras olas en surf. El camino es un circuito de agroturismo entre dunas, caseríos y cultivos de alfalfa, quinua, frutillas y maíz.', null),
  ('las-salinas-papudo', 'en', 'Las Salinas', 'Rural village 12 km from the beach, with families dedicated to farming and a small artisanal fishing cove at the mouth of the La Ligua River. Chango archaeological remains have been found in the Salinas de Pullally dunes.', 'draft')
) as v(slug, locale, name, summary, status)
join public.localities l on l.slug = v.slug;

-- Lugares (se crean en borrador y se publican al final, con su ficha en español)
insert into public.places (slug, sort_order, category_id, locality_id, latitude, longitude, address, is_demo, is_business, instagram, maps_url, sernatur_number, sernatur_valid_until, owner_validated)
select v.slug, v.sort_order, c.id, l.id, v.lat::numeric, v.lng::numeric, v.address, v.is_demo, v.is_business, v.instagram, v.maps_url, v.sernatur, v.sernatur_until::date, v.owner_validated
from (values
  ('playa-papudo', 1, 'balneario', 'papudo', -32.5061, -71.4472, null, false, false, null, null, null, null, false),
  ('playa-chica-papudo', 2, 'balneario', 'papudo', -32.5075, -71.4478, null, false, false, null, null, null, null, false),
  ('papudo-pullally', 3, 'ruralidad', 'pullally', -32.43467097116685, -71.31775915116937, null, false, false, null, null, null, null, false),
  ('papudo-salinas-pullally', 4, 'ruralidad', 'las-salinas-papudo', -32.41007831226611, -71.41062008860503, null, false, false, null, null, null, null, false),
  ('roots-salinas', 5, 'gastronomia', 'las-salinas-papudo', -32.4163125, -71.4118125, 'Estacionamiento de la playa Salinas de Pullally, Las Salinas', false, true, 'https://www.instagram.com/roots.salinas/', 'https://maps.app.goo.gl/ephntUVKSy3yhpAN7', '93605', '2027-01-31', true),
  ('papudo-playa-los-lilenes', 6, 'balneario', null, -32.49109919617068, -71.4326761566141, null, false, false, null, null, null, null, false),
  ('papudo-parque', 7, 'recreacion', 'papudo', -32.50461851619594, -71.44310276706875, null, false, false, null, null, null, null, false),
  ('papudo-plaza', 8, 'patrimonio', 'papudo', -32.50745877114493, -71.44604956690678, null, false, false, null, null, null, null, false),
  ('iglesia-nuestra-senora-de-las-mercedes', 9, 'patrimonio', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('humedal-urbano-estero-agua-salada', 10, 'recreacion', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('caleta-de-pescadores-papudo', 11, 'gastronomia', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('restaurante-donde-pablo', 12, 'gastronomia', 'papudo', null, null, 'Av. Glorias Navales 511, Papudo', false, true, null, null, null, null, false),
  ('fuente-papudo', 13, 'gastronomia', 'papudo', null, null, null, false, true, null, null, null, null, false),
  ('hotel-carande', 14, 'alojamiento', 'papudo', null, null, 'Chorrillos 89, Papudo', false, true, null, null, null, null, false),
  ('playa-grande-papudo', 15, 'balneario', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('playa-espejito', 16, 'balneario', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('playa-las-playillas', 17, 'balneario', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('playa-de-los-changos', 18, 'balneario', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('quebrada-del-maqui', 19, 'deportes', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('quebrada-del-frances', 20, 'deportes', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('templo-san-pedro-pescador', 21, 'patrimonio', 'papudo', null, null, 'Víctor Fazzio 1005, Papudo', false, false, null, null, null, null, false),
  ('edificio-consistorial', 22, 'patrimonio', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('chalet-recart', 23, 'patrimonio', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('gruta-virgen-de-lourdes', 24, 'patrimonio', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('parque-de-pullally', 25, 'ruralidad', 'pullally', null, null, null, false, false, null, null, null, null, false),
  ('la-casona-pullally', 26, 'patrimonio', 'pullally', null, null, null, false, false, null, null, null, null, false),
  ('la-santita-pullally', 27, 'patrimonio', 'pullally', null, null, null, false, false, null, null, null, null, false),
  ('el-llano-pullally', 28, 'recreacion', 'pullally', null, null, null, false, false, null, null, null, null, false),
  ('bosque-relicto-de-olivillos', 29, 'ruralidad', 'pullally', null, null, null, false, false, null, null, null, null, false),
  ('dunas-las-salinas', 30, 'ruralidad', 'las-salinas-papudo', null, null, null, false, false, null, null, null, null, false),
  ('cabalgatas-lilen', 31, 'recreacion', 'papudo', null, null, null, false, true, 'https://www.instagram.com/cabalgataslilen.papudo/', null, null, null, false),
  ('pintarroja-dive-center', 32, 'deportes', 'papudo', null, null, 'Riquelme 431, Papudo', false, true, 'https://www.instagram.com/pintarrojadivecenter/', null, null, null, false),
  ('gorgonia-expediciones', 33, 'deportes', 'papudo', null, null, null, false, true, 'https://www.instagram.com/gorgoniaexpediciones/', null, null, null, false),
  ('intemperie-turismo', 34, 'deportes', 'papudo', null, null, 'Av. Irarrázaval s/n, a un costado del Chalet Recart, Papudo', false, true, null, null, null, null, false),
  ('la-vasija-de-sol', 35, 'recreacion', 'papudo', null, null, null, false, true, null, null, null, null, false),
  ('arriendo-de-kayak-papudo', 36, 'deportes', 'papudo', null, null, 'Av. Irarrázaval 86, Papudo', false, true, null, null, null, null, false),
  ('empopado', 37, 'deportes', 'papudo', null, null, null, false, true, 'https://www.instagram.com/Empopado/', null, null, null, false),
  ('buenaventura-paseos-en-lancha', 38, 'recreacion', 'papudo', null, null, 'Av. Irarrázaval s/n, costanera frente a Playa Chica, Papudo', false, true, 'https://www.instagram.com/josevalebuenaventura.xzx/', null, null, null, false),
  ('awkan-ecoturismo', 39, 'deportes', 'papudo', null, null, 'Riveros 775, Papudo', false, true, 'https://www.instagram.com/awkan.ecoturismo/', null, null, null, false),
  ('feria-artesanal-manos-papudanas', 40, 'patrimonio', 'papudo', null, null, 'Costanera de Playa Chica, Papudo', false, false, null, null, null, null, false),
  ('feria-de-verduras-papudo', 41, 'gastronomia', 'papudo', null, null, null, false, false, null, null, null, null, false),
  ('feria-artesanal-espacio-parque', 42, 'patrimonio', 'papudo', null, null, 'Parque Municipal, Playa Grande, Papudo', false, false, null, null, null, null, false),
  ('feria-artesanal-el-lilen', 43, 'patrimonio', 'papudo', null, null, 'Costanera de Playa Grande, Papudo', false, false, null, null, null, null, false),
  ('escuela-de-surf-salinas-experience', 44, 'deportes', 'las-salinas-papudo', null, null, 'Playa Las Salinas', false, true, null, null, null, null, false),
  ('escuela-de-surf-salinas-de-pullally', 45, 'deportes', 'las-salinas-papudo', null, null, 'Playa Las Salinas', false, true, null, null, null, null, false),
  ('feria-de-productores-pullally', 46, 'ruralidad', 'pullally', null, null, 'Av. Las Salinas con 3 Oriente, Pullally', false, false, null, null, null, null, false),
  ('feria-de-emprendedores-pullally', 47, 'ruralidad', 'pullally', null, null, 'Ruinas ex Hacienda, Pullally', false, false, null, null, null, null, false),
  ('viveros-las-camelias', 48, 'ruralidad', 'pullally', null, null, 'Av. Las Salinas, sector ruinas, Pullally', false, true, null, null, null, null, false),
  ('il-gabbiano', 49, 'gastronomia', 'papudo', null, null, 'Chorrillos 183, Papudo', false, true, 'https://www.instagram.com/ilgabbiano7_restoranhostal/', null, null, null, false),
  ('la-roca', 50, 'gastronomia', 'papudo', null, null, 'Chorrillos 149, Papudo', false, true, 'https://www.instagram.com/Larocapapudo/', null, null, null, false),
  ('la-canita', 51, 'gastronomia', 'papudo', null, null, 'Av. El Estero 211, local 11, Papudo', false, true, 'https://www.instagram.com/Lacanita_pp2/', null, null, null, false),
  ('mamma-mia-papudo', 52, 'gastronomia', 'papudo', null, null, 'D. Fernández Concha 502, Papudo', false, true, 'https://www.instagram.com/mamma.mia.papudo/', null, null, null, false),
  ('la-plaza-restaurante', 53, 'gastronomia', 'papudo', null, null, 'Chorrillos 119, Papudo', false, true, 'https://www.instagram.com/rest.laplaza/', null, null, null, false),
  ('mar-de-luna', 54, 'gastronomia', 'papudo', null, null, 'Chorrillos 107, Papudo', false, true, 'https://www.instagram.com/Mardelunarestaurante/', null, null, null, false),
  ('club-de-yates-papudo', 55, 'gastronomia', 'papudo', null, null, 'Irarrázaval 0201, Papudo', false, true, 'https://www.instagram.com/elclubpapudo/', null, null, null, false),
  ('casa-rivera', 56, 'gastronomia', 'papudo', null, null, 'Miraflores 112, Papudo', false, true, 'https://www.instagram.com/casariverapapudo/', null, null, null, false),
  ('restaurante-rompe-olas', 57, 'gastronomia', 'papudo', null, null, 'Chorrillos 157, Papudo', false, true, null, null, null, null, false),
  ('la-grota', 58, 'gastronomia', 'papudo', null, null, 'Esmeralda 296, Papudo', false, true, 'https://www.instagram.com/lagrottapapudo/', null, null, null, false),
  ('casa-conaripe', 59, 'gastronomia', 'papudo', null, null, 'D. Fernández Concha 525, Papudo', false, true, 'https://www.instagram.com/casa_conaripe/', null, null, null, false),
  ('la-catita', 60, 'gastronomia', 'papudo', null, null, 'Víctor Fazio Rigazzi 1051, Papudo', false, true, 'https://www.instagram.com/restaurante.lacatita/', null, null, null, false),
  ('el-torres', 61, 'gastronomia', 'papudo', null, null, 'Miraflores 88, Papudo', false, true, 'https://www.instagram.com/eltorresoficial/', null, null, null, false),
  ('sunshine-sushi', 62, 'gastronomia', 'papudo', null, null, 'Miraflores 186, Papudo', false, true, 'https://www.instagram.com/sunshinesushi/', null, null, null, false),
  ('banana-papudo', 63, 'gastronomia', 'papudo', null, null, 'Av. Irarrázaval 86, Papudo', false, true, null, null, null, null, false),
  ('tocato', 64, 'gastronomia', 'papudo', null, null, 'Miraflores 210, Papudo', false, true, 'https://www.instagram.com/nostocatodos/', null, null, null, false),
  ('bahia-lilen', 65, 'gastronomia', 'papudo', null, null, 'Cochrane 184, Papudo', false, true, 'https://www.instagram.com/bahialilen/', null, null, null, false),
  ('gran-azul', 66, 'gastronomia', 'papudo', null, null, 'Av. Irarrázaval 86, Papudo', false, true, null, null, null, null, false),
  ('puerto-madero-papudo', 67, 'gastronomia', 'papudo', null, null, 'Av. Irarrázaval 88, Papudo', false, true, null, null, null, null, false),
  ('burgazo', 68, 'gastronomia', 'papudo', null, null, 'D. Fernández Concha 210, Papudo', false, true, 'https://www.instagram.com/burgazo.cl/', null, null, null, false),
  ('papudoretro', 69, 'gastronomia', 'papudo', null, null, 'Irarrázaval 55, locales 8 y 9, Papudo', false, true, 'https://www.instagram.com/papudoretro/', null, null, null, false),
  ('la-casa-de-cesar', 70, 'gastronomia', 'papudo', null, null, 'D. Fernández Concha con Chorrillos, Papudo', false, true, 'https://www.instagram.com/la_casa_de_cesar_papudo/', null, null, null, false),
  ('la-maison-des-fous', 71, 'gastronomia', 'papudo', null, null, 'Blanco 132, Papudo', false, true, 'https://www.instagram.com/lamaisondesfouspapudo/', null, null, null, false),
  ('casa-hidalgo', 72, 'gastronomia', 'papudo', null, null, 'Chorrillos 157, Papudo', false, true, 'https://www.instagram.com/casahidalgo/', null, null, null, false),
  ('la-quebrada-papudo', 73, 'gastronomia', 'papudo', null, null, 'Prat 30, Papudo', false, true, 'https://www.instagram.com/la_quebrada_papudo/', null, null, null, false),
  ('sabor-marino', 74, 'gastronomia', 'papudo', null, null, 'Av. Víctor Fazio, Papudo', false, true, 'https://www.instagram.com/sabormarino69/', null, null, null, false),
  ('la-mare', 75, 'gastronomia', 'papudo', null, null, 'Chorrillos 37, Papudo', false, true, 'https://www.instagram.com/La_mare_pizza/', null, null, null, false),
  ('sazon-papudo', 76, 'gastronomia', 'papudo', null, null, 'Av. El Estero 211, local 9, Papudo', false, true, 'https://www.instagram.com/sazonpapudo_/', null, null, null, false),
  ('don-rola', 77, 'gastronomia', 'papudo', null, null, 'D. Fernández Concha 555, Papudo', false, true, null, null, null, null, false),
  ('chungungos', 78, 'gastronomia', 'papudo', null, null, 'Strip center Portal Papudo, sector Papudo Laguna', false, true, 'https://www.instagram.com/chungungo_s/', null, null, null, false),
  ('el-bunker', 79, 'gastronomia', 'papudo', null, null, 'Av. Víctor Fazio 1502, Papudo', false, true, 'https://www.instagram.com/elbunkerrestobarpapudo/', null, null, null, false),
  ('panaderia-soriano', 80, 'gastronomia', 'pullally', null, null, 'Av. Las Salinas 12e, Pullally', false, true, null, null, null, null, false),
  ('panaderia-la-tinita', 81, 'gastronomia', 'pullally', null, null, 'Av. Las Salinas 113, Pullally', false, true, null, null, null, null, false),
  ('el-rey-de-la-quinoa', 82, 'gastronomia', 'las-salinas-papudo', null, null, 'Km 3,5 camino Las Salinas', false, true, null, null, null, null, false),
  ('saborigenes', 83, 'gastronomia', 'las-salinas-papudo', null, null, 'Playa Las Salinas', false, true, null, null, null, null, false),
  ('gran-z', 84, 'gastronomia', 'las-salinas-papudo', null, null, 'Km 5 camino Las Salinas', false, true, null, null, null, null, false),
  ('casa-papudo-hotel-boutique', 85, 'alojamiento', 'papudo', null, null, 'Riquelme 194, Papudo', false, true, 'https://www.instagram.com/Casapapudo/', null, null, null, false),
  ('ambiente-mar', 86, 'alojamiento', 'papudo', null, null, 'Ruta E-30-F 645, Papudo', false, true, null, null, null, null, false),
  ('espacio-lila', 87, 'alojamiento', 'papudo', null, null, 'Chorrillos 459, Papudo', false, true, 'https://www.instagram.com/hostal_espacio_lila/', null, null, null, false),
  ('cabanas-aquario', 88, 'alojamiento', 'papudo', null, null, 'D. Fernández Concha 623, Papudo', false, true, null, null, null, null, false),
  ('la-quebrada-lodge', 89, 'alojamiento', 'papudo', null, null, 'Arturo Prat 30, Papudo', false, true, 'https://www.instagram.com/quebradalodge/', null, null, null, false),
  ('residencial-la-plaza', 90, 'alojamiento', 'papudo', null, null, 'Chorrillos 119, Papudo', false, true, 'https://www.instagram.com/rest.laplaza/', null, null, null, false),
  ('cabanas-de-pepino', 91, 'alojamiento', 'papudo', null, null, 'D. Fernández Concha, Papudo', false, true, 'https://www.instagram.com/cabanasdepepino/', null, null, null, false),
  ('rustico-cabanas', 92, 'alojamiento', 'papudo', null, null, 'Baquedano 31, Papudo', false, true, 'https://www.instagram.com/cabanasrusticopapudo/', null, null, null, false),
  ('residencial-papudo', 93, 'alojamiento', 'papudo', null, null, 'D. Fernández Concha 512, Papudo', false, true, null, null, null, null, false),
  ('hostal-la-abeja', 94, 'alojamiento', 'papudo', null, null, 'Chorrillos 36, Papudo', false, true, null, null, null, null, false),
  ('cabanas-los-arrayanes', 95, 'alojamiento', 'papudo', null, null, 'Pasaje Baquedano 333, Papudo', false, true, null, null, null, null, false),
  ('pura-vida-cabanas', 96, 'alojamiento', 'papudo', null, null, 'Baquedano 251, Papudo', false, true, 'https://www.instagram.com/Puravidacabanas/', null, null, null, false),
  ('hotel-plaza-papudo', 97, 'alojamiento', 'papudo', null, null, 'Miraflores 176, Papudo', false, true, null, null, null, null, false),
  ('hotel-moderno-petra-mar', 98, 'alojamiento', 'papudo', null, null, 'Riveros 515, Papudo', false, true, null, null, null, null, false),
  ('arenas-de-papudo', 99, 'alojamiento', 'papudo', null, null, 'Riveros 515, Papudo', false, true, null, null, null, null, false),
  ('hotel-rompe-olas', 100, 'alojamiento', 'papudo', null, null, 'Chorrillos 157, Papudo', false, true, null, null, null, null, false),
  ('rancho-carmelitas', 101, 'alojamiento', 'pullally', null, null, 'pasaje interior por Av. Las Salinas, Pullally', false, true, null, null, null, null, false),
  ('cabanas-angelo', 102, 'alojamiento', 'pullally', null, null, 'calle 6 Oriente, Pullally', false, true, null, null, null, null, false),
  ('refugio-las-salinas', 103, 'alojamiento', 'las-salinas-papudo', null, null, 'Km 5,7 carretera Las Salinas', false, true, null, null, null, null, false),
  ('ecocamping-santiago-waves', 104, 'alojamiento', 'las-salinas-papudo', null, null, 'Km 7 camino Las Salinas', false, true, null, null, null, null, false),
  ('cabanas-los-troncos', 105, 'alojamiento', 'las-salinas-papudo', null, null, 'Km 1,6 carretera Las Salinas', false, true, null, null, null, null, false),
  ('demo-parador-ola-mansa', 106, 'balneario', 'papudo', null, null, null, true, true, null, null, null, null, false),
  ('demo-cabalgatas-del-valle', 107, 'recreacion', 'pullally', null, null, null, true, true, null, null, null, null, false),
  ('demo-escuela-de-surf-ola-brava', 108, 'deportes', 'las-salinas-papudo', null, null, null, true, true, null, null, null, null, false),
  ('demo-circuito-casas-antiguas', 109, 'patrimonio', 'papudo', null, null, null, true, true, null, null, null, null, false),
  ('demo-cocineria-sabor-a-mar', 110, 'gastronomia', 'papudo', null, null, null, true, true, null, null, null, null, false),
  ('demo-huerta-y-quesos-el-retono', 111, 'ruralidad', 'pullally', null, null, null, true, true, null, null, null, null, false),
  ('demo-cabanas-brisa-salina', 112, 'alojamiento', 'las-salinas-papudo', null, null, null, true, true, null, null, null, null, false)
) as v(slug, sort_order, category, locality, lat, lng, address, is_demo, is_business, instagram, maps_url, sernatur, sernatur_until, owner_validated)
join public.categories c on c.slug = v.category
left join public.localities l on l.slug = v.locality
on conflict (slug) do update set
  sort_order = excluded.sort_order, category_id = excluded.category_id, locality_id = excluded.locality_id,
  latitude = excluded.latitude, longitude = excluded.longitude, address = excluded.address,
  is_demo = excluded.is_demo, is_business = excluded.is_business,
  instagram = excluded.instagram, maps_url = excluded.maps_url,
  sernatur_number = excluded.sernatur_number, sernatur_valid_until = excluded.sernatur_valid_until,
  owner_validated = excluded.owner_validated
where not public.places.managed_in_panel;

delete from public.place_translations
  where place_id in (select id from public.places where slug in ('playa-papudo', 'playa-chica-papudo', 'papudo-pullally', 'papudo-salinas-pullally', 'roots-salinas', 'papudo-playa-los-lilenes', 'papudo-parque', 'papudo-plaza', 'iglesia-nuestra-senora-de-las-mercedes', 'humedal-urbano-estero-agua-salada', 'caleta-de-pescadores-papudo', 'restaurante-donde-pablo', 'fuente-papudo', 'hotel-carande', 'playa-grande-papudo', 'playa-espejito', 'playa-las-playillas', 'playa-de-los-changos', 'quebrada-del-maqui', 'quebrada-del-frances', 'templo-san-pedro-pescador', 'edificio-consistorial', 'chalet-recart', 'gruta-virgen-de-lourdes', 'parque-de-pullally', 'la-casona-pullally', 'la-santita-pullally', 'el-llano-pullally', 'bosque-relicto-de-olivillos', 'dunas-las-salinas', 'cabalgatas-lilen', 'pintarroja-dive-center', 'gorgonia-expediciones', 'intemperie-turismo', 'la-vasija-de-sol', 'arriendo-de-kayak-papudo', 'empopado', 'buenaventura-paseos-en-lancha', 'awkan-ecoturismo', 'feria-artesanal-manos-papudanas', 'feria-de-verduras-papudo', 'feria-artesanal-espacio-parque', 'feria-artesanal-el-lilen', 'escuela-de-surf-salinas-experience', 'escuela-de-surf-salinas-de-pullally', 'feria-de-productores-pullally', 'feria-de-emprendedores-pullally', 'viveros-las-camelias', 'il-gabbiano', 'la-roca', 'la-canita', 'mamma-mia-papudo', 'la-plaza-restaurante', 'mar-de-luna', 'club-de-yates-papudo', 'casa-rivera', 'restaurante-rompe-olas', 'la-grota', 'casa-conaripe', 'la-catita', 'el-torres', 'sunshine-sushi', 'banana-papudo', 'tocato', 'bahia-lilen', 'gran-azul', 'puerto-madero-papudo', 'burgazo', 'papudoretro', 'la-casa-de-cesar', 'la-maison-des-fous', 'casa-hidalgo', 'la-quebrada-papudo', 'sabor-marino', 'la-mare', 'sazon-papudo', 'don-rola', 'chungungos', 'el-bunker', 'panaderia-soriano', 'panaderia-la-tinita', 'el-rey-de-la-quinoa', 'saborigenes', 'gran-z', 'casa-papudo-hotel-boutique', 'ambiente-mar', 'espacio-lila', 'cabanas-aquario', 'la-quebrada-lodge', 'residencial-la-plaza', 'cabanas-de-pepino', 'rustico-cabanas', 'residencial-papudo', 'hostal-la-abeja', 'cabanas-los-arrayanes', 'pura-vida-cabanas', 'hotel-plaza-papudo', 'hotel-moderno-petra-mar', 'arenas-de-papudo', 'hotel-rompe-olas', 'rancho-carmelitas', 'cabanas-angelo', 'refugio-las-salinas', 'ecocamping-santiago-waves', 'cabanas-los-troncos', 'demo-parador-ola-mansa', 'demo-cabalgatas-del-valle', 'demo-escuela-de-surf-ola-brava', 'demo-circuito-casas-antiguas', 'demo-cocineria-sabor-a-mar', 'demo-huerta-y-quesos-el-retono', 'demo-cabanas-brisa-salina') and not managed_in_panel);
insert into public.place_translations (place_id, locale, name, short_description, full_description, translation_status)
select p.id, v.locale::public.locale, v.name, v.short, v.description, v.status::public.translation_status
from (values
  ('playa-papudo', 'es', 'Playa de Papudo', 'Playa principal del balneario; La Terraza la bordea desde la gruta de la Virgen de Lourdes hasta la avenida Glorias Navales.', 'Papudo es una comuna balnearia de la provincia de Petorca, con 6.356 habitantes según el Censo 2017. La Playa de Papudo es la principal del pueblo, bordeada por el paseo La Terraza desde la gruta de la Virgen de Lourdes hasta la avenida Glorias Navales — el punto de encuentro del balneario en verano. Sus aguas aparecieron en Sabingo (Chilevisión), donde Dani Urrizola aprendió a bucear en Papudo.', null),
  ('playa-papudo', 'en', 'Papudo Beach', 'The resort''s main beach; a pedestrian promenade runs along it from the Virgin of Lourdes grotto to Glorias Navales avenue.', 'Papudo is a beach town in Petorca province, with 6,356 residents per the 2017 census. Papudo Beach is the town''s main strand, lined by the La Terraza promenade from the Virgin of Lourdes grotto to Glorias Navales avenue — the resort''s summer gathering point. Its waters were featured on Chilean TV show Sabingo (Chilevisión), where host Dani Urrizola learned to dive here.', 'draft'),
  ('playa-chica-papudo', 'es', 'Playa Chica', 'Playa resguardada apta para el baño y deportes acuáticos, más protegida del oleaje que Playa Grande.', 'También en la comuna de Papudo (6.356 habitantes, Censo 2017), Playa Chica es una alternativa más resguardada que Playa Grande, apta para el baño y deportes acuáticos gracias a su menor oleaje.', null),
  ('playa-chica-papudo', 'en', 'Playa Chica', 'A sheltered beach suited for swimming and water sports, calmer than nearby Playa Grande.', 'Also in Papudo commune (6,356 residents, 2017 census), Playa Chica is a more sheltered alternative to Playa Grande, suited for swimming and water sports thanks to its calmer surf.', 'draft'),
  ('papudo-pullally', 'es', 'Laguna Pullally', 'Laguna dentro del Santuario de la Naturaleza Salinas de Pullally y Dunas de Longotoma (decreto publicado en 2021), en la desembocadura de los ríos Petorca y La Ligua; el humedal alberga 137 especies de aves (más de un cuarto de las descritas en Chile), varias migratorias.', 'En la comuna de Papudo (6.356 habitantes, Censo 2017), esta laguna forma parte del Santuario de la Naturaleza Salinas de Pullally y Dunas de Longotoma (decreto publicado en 2021), en la desembocadura de los ríos Petorca y La Ligua. El humedal registra 137 especies de aves — más de un cuarto de las descritas en Chile — entre ellas gaviota garuma, perrito y pilpilén, además de especies migratorias del hemisferio norte.', null),
  ('papudo-pullally', 'en', 'Pullally Lagoon', 'A lagoon within the Salinas de Pullally y Dunas de Longotoma Nature Sanctuary (decree published in 2021), at the mouth of the Petorca and La Ligua rivers; the wetland is home to 137 bird species (over a quarter of those recorded in Chile), several of them migratory.', 'In Papudo commune (6,356 residents, 2017 census), this lagoon is part of the Salinas de Pullally y Dunas de Longotoma Nature Sanctuary (decree published in 2021), at the mouth of the Petorca and La Ligua rivers. The wetland has recorded 137 bird species — over a quarter of those described in Chile — including the grey gull, black-necked stilt and American oystercatcher, plus migratory species from the northern hemisphere.', 'draft'),
  ('papudo-salinas-pullally', 'es', 'Salinas de Pullally', 'Sector de salinas del Santuario de la Naturaleza Salinas de Pullally y Dunas de Longotoma (decreto publicado en 2021), entre las desembocaduras de los ríos Petorca y La Ligua.', 'En la comuna de Papudo (6.356 habitantes, Censo 2017), este sector de salinas —a unos 12 km al norte del balneario— es una caleta de pescadores artesanales en la desembocadura del río Ligua, donde botes amarrados a un pequeño muelle cruzan el río. El encuentro entre el río y el mar deja aguas tranquilas aptas para niños, mientras el sector abierto atrae a surfistas por la calidad de sus olas.', null),
  ('papudo-salinas-pullally', 'en', 'Salinas de Pullally', 'The salt-flat sector of the Salinas de Pullally y Dunas de Longotoma Nature Sanctuary (decree published in 2021), between the mouths of the Petorca and La Ligua rivers.', 'In Papudo commune (6,356 residents, 2017 census), this salt-flat sector — about 12 km north of the resort town — is a small artisanal fishing cove at the mouth of the Río Ligua, where boats tied to a small pier ferry people across the river. Where the river meets the sea the water turns calm enough for children, while the open stretch draws surfers for the quality of its waves.', 'draft'),
  ('roots-salinas', 'es', 'Roots Salinas', 'Churrascos, hamburguesas, completos y más junto al estacionamiento de la playa Salinas de Pullally. Su especialidad: el «churrasco salinero», de merluza o reineta.', 'Local de comida en Las Salinas, junto al estacionamiento de la playa Salinas de Pullally. Su carta tiene churrascos y hamburguesas, completos, pizzas y fajitas, empanadas, chorrillanas y salchipapas, además de helados y churros. La especialidad de la casa es el «churrasco salinero», de merluza o reineta. Tiene delivery y retiro en el local. En enero y febrero abre todos los días; de marzo a diciembre, los fines de semana y festivos.', null),
  ('roots-salinas', 'en', 'Roots Salinas', 'Sandwiches, burgers, hot dogs and more next to the Salinas de Pullally beach parking lot. Its specialty: the «churrasco salinero», a hake or reineta fish sandwich.', 'A food spot in Las Salinas, next to the Salinas de Pullally beach parking lot. The menu has churrascos (steak sandwiches) and burgers, Chilean hot dogs, pizzas and fajitas, empanadas, chorrillana and salchipapas, plus ice cream and churros. The house specialty is the «churrasco salinero», made with hake or reineta fish. Delivery and pick-up available. Open every day in January and February; from March to December, on weekends and public holidays.', 'draft'),
  ('roots-salinas', 'pt', 'Roots Salinas', 'Sanduíches, hambúrgueres, cachorros-quentes e mais ao lado do estacionamento da praia Salinas de Pullally. Sua especialidade: o «churrasco salinero», de merluza ou reineta.', 'Local de comida em Las Salinas, ao lado do estacionamento da praia Salinas de Pullally. O cardápio tem churrascos (sanduíches de carne) e hambúrgueres, cachorros-quentes chilenos, pizzas e fajitas, empanadas, chorrillana e salchipapas, além de sorvetes e churros. A especialidade da casa é o «churrasco salinero», de merluza ou reineta. Tem delivery e retirada no local. Abre todos os dias em janeiro e fevereiro; de março a dezembro, nos fins de semana e feriados.', 'draft'),
  ('papudo-playa-los-lilenes', 'es', 'Playa Los Lilenes', 'Playa escondida y tranquila al norte de Papudo, a la que se llega por un sendero costero de unos 800 m (o a caballo); pocas visitas, ideal para nadar y descansar rodeado de naturaleza.', 'En la comuna de Papudo (6.356 habitantes, Censo 2017), esta playa escondida se alcanza por un sendero costero de unos 800 m que también conecta con Punta Puyay y la llamada "playa del amor" — un circuito de caminata de baja exigencia y pocas visitas, ideal para nadar y descansar rodeado de naturaleza.', null),
  ('papudo-playa-los-lilenes', 'en', 'Los Lilenes Beach', 'A quiet, hidden beach north of Papudo, reached via an ~800 m coastal path (or on horseback); few visitors, great for swimming and relaxing surrounded by nature.', 'In Papudo commune (6,356 residents, 2017 census), this hidden beach is reached along an ~800 m coastal trail that also connects to Punta Puyay and the so-called "playa del amor" — an easy, lightly visited walking circuit, ideal for swimming and relaxing surrounded by nature.', 'draft'),
  ('papudo-parque', 'es', 'Costanera de Papudo', 'Paseo peatonal "La Terraza", desde la gruta de la Virgen de Lourdes hasta Av. Glorias Navales, bordeando Playa Chica y Playa Grande; tiendas de artesanía, restaurantes, juegos infantiles y club de yates.', 'En la comuna de Papudo (6.356 habitantes, Censo 2017), este paseo peatonal —"La Terraza"— bordea Playa Chica y Playa Grande desde la gruta de la Virgen de Lourdes hasta la avenida Glorias Navales. Es el punto de encuentro del balneario en verano, con tiendas de artesanía, restaurantes, juegos infantiles y el club de yates.', null),
  ('papudo-parque', 'en', 'Papudo Waterfront', '"La Terraza" pedestrian promenade, from the Virgin of Lourdes grotto to Glorias Navales avenue, running along Playa Chica and Playa Grande; craft shops, restaurants, a playground and a yacht club.', 'In Papudo commune (6,356 residents, 2017 census), this pedestrian promenade — "La Terraza" — runs along Playa Chica and Playa Grande from the Virgin of Lourdes grotto to Glorias Navales avenue. It''s the resort''s summer gathering point, with craft shops, restaurants, a playground and the yacht club.', 'draft'),
  ('papudo-plaza', 'es', 'Plaza de Papudo', 'Plaza central del pueblo, punto de encuentro de la comunidad y sede de ferias artesanales; rodeada de tiendas y restaurantes, con áreas verdes para sentarse.', 'En la comuna de Papudo (6.356 habitantes, Censo 2017), esta plaza central es el punto de encuentro de la comunidad y sede de ferias artesanales, rodeada de tiendas y restaurantes del pueblo.', null),
  ('papudo-plaza', 'en', 'Papudo Main Square', 'The town''s central square, a community gathering point and home to craft fairs; surrounded by shops and restaurants, with green spaces to sit.', 'In Papudo commune (6,356 residents, 2017 census), this central square is the community''s gathering point and hosts craft fairs, surrounded by the town''s shops and restaurants.', 'draft'),
  ('iglesia-nuestra-senora-de-las-mercedes', 'es', 'Iglesia Nuestra Señora de las Mercedes', 'Iglesia de estilo neocolonial de 1918, obra del arquitecto Alberto Cruz Montt; Monumento Histórico desde 1995.', 'Diseñada por el arquitecto Alberto Cruz Montt e inaugurada en 1918, es de estilo neocolonial con detalles barrocos en su fachada y planta de cruz latina de una nave. Fue declarada Monumento Histórico en 1995 y restaurada en 2007. Aparece como locación de la teleserie Sucupira (TVN, 1996).', null),
  ('iglesia-nuestra-senora-de-las-mercedes', 'en', 'Our Lady of Mercy Church', 'A 1918 neo-colonial church by architect Alberto Cruz Montt; a National Historic Monument since 1995.', 'Designed by architect Alberto Cruz Montt and opened in 1918, the church is neo-colonial with baroque details on its facade and a single-nave Latin-cross plan. It was declared a National Historic Monument in 1995 and restored in 2007. It is one of the filming locations of the TV series Sucupira (TVN, 1996).', 'draft'),
  ('humedal-urbano-estero-agua-salada', 'es', 'Humedal Urbano Estero Agua Salada', 'Humedal urbano de unas 70 hectáreas reconocido por el Ministerio del Medio Ambiente en 2022, refugio de aves.', 'El Ministerio del Medio Ambiente lo reconoció como humedal urbano en abril de 2022 (Res. Ex. N° 392/2022), a solicitud de la Municipalidad de Papudo. Tiene unas 70,2 hectáreas dentro del límite urbano. En 2023 el Segundo Tribunal Ambiental rechazó una reclamación contra esa declaratoria.', null),
  ('humedal-urbano-estero-agua-salada', 'en', 'Estero Agua Salada Urban Wetland', 'An urban wetland of about 70 hectares recognised by the Ministry of the Environment in 2022, a haven for birds.', 'The Ministry of the Environment recognised it as an urban wetland in April 2022 (Res. Ex. No. 392/2022), at the request of the Municipality of Papudo. It covers about 70.2 hectares within the urban limit. In 2023 the Second Environmental Court rejected a challenge to that declaration.', 'draft'),
  ('caleta-de-pescadores-papudo', 'es', 'Caleta de pescadores', 'El rincón más tradicional del balneario, al poniente de Playa Chica, donde los pescadores preparan y venden productos del mar.', 'Ubicada al poniente de Playa Chica, es el lugar más tradicional del balneario: ahí los pescadores artesanales preparan y venden productos del mar. La Dirección de Obras Portuarias del MOP impulsa un proyecto de nueva caleta, porque hoy las embarcaciones se varan en la playa.', null),
  ('caleta-de-pescadores-papudo', 'en', 'Fishermen''s cove', 'The resort''s most traditional corner, west of Playa Chica, where fishermen prepare and sell seafood.', 'Located west of Playa Chica, it is the resort''s most traditional spot: artisanal fishermen prepare and sell seafood here. The Ministry of Public Works'' port authority is developing a new cove, since boats are currently hauled up on the beach.', 'draft'),
  ('restaurante-donde-pablo', 'es', 'Donde Pablo', 'Restaurante de pescados y mariscos frente a la Playa Grande, con terraza y salones interiores.', 'Restaurante de cocina chilena con foco en pescados y mariscos, ubicado frente a la Playa Grande. Tiene una terraza con vista al mar y salones interiores para los días de viento.', null),
  ('restaurante-donde-pablo', 'en', 'Donde Pablo', 'Fish and seafood restaurant facing Playa Grande, with a terrace and indoor rooms.', 'A Chilean restaurant focused on fish and seafood, right across from Playa Grande. It has a sea-view terrace and indoor rooms for windy days.', 'draft'),
  ('fuente-papudo', 'es', 'Fuente Papudo', 'Fuente de soda y picada local, conocida por sus preparaciones con piure.', 'Sus dueños la definen como fuente de soda, boliche o picada, que recibe a vecinos y turistas. Un crítico gastronómico de El Mercurio de Valparaíso la destacó en 2024 por su especialidad: el piure.', null),
  ('fuente-papudo', 'en', 'Fuente Papudo', 'A local diner known for its piure (sea squirt) dishes.', 'Its owners describe it as a classic soda fountain and local eatery for residents and visitors. A food critic from El Mercurio de Valparaíso highlighted it in 2024 for its specialty: piure.', 'draft'),
  ('hotel-carande', 'es', 'Hotel Carande', 'Hotel en el centro de Papudo, a pocos minutos a pie de Playa Chica, con restaurante y estacionamiento.', 'Hotel ubicado en el centro de Papudo, a pocos minutos a pie de la playa. Los portales de reserva mencionan desayuno, restaurante propio y estacionamiento.', null),
  ('hotel-carande', 'en', 'Hotel Carande', 'A hotel in central Papudo, a few minutes'' walk from Playa Chica, with a restaurant and parking.', 'A hotel in central Papudo, a few minutes'' walk from the beach. Booking sites mention breakfast, an on-site restaurant and parking.', 'draft'),
  ('playa-grande-papudo', 'es', 'Playa Grande', 'La playa más extensa de Papudo, de arenas doradas, ideal para caminar y practicar surf y bodyboard. No es apta para el baño.', 'Playa papudana a 443 metros al noreste de Playa Chica. Es la más extensa de Papudo, de arenas doradas e ideal para grandes caminatas. Sus condiciones marítimas permiten practicar surf y bodyboard. No es apta para el baño.', null),
  ('playa-espejito', 'es', 'Playa Espejito', 'Playa tranquila a 2,7 km al noreste de Playa Chica, con un pozo de agua dulce. No es apta para el baño.', 'Playa ubicada a 2,7 km al noreste de Playa Chica. Se caracteriza por su tranquilidad y por tener un pozo de agua dulce. En este sector deja de ser apta para el baño.', null),
  ('playa-las-playillas', 'es', 'Las Playillas', 'Playa del borde costero norte, a 6 km al noroeste, rodeada de naturaleza. Se llega a pie: cerca de una hora caminando desde Playa Los Lilenes.', 'Se encuentra a 6 km al noroeste, en el sector norte del borde costero papudano, pasado Espejito. La rodea un fundo privado donde abunda la naturaleza y se llega a pie: desde Playa Los Lilenes, donde comienza la caminata, son aproximadamente una hora caminando.', null),
  ('playa-de-los-changos', 'es', 'Playa de los Changos', 'Playa rocosa junto al muelle, a 700 m al noroeste de Playa Chica. No es apta para el baño, pero es una muy buena opción para caminar.', 'Playa ubicada a un costado del muelle de Papudo, a 700 metros al noroeste de Playa Chica. Está llena de rocas y frente a un mar más abierto, por lo que no es apta para el baño, pero es una muy buena opción para caminar y disfrutar del paisaje.', null),
  ('quebrada-del-maqui', 'es', 'Quebrada del Maqui', 'Quebrada a 3,1 km al noreste de Playa Chica, muy usada para trekking y mountain bike.', 'Quebrada a 3,1 km al noreste de Playa Chica, muy usada para trekking y mountain bike.', null),
  ('quebrada-del-frances', 'es', 'Quebrada del Francés', 'Larga quebrada en el cerro La Higuera, a 1,9 km al sur de Playa Chica: favorita para trekking, bicicleta y caminatas.', 'Es una quebrada muy larga que llega a los pies de la antena, en el cerro La Higuera, a 1,9 km al sur de Playa Chica. Es uno de los lugares favoritos para hacer trekking, andar en bicicleta y caminar. Cuenta la leyenda que el pirata Francis Drake escondió aquí un tesoro de monedas de oro, y de ahí viene su nombre.', null),
  ('templo-san-pedro-pescador', 'es', 'Templo católico San Pedro Pescador', 'Templo construido en 2001 cerca de la entrada del pueblo, donde la comunidad parroquial celebra sus principales liturgias.', 'Está en la calle Víctor Fazzio 1005, a 1,2 km al este de Playa Chica. Fue construido en 2001 cerca de la entrada del pueblo, en el mismo lugar donde por décadas existió una capilla sufragánea de la Parroquia de Las Mercedes. Hoy es donde la comunidad parroquial participa de las celebraciones litúrgicas principales.', null),
  ('edificio-consistorial', 'es', 'Edificio Consistorial', 'Edificio casi al centro de la Plaza de Armas, donde funciona la Biblioteca Municipal y sesiona el Concejo Municipal.', 'Edificio casi al centro de la Plaza de Armas, donde funciona la Biblioteca Municipal y sesiona el Concejo Municipal.', null),
  ('chalet-recart', 'es', 'Chalet Recart', 'Obra del arquitecto Josué Smith Solar, destacada por su diseño y ubicación. Hoy pertenece a la Municipalidad de Papudo.', 'Obra del arquitecto Josué Smith Solar, destacada por su diseño y ubicación. Hoy pertenece a la Municipalidad de Papudo.', null),
  ('gruta-virgen-de-lourdes', 'es', 'Gruta Virgen de Lourdes', 'Lugar donde los fieles católicos se reúnen a orar.', 'Lugar donde los fieles católicos se reúnen a orar.', null),
  ('parque-de-pullally', 'es', 'Parque de Pullally', 'Antiguo parque de la familia Irarrázaval, con especies exóticas como pino ciprés, secuoya y roble australiano. Un pulmón verde de la zona.', 'Hace muchos años fue una propiedad privada: básicamente el patio de la familia Irarrázaval, con especies exóticas como pino ciprés, secuoya y roble australiano. Llegaba hasta la calle del Llano y sumaba 33 hectáreas. A principios del siglo XX, tras el terremoto de 1906, Fernando Irarrázaval Mackenna trajo a un paisajista francés para remodelarlo.', null),
  ('la-casona-pullally', 'es', 'La Casona y ruinas de la ex Hacienda', 'Ruinas de la casona de los Irarrázaval, reconstruida en estilo neoclásico francés tras el terremoto de 1906.', 'Perteneció a José Santiago Irarrázaval Portales, nacido allí en 1734. Tras el terremoto de 1906, Fernando Irarrázaval Mackenna la reconstruyó en estilo neoclásico francés, y sus ruinas aún se observan. El sismo de 1965 volvió a dañarla y, en plena reforma agraria, expertos la declararon irrecuperable. Considerada por los habitantes un símbolo de esclavitud y represión, nunca fue protegida. En 1966 el fundo fue expropiado.', null),
  ('la-santita-pullally', 'es', 'La Santita', 'Imagen de fierro forjado traída de Francia, que fue el oratorio de los patrones de la hacienda.', 'Desde un principio fue un oratorio para los patrones. Es una imagen de fierro forjado originaria de Francia. La gente del pueblo comenzó a llamarla «la Santita» cuando pudo acceder a ella. Junto a ella existía un estanque de agua para su mantención.', null),
  ('el-llano-pullally', 'es', 'El Llano', 'Escenario de las carreras a la chilena de Pullally, que toman vida cada septiembre.', 'La actividad del Llano comenzó con Irarrázaval Mackenna como una instancia de distracción abierta a todos, empezando por la gente de Pullally. Al principio funcionaba solo el 18 de septiembre; con los años se sumó el feriado del 19. Desde entonces, el Llano toma vida con las carreras a la chilena.', null),
  ('bosque-relicto-de-olivillos', 'es', 'Bosque Relicto de Olivillos', 'Un verdadero tesoro botánico, testimonio de la flora nativa de la zona.', 'Un verdadero tesoro botánico, testimonio de la flora nativa de la zona.', null),
  ('dunas-las-salinas', 'es', 'Dunas de Las Salinas', 'Dunas al norte de Papudo, en Las Salinas. Son de difícil acceso, ya que las bordean los ríos La Ligua y Petorca.', 'Dunas al norte de Papudo, en Las Salinas. Son de difícil acceso, ya que las bordean los ríos La Ligua y Petorca.', null),
  ('cabalgatas-lilen', 'es', 'Cabalgatas Lilen', 'Cabalgatas en Papudo.', 'Cabalgatas en Papudo.', null),
  ('pintarroja-dive-center', 'es', 'Pintarroja Dive Center', 'Centro de buceo: buceo recreativo y actividades náuticas.', 'Centro de buceo: buceo recreativo y actividades náuticas.', null),
  ('gorgonia-expediciones', 'es', 'Gorgonia Expediciones', 'Experiencias de buceo.', 'Experiencias de buceo.', null),
  ('intemperie-turismo', 'es', 'Intemperie', 'Turismo de naturaleza: excursiones náuticas y trekking.', 'Turismo de naturaleza: excursiones náuticas y trekking.', null),
  ('la-vasija-de-sol', 'es', 'La Vasija de Sol', 'Terapias complementarias.', 'Terapias complementarias.', null),
  ('arriendo-de-kayak-papudo', 'es', 'Arriendo de kayak', 'Arriendo de kayak en la caleta de pescadores de Papudo.', 'Arriendo de kayak en la caleta de pescadores de Papudo.', null),
  ('empopado', 'es', 'Empopado', 'Escuela de deportes náuticos: windsurf, navegación a vela, ski y wakeboard, paddle surf y licencia de patrón de bahía.', 'Escuela de deportes náuticos: windsurf, navegación a vela, ski y wakeboard, paddle surf y licencia de patrón de bahía.', null),
  ('buenaventura-paseos-en-lancha', 'es', 'Buenaventura', 'Paseos en lancha y pesca deportiva, desde las 12:00.', 'Paseos en lancha y pesca deportiva, desde las 12:00.', null),
  ('awkan-ecoturismo', 'es', 'Awkan Ecoturismo', 'Agencia de ecoturismo: kayak, trekking, astroturismo y escalada.', 'Agencia de ecoturismo: kayak, trekking, astroturismo y escalada.', null),
  ('feria-artesanal-manos-papudanas', 'es', 'Feria Artesanal Manos Papudanas', 'Feria artesanal en la costanera de Playa Chica, los sábados y domingos.', 'Feria artesanal en la costanera de Playa Chica, los sábados y domingos.', null),
  ('feria-de-verduras-papudo', 'es', 'Feria de verduras', 'Feria de verduras los miércoles y domingos, de 08:30 a 15:00 aproximadamente.', 'Feria de verduras los miércoles y domingos, de 08:30 a 15:00 aproximadamente.', null),
  ('feria-artesanal-espacio-parque', 'es', 'Feria Artesanal Espacio Parque', 'Feria artesanal en el Parque Municipal de Papudo, en Playa Grande.', 'Feria artesanal en el Parque Municipal de Papudo, en Playa Grande.', null),
  ('feria-artesanal-el-lilen', 'es', 'Feria Artesanal El Lilen', 'Feria artesanal en la costanera de Playa Grande.', 'Feria artesanal en la costanera de Playa Grande.', null),
  ('escuela-de-surf-salinas-experience', 'es', 'Escuela de Surf Salinas Experience', 'Escuela de surf en la playa de Las Salinas.', 'Escuela de surf en la playa de Las Salinas.', null),
  ('escuela-de-surf-salinas-de-pullally', 'es', 'Escuela de Surf Salinas de Pullally', 'Escuela de surf en la playa de Las Salinas.', 'Escuela de surf en la playa de Las Salinas.', null),
  ('feria-de-productores-pullally', 'es', 'Feria de Productores', 'Feria de productores los domingos de 09:00 a 14:30.', 'Feria de productores los domingos de 09:00 a 14:30.', null),
  ('feria-de-emprendedores-pullally', 'es', 'Feria de Emprendedores', 'Feria de emprendedores en las ruinas de la ex Hacienda, los fines de semana 1 y 15.', 'Feria de emprendedores en las ruinas de la ex Hacienda, los fines de semana 1 y 15.', null),
  ('viveros-las-camelias', 'es', 'Viveros Las Camelias', 'Vivero en el sector de las ruinas de Pullally.', 'Vivero en el sector de las ruinas de Pullally.', null),
  ('il-gabbiano', 'es', 'Il Gabbiano', 'Restaurante en Chorrillos 183, Papudo.', 'Restaurante en Chorrillos 183, Papudo.', null),
  ('la-roca', 'es', 'La Roca', 'Restaurante en Chorrillos 149, Papudo.', 'Restaurante en Chorrillos 149, Papudo.', null),
  ('la-canita', 'es', 'La Cañita', 'Restaurante en Av. El Estero 211, local 11, Papudo.', 'Restaurante en Av. El Estero 211, local 11, Papudo.', null),
  ('mamma-mia-papudo', 'es', 'Mamma Mia', 'Restaurante en D. Fernández Concha 502, Papudo.', 'Restaurante en D. Fernández Concha 502, Papudo.', null),
  ('la-plaza-restaurante', 'es', 'La Plaza', 'Restaurante en Chorrillos 119, Papudo.', 'Restaurante en Chorrillos 119, Papudo.', null),
  ('mar-de-luna', 'es', 'Mar de Luna', 'Restaurante en Chorrillos 107, Papudo.', 'Restaurante en Chorrillos 107, Papudo.', null),
  ('club-de-yates-papudo', 'es', 'Club de Yates', 'Restaurante en Irarrázaval 0201, Papudo.', 'Restaurante en Irarrázaval 0201, Papudo.', null),
  ('casa-rivera', 'es', 'Casa Rivera', 'Restaurante en Miraflores 112, Papudo.', 'Restaurante en Miraflores 112, Papudo.', null),
  ('restaurante-rompe-olas', 'es', 'Restaurante Rompe Olas', 'Restaurante en Chorrillos 157, Papudo.', 'Restaurante en Chorrillos 157, Papudo.', null),
  ('la-grota', 'es', 'La Grota', 'Restaurante en Esmeralda 296, Papudo.', 'Restaurante en Esmeralda 296, Papudo.', null),
  ('casa-conaripe', 'es', 'Casa Coñaripe', 'Restaurante en D. Fernández Concha 525, Papudo.', 'Restaurante en D. Fernández Concha 525, Papudo.', null),
  ('la-catita', 'es', 'La Catita', 'Restaurante en Víctor Fazio Rigazzi 1051, Papudo.', 'Restaurante en Víctor Fazio Rigazzi 1051, Papudo.', null),
  ('el-torres', 'es', 'El Torres', 'Restaurante en Miraflores 88, Papudo.', 'Restaurante en Miraflores 88, Papudo.', null),
  ('sunshine-sushi', 'es', 'Sunshine Sushi', 'Restaurante en Miraflores 186, Papudo.', 'Restaurante en Miraflores 186, Papudo.', null),
  ('banana-papudo', 'es', 'Banana', 'Restaurante en Av. Irarrázaval 86, Papudo.', 'Restaurante en Av. Irarrázaval 86, Papudo.', null),
  ('tocato', 'es', 'Tocato', 'Restaurante en Miraflores 210, Papudo.', 'Restaurante en Miraflores 210, Papudo.', null),
  ('bahia-lilen', 'es', 'Bahía Lilen', 'Restaurante en Cochrane 184, Papudo.', 'Restaurante en Cochrane 184, Papudo.', null),
  ('gran-azul', 'es', 'Gran Azul', 'Restaurante en Av. Irarrázaval 86, Papudo.', 'Restaurante en Av. Irarrázaval 86, Papudo.', null),
  ('puerto-madero-papudo', 'es', 'Puerto Madero', 'Restaurante en Av. Irarrázaval 88, Papudo.', 'Restaurante en Av. Irarrázaval 88, Papudo.', null),
  ('burgazo', 'es', 'Burgazo', 'Restaurante en D. Fernández Concha 210, Papudo.', 'Restaurante en D. Fernández Concha 210, Papudo.', null),
  ('papudoretro', 'es', 'PapudoRetro', 'Restaurante en Irarrázaval 55, locales 8 y 9, Papudo.', 'Restaurante en Irarrázaval 55, locales 8 y 9, Papudo.', null),
  ('la-casa-de-cesar', 'es', 'La Casa de César', 'Restaurante en D. Fernández Concha con Chorrillos, Papudo.', 'Restaurante en D. Fernández Concha con Chorrillos, Papudo.', null),
  ('la-maison-des-fous', 'es', 'La Maison des Fous', 'Restaurante en Blanco 132, Papudo.', 'Restaurante en Blanco 132, Papudo.', null),
  ('casa-hidalgo', 'es', 'Casa Hidalgo', 'Restaurante en Chorrillos 157, Papudo.', 'Restaurante en Chorrillos 157, Papudo.', null),
  ('la-quebrada-papudo', 'es', 'La Quebrada Papudo', 'Restaurante en Prat 30, Papudo.', 'Restaurante en Prat 30, Papudo.', null),
  ('sabor-marino', 'es', 'Sabor Marino', 'Restaurante en Av. Víctor Fazio, Papudo.', 'Restaurante en Av. Víctor Fazio, Papudo.', null),
  ('la-mare', 'es', 'La Mare', 'Restaurante en Chorrillos 37, Papudo.', 'Restaurante en Chorrillos 37, Papudo.', null),
  ('sazon-papudo', 'es', 'Sazón', 'Restaurante en Av. El Estero 211, local 9, Papudo.', 'Restaurante en Av. El Estero 211, local 9, Papudo.', null),
  ('don-rola', 'es', 'Don Rola', 'Restaurante en D. Fernández Concha 555, Papudo.', 'Restaurante en D. Fernández Concha 555, Papudo.', null),
  ('chungungos', 'es', 'Chungungos', 'Restaurante en Strip center Portal Papudo, sector Papudo Laguna.', 'Restaurante en Strip center Portal Papudo, sector Papudo Laguna.', null),
  ('el-bunker', 'es', 'El Bunker', 'Restaurante en Av. Víctor Fazio 1502, Papudo.', 'Restaurante en Av. Víctor Fazio 1502, Papudo.', null),
  ('panaderia-soriano', 'es', 'Panadería y Pastelería Soriano', 'Panadería y pastelería en Pullally.', 'Panadería y pastelería en Pullally.', null),
  ('panaderia-la-tinita', 'es', 'Panadería y Pastelería La Tinita', 'Panadería y pastelería en Pullally.', 'Panadería y pastelería en Pullally.', null),
  ('el-rey-de-la-quinoa', 'es', 'El Rey de la Quinoa', 'Restaurante en Km 3,5 camino Las Salinas.', 'Restaurante en Km 3,5 camino Las Salinas.', null),
  ('saborigenes', 'es', 'Saborigenes', 'Food truck en la playa Las Salinas.', 'Food truck en la playa Las Salinas.', null),
  ('gran-z', 'es', 'Gran Z', 'Restaurante en Km 5 camino Las Salinas.', 'Restaurante en Km 5 camino Las Salinas.', null),
  ('casa-papudo-hotel-boutique', 'es', 'Casa Papudo Hotel Boutique', 'Hotel boutique en Riquelme 194, Papudo.', 'Hotel boutique en Riquelme 194, Papudo.', null),
  ('ambiente-mar', 'es', 'Ambiente Mar', 'Alojamiento en Ruta E-30-F 645, Papudo.', 'Alojamiento en Ruta E-30-F 645, Papudo.', null),
  ('espacio-lila', 'es', 'Espacio Lila', 'Hostal en Chorrillos 459, Papudo.', 'Hostal en Chorrillos 459, Papudo.', null),
  ('cabanas-aquario', 'es', 'Cabañas Aquario', 'Cabañas en D. Fernández Concha 623, Papudo.', 'Cabañas en D. Fernández Concha 623, Papudo.', null),
  ('la-quebrada-lodge', 'es', 'La Quebrada Lodge', 'Lodge en Arturo Prat 30, Papudo.', 'Lodge en Arturo Prat 30, Papudo.', null),
  ('residencial-la-plaza', 'es', 'Residencial La Plaza', 'Residencial en Chorrillos 119, Papudo.', 'Residencial en Chorrillos 119, Papudo.', null),
  ('cabanas-de-pepino', 'es', 'Cabañas de Pepino', 'Cabañas en D. Fernández Concha, Papudo.', 'Cabañas en D. Fernández Concha, Papudo.', null),
  ('rustico-cabanas', 'es', 'Rústico Cabañas', 'Cabañas en Baquedano 31, Papudo.', 'Cabañas en Baquedano 31, Papudo.', null),
  ('residencial-papudo', 'es', 'Residencial Papudo', 'Residencial en D. Fernández Concha 512, Papudo.', 'Residencial en D. Fernández Concha 512, Papudo.', null),
  ('hostal-la-abeja', 'es', 'Hostal La Abeja', 'Hostal en Chorrillos 36, Papudo.', 'Hostal en Chorrillos 36, Papudo.', null),
  ('cabanas-los-arrayanes', 'es', 'Cabañas Los Arrayanes', 'Cabañas en Pasaje Baquedano 333, Papudo.', 'Cabañas en Pasaje Baquedano 333, Papudo.', null),
  ('pura-vida-cabanas', 'es', 'Pura Vida', 'Cabañas en Baquedano 251, Papudo.', 'Cabañas en Baquedano 251, Papudo.', null),
  ('hotel-plaza-papudo', 'es', 'Hotel Plaza', 'Hotel en Miraflores 176, Papudo.', 'Hotel en Miraflores 176, Papudo.', null),
  ('hotel-moderno-petra-mar', 'es', 'Hotel Moderno Petra Mar', 'Hotel en Riveros 515, Papudo.', 'Hotel en Riveros 515, Papudo.', null),
  ('arenas-de-papudo', 'es', 'Arenas de Papudo', 'Alojamiento en Riveros 515, Papudo.', 'Alojamiento en Riveros 515, Papudo.', null),
  ('hotel-rompe-olas', 'es', 'Hotel Rompe Olas', 'Hotel en Chorrillos 157, Papudo.', 'Hotel en Chorrillos 157, Papudo.', null),
  ('rancho-carmelitas', 'es', 'Rancho Carmelitas', 'Alojamiento en pasaje interior por Av. Las Salinas, Pullally.', 'Alojamiento en pasaje interior por Av. Las Salinas, Pullally.', null),
  ('cabanas-angelo', 'es', 'Cabañas Angelo', 'Cabañas en calle 6 Oriente, Pullally.', 'Cabañas en calle 6 Oriente, Pullally.', null),
  ('refugio-las-salinas', 'es', 'Refugio Las Salinas', 'Alojamiento en Km 5,7 carretera Las Salinas.', 'Alojamiento en Km 5,7 carretera Las Salinas.', null),
  ('ecocamping-santiago-waves', 'es', 'Ecocamping Santiago Waves', 'Ecocamping en Km 7 camino Las Salinas.', 'Ecocamping en Km 7 camino Las Salinas.', null),
  ('cabanas-los-troncos', 'es', 'Cabañas Los Troncos', 'Cabañas en Km 1,6 carretera Las Salinas.', 'Cabañas en Km 1,6 carretera Las Salinas.', null),
  ('demo-parador-ola-mansa', 'es', 'Parador Ola Mansa (ejemplo)', 'Parador frente al mar con sombrillas, jugos naturales y sándwiches para pasar el día de playa.', 'Un parador de playa de ejemplo: arriendo de sombrillas y reposeras, jugos naturales, helados y sándwiches, con baños y mesas bajo toldo. Está pensado para mostrar cómo se vería la ficha de un negocio de balneario.', null),
  ('demo-parador-ola-mansa', 'en', 'Ola Mansa Beach Stand (example)', 'Seaside stand with umbrellas, fresh juices and sandwiches for a beach day.', 'An example beach stand: umbrella and sun lounger rental, fresh juices, ice cream and sandwiches, with restrooms and tables under an awning. It is meant to show what a seaside business page would look like.', 'draft'),
  ('demo-parador-ola-mansa', 'pt', 'Parador Ola Mansa (exemplo)', 'Parador de frente para o mar com guarda-sóis, sucos naturais e sanduíches para um dia de praia.', 'Um parador de praia de exemplo: aluguel de guarda-sóis e espreguiçadeiras, sucos naturais, sorvetes e sanduíches, com banheiros e mesas sob toldo. Serve para mostrar como seria a ficha de um negócio de balneário.', 'draft'),
  ('demo-cabalgatas-del-valle', 'es', 'Cabalgatas del Valle (ejemplo)', 'Paseos a caballo por el campo de Pullally, con salidas al atardecer para toda la familia.', 'Una actividad de ejemplo: cabalgatas guiadas de una hora por caminos de campo, con caballos mansos y salidas al atardecer. Sirve para mostrar cómo se vería una ficha de recreación.', null),
  ('demo-cabalgatas-del-valle', 'en', 'Valley Horseback Rides (example)', 'Horseback rides through the Pullally countryside, with sunset departures for the whole family.', 'An example activity: one-hour guided rides along country roads, with gentle horses and sunset departures. It shows what a recreation page would look like.', 'draft'),
  ('demo-cabalgatas-del-valle', 'pt', 'Cavalgadas do Vale (exemplo)', 'Passeios a cavalo pelo campo de Pullally, com saídas ao entardecer para toda a família.', 'Uma atividade de exemplo: cavalgadas guiadas de uma hora por caminhos de campo, com cavalos mansos e saídas ao entardecer. Serve para mostrar como seria uma ficha de recreação.', 'draft'),
  ('demo-escuela-de-surf-ola-brava', 'es', 'Escuela de Surf Ola Brava (ejemplo)', 'Clases de surf y stand up paddle para principiantes, con equipo incluido.', 'Un negocio deportivo de ejemplo: clases grupales y particulares de surf y stand up paddle, con tablas y trajes incluidos. Sirve para mostrar cómo se vería una ficha de deportes.', null),
  ('demo-escuela-de-surf-ola-brava', 'en', 'Ola Brava Surf School (example)', 'Surf and stand-up paddle lessons for beginners, equipment included.', 'An example sports business: group and private surf and stand-up paddle lessons, boards and wetsuits included. It shows what a sports page would look like.', 'draft'),
  ('demo-escuela-de-surf-ola-brava', 'pt', 'Escola de Surfe Ola Brava (exemplo)', 'Aulas de surfe e stand up paddle para iniciantes, com equipamento incluído.', 'Um negócio esportivo de exemplo: aulas em grupo e particulares de surfe e stand up paddle, com pranchas e roupas de borracha incluídas. Serve para mostrar como seria uma ficha de esportes.', 'draft'),
  ('demo-circuito-casas-antiguas', 'es', 'Circuito Casas Antiguas (ejemplo)', 'Recorrido guiado a pie por el casco histórico, con relatos de las familias que lo fundaron.', 'Una experiencia cultural de ejemplo: caminata guiada de 90 minutos por calles patrimoniales, con historias y fotos antiguas. Sirve para mostrar cómo se vería una ficha de cultura y patrimonio.', null),
  ('demo-circuito-casas-antiguas', 'en', 'Old Houses Circuit (example)', 'Guided walk through the historic centre, with stories of the families who founded it.', 'An example cultural experience: a 90-minute guided walk along heritage streets, with stories and old photographs. It shows what a culture and heritage page would look like.', 'draft'),
  ('demo-circuito-casas-antiguas', 'pt', 'Circuito Casas Antigas (exemplo)', 'Passeio guiado a pé pelo centro histórico, com relatos das famílias que o fundaram.', 'Uma experiência cultural de exemplo: caminhada guiada de 90 minutos por ruas históricas, com histórias e fotos antigas. Serve para mostrar como seria uma ficha de cultura e patrimônio.', 'draft'),
  ('demo-cocineria-sabor-a-mar', 'es', 'Cocinería Sabor a Mar (ejemplo)', 'Pescado del día, machas a la parmesana y empanadas de mariscos, cerca de la caleta.', 'Un restaurante de ejemplo: cocina de mar con pescado fresco, machas a la parmesana y empanadas de mariscos, en un local familiar con terraza. Sirve para mostrar cómo se vería una ficha de gastronomía.', null),
  ('demo-cocineria-sabor-a-mar', 'en', 'Sabor a Mar Seafood Kitchen (example)', 'Fish of the day, parmesan razor clams and seafood empanadas, near the fishing cove.', 'An example restaurant: seafood cooking with fresh fish, parmesan razor clams and seafood empanadas, in a family-run place with a terrace. It shows what a food page would look like.', 'draft'),
  ('demo-cocineria-sabor-a-mar', 'pt', 'Cozinha Sabor a Mar (exemplo)', 'Peixe do dia, lingueirões à parmesã e empanadas de frutos do mar, perto da caleta.', 'Um restaurante de exemplo: cozinha do mar com peixe fresco, lingueirões à parmesã e empanadas de frutos do mar, em um local familiar com terraço. Serve para mostrar como seria uma ficha de gastronomia.', 'draft'),
  ('demo-huerta-y-quesos-el-retono', 'es', 'Huerta y Quesos El Retoño (ejemplo)', 'Visita a una huerta familiar con degustación de quesos, mermeladas y frutas de la temporada.', 'Una experiencia rural de ejemplo: recorrido por una huerta familiar, ordeña demostrativa y degustación de productos del campo. Sirve para mostrar cómo se vería una ficha de campo y ruralidad.', null),
  ('demo-huerta-y-quesos-el-retono', 'en', 'El Retoño Farm & Cheese (example)', 'Visit to a family farm with tastings of cheese, jams and seasonal fruit.', 'An example rural experience: a tour of a family farm, a demonstration milking and tastings of country products. It shows what a countryside page would look like.', 'draft'),
  ('demo-huerta-y-quesos-el-retono', 'pt', 'Horta e Queijos El Retoño (exemplo)', 'Visita a uma horta familiar com degustação de queijos, geleias e frutas da estação.', 'Uma experiência rural de exemplo: passeio por uma horta familiar, ordenha demonstrativa e degustação de produtos do campo. Serve para mostrar como seria uma ficha de campo e ruralidade.', 'draft'),
  ('demo-cabanas-brisa-salina', 'es', 'Cabañas Brisa Salina (ejemplo)', 'Cabañas para familias entre el campo y el mar, con quincho y estacionamiento.', 'Un alojamiento de ejemplo: cabañas para cuatro a seis personas con cocina equipada, quincho compartido y estacionamiento. Sirve para mostrar cómo se vería una ficha de alojamiento.', null),
  ('demo-cabanas-brisa-salina', 'en', 'Brisa Salina Cabins (example)', 'Family cabins between the countryside and the sea, with a barbecue area and parking.', 'An example place to stay: cabins for four to six people with a full kitchen, a shared barbecue area and parking. It shows what an accommodation page would look like.', 'draft'),
  ('demo-cabanas-brisa-salina', 'pt', 'Cabanas Brisa Salina (exemplo)', 'Cabanas para famílias entre o campo e o mar, com churrasqueira e estacionamento.', 'Uma hospedagem de exemplo: cabanas para quatro a seis pessoas com cozinha equipada, churrasqueira compartilhada e estacionamento. Serve para mostrar como seria uma ficha de hospedagem.', 'draft')
) as v(slug, locale, name, short, description, status)
join public.places p on p.slug = v.slug and not p.managed_in_panel;

delete from public.sources
  where place_id in (select id from public.places where slug in ('playa-papudo', 'playa-chica-papudo', 'papudo-pullally', 'papudo-salinas-pullally', 'roots-salinas', 'papudo-playa-los-lilenes', 'papudo-parque', 'papudo-plaza', 'iglesia-nuestra-senora-de-las-mercedes', 'humedal-urbano-estero-agua-salada', 'caleta-de-pescadores-papudo', 'restaurante-donde-pablo', 'fuente-papudo', 'hotel-carande', 'playa-grande-papudo', 'playa-espejito', 'playa-las-playillas', 'playa-de-los-changos', 'quebrada-del-maqui', 'quebrada-del-frances', 'templo-san-pedro-pescador', 'edificio-consistorial', 'chalet-recart', 'gruta-virgen-de-lourdes', 'parque-de-pullally', 'la-casona-pullally', 'la-santita-pullally', 'el-llano-pullally', 'bosque-relicto-de-olivillos', 'dunas-las-salinas', 'cabalgatas-lilen', 'pintarroja-dive-center', 'gorgonia-expediciones', 'intemperie-turismo', 'la-vasija-de-sol', 'arriendo-de-kayak-papudo', 'empopado', 'buenaventura-paseos-en-lancha', 'awkan-ecoturismo', 'feria-artesanal-manos-papudanas', 'feria-de-verduras-papudo', 'feria-artesanal-espacio-parque', 'feria-artesanal-el-lilen', 'escuela-de-surf-salinas-experience', 'escuela-de-surf-salinas-de-pullally', 'feria-de-productores-pullally', 'feria-de-emprendedores-pullally', 'viveros-las-camelias', 'il-gabbiano', 'la-roca', 'la-canita', 'mamma-mia-papudo', 'la-plaza-restaurante', 'mar-de-luna', 'club-de-yates-papudo', 'casa-rivera', 'restaurante-rompe-olas', 'la-grota', 'casa-conaripe', 'la-catita', 'el-torres', 'sunshine-sushi', 'banana-papudo', 'tocato', 'bahia-lilen', 'gran-azul', 'puerto-madero-papudo', 'burgazo', 'papudoretro', 'la-casa-de-cesar', 'la-maison-des-fous', 'casa-hidalgo', 'la-quebrada-papudo', 'sabor-marino', 'la-mare', 'sazon-papudo', 'don-rola', 'chungungos', 'el-bunker', 'panaderia-soriano', 'panaderia-la-tinita', 'el-rey-de-la-quinoa', 'saborigenes', 'gran-z', 'casa-papudo-hotel-boutique', 'ambiente-mar', 'espacio-lila', 'cabanas-aquario', 'la-quebrada-lodge', 'residencial-la-plaza', 'cabanas-de-pepino', 'rustico-cabanas', 'residencial-papudo', 'hostal-la-abeja', 'cabanas-los-arrayanes', 'pura-vida-cabanas', 'hotel-plaza-papudo', 'hotel-moderno-petra-mar', 'arenas-de-papudo', 'hotel-rompe-olas', 'rancho-carmelitas', 'cabanas-angelo', 'refugio-las-salinas', 'ecocamping-santiago-waves', 'cabanas-los-troncos', 'demo-parador-ola-mansa', 'demo-cabalgatas-del-valle', 'demo-escuela-de-surf-ola-brava', 'demo-circuito-casas-antiguas', 'demo-cocineria-sabor-a-mar', 'demo-huerta-y-quesos-el-retono', 'demo-cabanas-brisa-salina') and not managed_in_panel);
insert into public.sources (place_id, sort_order, title, url)
select p.id, v.sort_order, v.title, v.url
from (values
  ('playa-papudo', 0, 'PlayasDeChile.com — Playas en Papudo', 'https://www.playasdechile.com/playas-en-papudo/'),
  ('playa-papudo', 1, 'Chilevisión — Sabingo: buceo en Papudo', 'https://www.chilevision.cl/programas/sabingo/rutas-turisticas/dani-urrizola-aprendio-a-bucear-en-las-maravillosas-playas-de-papudo'),
  ('playa-chica-papudo', 0, 'Tripadvisor — Playa Chica, Papudo', 'https://www.tripadvisor.com/Attraction_Review-g2161325-d6726685-Reviews-Playa_Chica-Papudo_Valparaiso_Region.html'),
  ('playa-chica-papudo', 1, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('papudo-pullally', 0, 'Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma', 'https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma'),
  ('papudo-pullally', 1, 'Consejo de Monumentos Nacionales — Santuario Humedal Salinas de Pullally - Dunas de Longotoma', 'https://www.monumentos.gob.cl/monumentos/santuarios-de-la-naturaleza/humedal-salinas-de-pullally-dunas-de-longotoma'),
  ('papudo-pullally', 2, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('papudo-salinas-pullally', 0, 'Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma', 'https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma'),
  ('papudo-salinas-pullally', 1, 'Consejo de Monumentos Nacionales — Santuario Humedal Salinas de Pullally - Dunas de Longotoma', 'https://www.monumentos.gob.cl/monumentos/santuarios-de-la-naturaleza/humedal-salinas-de-pullally-dunas-de-longotoma'),
  ('papudo-salinas-pullally', 2, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('roots-salinas', 0, 'Google Maps — Roots Salinas (HHMQ+F7, Papudo)', 'https://maps.app.goo.gl/JN5FnoUCrZ6MjZXK8'),
  ('roots-salinas', 1, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('papudo-playa-los-lilenes', 0, 'tres60.travel — El Lilén, la playa escondida de Chile', 'https://tres60.travel/el-lilen-la-playa-escondida-de-chile-que-combina-naturaleza-y-tranquilidad/'),
  ('papudo-playa-los-lilenes', 1, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('papudo-parque', 0, 'PlayasDeChile.com — Playas en Papudo', 'https://www.playasdechile.com/playas-en-papudo/'),
  ('papudo-parque', 1, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('papudo-plaza', 0, 'Valparaíso Región — Destino Papudo', 'http://www.vregion.cl/petorca/papudo/'),
  ('papudo-plaza', 1, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('iglesia-nuestra-senora-de-las-mercedes', 0, 'Wikipedia — Iglesia de Nuestra Señora de las Mercedes (Papudo)', 'https://en.wikipedia.org/wiki/Iglesia_de_Nuestra_Se%C3%B1ora_de_las_Mercedes_(Papudo)'),
  ('iglesia-nuestra-senora-de-las-mercedes', 1, 'Academia X-Ray — Historia y arquitectura de la iglesia', 'https://academiaxray.cl/blog/iglesia-nuestra-senora-de-las-mercedes-papudo/'),
  ('iglesia-nuestra-senora-de-las-mercedes', 2, 'EcuRed — Papudo (Chile)', 'https://www.ecured.cu/Papudo_(Chile)'),
  ('iglesia-nuestra-senora-de-las-mercedes', 3, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('humedal-urbano-estero-agua-salada', 0, 'Redimin — Tribunal Ambiental y Humedal Urbano Estero Agua Salada', 'https://www.redimin.cl/segundo-tribunal-ambiental-rechazo-reclamacion-de-consorcio-punta-puyai-contra-declaracion-del-humedal-urbano-estero-agua-salada-en-papudo'),
  ('humedal-urbano-estero-agua-salada', 1, 'Segundo Tribunal Ambiental — Sentencia R-354-2022', 'https://www.diarioconstitucional.cl/wp-content/uploads/2023/07/R-354-2022_19-07-2023_Sentencia.pdf'),
  ('humedal-urbano-estero-agua-salada', 2, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('caleta-de-pescadores-papudo', 0, 'EcuRed — Papudo (Chile)', 'https://www.ecured.cu/Papudo_(Chile)'),
  ('caleta-de-pescadores-papudo', 1, 'Infraestructura Pública — DOP confirma avances en nueva caleta para Papudo', 'https://www.infraestructurapublica.cl/?p=79866'),
  ('caleta-de-pescadores-papudo', 2, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('restaurante-donde-pablo', 0, 'Tripadvisor — Donde Pablo, Papudo', 'https://www.tripadvisor.co.nz/Restaurant_Review-g2161325-d10663184-Reviews-Donde_Pablo-Papudo_Valparaiso_Region.html'),
  ('restaurante-donde-pablo', 1, 'Diario Uno — El restaurante enfrente de la playa en Papudo', 'https://www.diariouno.com.ar/el-restaurante-enfrente-la-playa-papudo-varias-opciones-menos-30000-n1516569'),
  ('restaurante-donde-pablo', 2, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('fuente-papudo', 0, 'El Mercurio de Valparaíso — De tapas y copas (2024)', 'https://www.mercuriovalpo.cl/impresa/2024/04/26/full/cuerpo-principal/24'),
  ('fuente-papudo', 1, 'Diario Uno — Restaurantes de Papudo', 'https://www.diariouno.com.ar/el-restaurante-papudo-que-ofrece-un-delicioso-pastel-jaiba-menos-15000-argentinos-n1525552'),
  ('fuente-papudo', 2, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('hotel-carande', 0, 'Fodor''s — Hotel Carande', 'https://www.fodors.com/world/south-america/chile/the-central-coast/hotels/reviews/hotel-carande-442059'),
  ('hotel-carande', 1, 'Kayak — Hotel Carande, Papudo', 'https://www.kayak.com/Papudo-Hotels-Hotel-Carande.2918681.ksp'),
  ('hotel-carande', 2, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('playa-grande-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('playa-espejito', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('playa-las-playillas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('playa-de-los-changos', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('quebrada-del-maqui', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('quebrada-del-frances', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('templo-san-pedro-pescador', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('edificio-consistorial', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('chalet-recart', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('gruta-virgen-de-lourdes', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('parque-de-pullally', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-casona-pullally', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-santita-pullally', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('el-llano-pullally', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('bosque-relicto-de-olivillos', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('dunas-las-salinas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('cabalgatas-lilen', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('pintarroja-dive-center', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('gorgonia-expediciones', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('intemperie-turismo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-vasija-de-sol', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('arriendo-de-kayak-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('empopado', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('buenaventura-paseos-en-lancha', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('awkan-ecoturismo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('feria-artesanal-manos-papudanas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('feria-de-verduras-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('feria-artesanal-espacio-parque', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('feria-artesanal-el-lilen', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('escuela-de-surf-salinas-experience', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('escuela-de-surf-salinas-de-pullally', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('feria-de-productores-pullally', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('feria-de-emprendedores-pullally', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('viveros-las-camelias', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('il-gabbiano', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-roca', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-canita', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('mamma-mia-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-plaza-restaurante', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('mar-de-luna', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('club-de-yates-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('casa-rivera', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('restaurante-rompe-olas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-grota', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('casa-conaripe', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-catita', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('el-torres', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('sunshine-sushi', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('banana-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('tocato', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('bahia-lilen', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('gran-azul', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('puerto-madero-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('burgazo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('papudoretro', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-casa-de-cesar', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-maison-des-fous', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('casa-hidalgo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-quebrada-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('sabor-marino', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-mare', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('sazon-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('don-rola', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('chungungos', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('el-bunker', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('panaderia-soriano', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('panaderia-la-tinita', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('el-rey-de-la-quinoa', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('saborigenes', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('gran-z', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('casa-papudo-hotel-boutique', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('ambiente-mar', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('espacio-lila', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('cabanas-aquario', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('la-quebrada-lodge', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('residencial-la-plaza', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('cabanas-de-pepino', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('rustico-cabanas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('residencial-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('hostal-la-abeja', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('cabanas-los-arrayanes', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('pura-vida-cabanas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('hotel-plaza-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('hotel-moderno-petra-mar', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('arenas-de-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('hotel-rompe-olas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('rancho-carmelitas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('cabanas-angelo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('refugio-las-salinas', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('ecocamping-santiago-waves', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('cabanas-los-troncos', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl')
) as v(slug, sort_order, title, url)
join public.places p on p.slug = v.slug and not p.managed_in_panel;

delete from public.place_hours
  where place_id in (select id from public.places where slug in ('playa-papudo', 'playa-chica-papudo', 'papudo-pullally', 'papudo-salinas-pullally', 'roots-salinas', 'papudo-playa-los-lilenes', 'papudo-parque', 'papudo-plaza', 'iglesia-nuestra-senora-de-las-mercedes', 'humedal-urbano-estero-agua-salada', 'caleta-de-pescadores-papudo', 'restaurante-donde-pablo', 'fuente-papudo', 'hotel-carande', 'playa-grande-papudo', 'playa-espejito', 'playa-las-playillas', 'playa-de-los-changos', 'quebrada-del-maqui', 'quebrada-del-frances', 'templo-san-pedro-pescador', 'edificio-consistorial', 'chalet-recart', 'gruta-virgen-de-lourdes', 'parque-de-pullally', 'la-casona-pullally', 'la-santita-pullally', 'el-llano-pullally', 'bosque-relicto-de-olivillos', 'dunas-las-salinas', 'cabalgatas-lilen', 'pintarroja-dive-center', 'gorgonia-expediciones', 'intemperie-turismo', 'la-vasija-de-sol', 'arriendo-de-kayak-papudo', 'empopado', 'buenaventura-paseos-en-lancha', 'awkan-ecoturismo', 'feria-artesanal-manos-papudanas', 'feria-de-verduras-papudo', 'feria-artesanal-espacio-parque', 'feria-artesanal-el-lilen', 'escuela-de-surf-salinas-experience', 'escuela-de-surf-salinas-de-pullally', 'feria-de-productores-pullally', 'feria-de-emprendedores-pullally', 'viveros-las-camelias', 'il-gabbiano', 'la-roca', 'la-canita', 'mamma-mia-papudo', 'la-plaza-restaurante', 'mar-de-luna', 'club-de-yates-papudo', 'casa-rivera', 'restaurante-rompe-olas', 'la-grota', 'casa-conaripe', 'la-catita', 'el-torres', 'sunshine-sushi', 'banana-papudo', 'tocato', 'bahia-lilen', 'gran-azul', 'puerto-madero-papudo', 'burgazo', 'papudoretro', 'la-casa-de-cesar', 'la-maison-des-fous', 'casa-hidalgo', 'la-quebrada-papudo', 'sabor-marino', 'la-mare', 'sazon-papudo', 'don-rola', 'chungungos', 'el-bunker', 'panaderia-soriano', 'panaderia-la-tinita', 'el-rey-de-la-quinoa', 'saborigenes', 'gran-z', 'casa-papudo-hotel-boutique', 'ambiente-mar', 'espacio-lila', 'cabanas-aquario', 'la-quebrada-lodge', 'residencial-la-plaza', 'cabanas-de-pepino', 'rustico-cabanas', 'residencial-papudo', 'hostal-la-abeja', 'cabanas-los-arrayanes', 'pura-vida-cabanas', 'hotel-plaza-papudo', 'hotel-moderno-petra-mar', 'arenas-de-papudo', 'hotel-rompe-olas', 'rancho-carmelitas', 'cabanas-angelo', 'refugio-las-salinas', 'ecocamping-santiago-waves', 'cabanas-los-troncos', 'demo-parador-ola-mansa', 'demo-cabalgatas-del-valle', 'demo-escuela-de-surf-ola-brava', 'demo-circuito-casas-antiguas', 'demo-cocineria-sabor-a-mar', 'demo-huerta-y-quesos-el-retono', 'demo-cabanas-brisa-salina') and not managed_in_panel);
insert into public.place_hours (place_id, day_of_week, opens_at, closes_at, from_month, to_month, holidays)
select p.id, v.day::smallint, v.opens::time, v.closes::time, v.from_month::smallint, v.to_month::smallint, v.holidays
from (values
  ('roots-salinas', 0, '09:00', '22:00', 1, 2, false),
  ('roots-salinas', 1, '09:00', '22:00', 1, 2, false),
  ('roots-salinas', 2, '09:00', '22:00', 1, 2, false),
  ('roots-salinas', 3, '09:00', '22:00', 1, 2, false),
  ('roots-salinas', 4, '09:00', '22:00', 1, 2, false),
  ('roots-salinas', 5, '09:00', '22:00', 1, 2, false),
  ('roots-salinas', 6, '09:00', '22:00', 1, 2, false),
  ('roots-salinas', 0, '10:00', '19:00', 3, 12, true),
  ('roots-salinas', 6, '10:00', '19:00', 3, 12, true)
) as v(slug, day, opens, closes, from_month, to_month, holidays)
join public.places p on p.slug = v.slug and not p.managed_in_panel;
delete from public.place_images
  where storage_path like '/%'
    and place_id in (select id from public.places where slug in ('playa-papudo', 'playa-chica-papudo', 'papudo-pullally', 'papudo-salinas-pullally', 'roots-salinas', 'papudo-playa-los-lilenes', 'papudo-parque', 'papudo-plaza', 'iglesia-nuestra-senora-de-las-mercedes', 'humedal-urbano-estero-agua-salada', 'caleta-de-pescadores-papudo', 'restaurante-donde-pablo', 'fuente-papudo', 'hotel-carande', 'playa-grande-papudo', 'playa-espejito', 'playa-las-playillas', 'playa-de-los-changos', 'quebrada-del-maqui', 'quebrada-del-frances', 'templo-san-pedro-pescador', 'edificio-consistorial', 'chalet-recart', 'gruta-virgen-de-lourdes', 'parque-de-pullally', 'la-casona-pullally', 'la-santita-pullally', 'el-llano-pullally', 'bosque-relicto-de-olivillos', 'dunas-las-salinas', 'cabalgatas-lilen', 'pintarroja-dive-center', 'gorgonia-expediciones', 'intemperie-turismo', 'la-vasija-de-sol', 'arriendo-de-kayak-papudo', 'empopado', 'buenaventura-paseos-en-lancha', 'awkan-ecoturismo', 'feria-artesanal-manos-papudanas', 'feria-de-verduras-papudo', 'feria-artesanal-espacio-parque', 'feria-artesanal-el-lilen', 'escuela-de-surf-salinas-experience', 'escuela-de-surf-salinas-de-pullally', 'feria-de-productores-pullally', 'feria-de-emprendedores-pullally', 'viveros-las-camelias', 'il-gabbiano', 'la-roca', 'la-canita', 'mamma-mia-papudo', 'la-plaza-restaurante', 'mar-de-luna', 'club-de-yates-papudo', 'casa-rivera', 'restaurante-rompe-olas', 'la-grota', 'casa-conaripe', 'la-catita', 'el-torres', 'sunshine-sushi', 'banana-papudo', 'tocato', 'bahia-lilen', 'gran-azul', 'puerto-madero-papudo', 'burgazo', 'papudoretro', 'la-casa-de-cesar', 'la-maison-des-fous', 'casa-hidalgo', 'la-quebrada-papudo', 'sabor-marino', 'la-mare', 'sazon-papudo', 'don-rola', 'chungungos', 'el-bunker', 'panaderia-soriano', 'panaderia-la-tinita', 'el-rey-de-la-quinoa', 'saborigenes', 'gran-z', 'casa-papudo-hotel-boutique', 'ambiente-mar', 'espacio-lila', 'cabanas-aquario', 'la-quebrada-lodge', 'residencial-la-plaza', 'cabanas-de-pepino', 'rustico-cabanas', 'residencial-papudo', 'hostal-la-abeja', 'cabanas-los-arrayanes', 'pura-vida-cabanas', 'hotel-plaza-papudo', 'hotel-moderno-petra-mar', 'arenas-de-papudo', 'hotel-rompe-olas', 'rancho-carmelitas', 'cabanas-angelo', 'refugio-las-salinas', 'ecocamping-santiago-waves', 'cabanas-los-troncos', 'demo-parador-ola-mansa', 'demo-cabalgatas-del-valle', 'demo-escuela-de-surf-ola-brava', 'demo-circuito-casas-antiguas', 'demo-cocineria-sabor-a-mar', 'demo-huerta-y-quesos-el-retono', 'demo-cabanas-brisa-salina') and not managed_in_panel);
insert into public.place_images (place_id, storage_path, kind, width, height, alt_text, alt_text_en, alt_text_pt, credit, position)
select p.id, v.path, v.kind, v.width::integer, v.height::integer, v.alt, v.alt_en, v.alt_pt, v.credit, v.position::integer
from (values
  ('roots-salinas', '/lugares/roots-salinas/logo.webp', 'logo', 320, 320, 'Logo de Roots Salinas', 'Roots Salinas logo', 'Logo de Roots Salinas', 'Roots Salinas', 0),
  ('roots-salinas', '/lugares/roots-salinas/carta.webp', 'menu', 1536, 1024, 'Carta de Roots Salinas con precios: churrascos y hamburguesas, bebestibles, helados y churros, completos, pizzas y fajitas, choclo y empanadas, cono de papas, chorrillanas y salchipapas.', 'Roots Salinas menu with prices: churrascos and burgers, drinks, ice cream and churros, hot dogs, pizzas and fajitas, corn cups and empanadas, fries cones, chorrillana and salchipapas.', 'Cardápio do Roots Salinas com preços: churrascos e hambúrgueres, bebidas, sorvetes e churros, cachorros-quentes, pizzas e fajitas, milho e empanadas, cone de batatas, chorrillana e salchipapas.', 'Roots Salinas', 1),
  ('roots-salinas', '/lugares/roots-salinas/promo-combos.webp', 'promo', 1600, 900, 'Promoción de Roots Salinas: combo clásico de hamburguesa, papas fritas y bebida, y papas fritas con salsa cheddar.', 'Roots Salinas promotion: classic combo of burger, fries and a drink, and fries with cheddar sauce.', 'Promoção do Roots Salinas: combo clássico de hambúrguer, batata frita e bebida, e batata frita com molho cheddar.', 'Roots Salinas', 2),
  ('roots-salinas', '/lugares/roots-salinas/promo-conoce-roots.webp', 'promo', 1600, 900, 'Publicidad de Roots: hamburguesas premium, colaciones y papas fritas, con delivery o retiro en el local.', 'Roots advertisement: premium burgers, set meals and fries, with delivery or pick-up.', 'Publicidade do Roots: hambúrgueres premium, refeições e batatas fritas, com delivery ou retirada no local.', 'Roots Salinas', 3)
) as v(slug, path, kind, width, height, alt, alt_en, alt_pt, credit, position)
join public.places p on p.slug = v.slug and not p.managed_in_panel;
update public.places p set
  cta_kind = coalesce(p.cta_kind, v.cta_kind), cta_value = coalesce(p.cta_value, v.cta_value),
  info_updated_at = coalesce(p.info_updated_at, v.info_updated_at::timestamptz)
from (values
  ('roots-salinas', 'whatsapp', '+56 9 7270 2991', '2026-10-17T03:53:04Z'),
  ('cabalgatas-lilen', 'phone', '+56 9 4440 9698', null),
  ('pintarroja-dive-center', 'phone', '+56 9 9883 0988', null),
  ('gorgonia-expediciones', 'phone', '+56 9 3066 0804', null),
  ('intemperie-turismo', 'phone', '+56 9 8362 9476', null),
  ('la-vasija-de-sol', 'phone', '+56 9 5395 2490', null),
  ('arriendo-de-kayak-papudo', 'phone', '+56 9 5407 4251', null),
  ('buenaventura-paseos-en-lancha', 'phone', '+56 9 8810 9808', null),
  ('awkan-ecoturismo', 'phone', '+56 9 2709 1378', null),
  ('viveros-las-camelias', 'phone', '+56 9 8413 5191', null),
  ('mamma-mia-papudo', 'phone', '+56 9 6309 1899', null),
  ('casa-rivera', 'phone', '+56 9 9630 7364', null),
  ('restaurante-rompe-olas', 'phone', '+56 9 6919 3048', null),
  ('la-grota', 'phone', '+56 9 9379 1134', null),
  ('casa-conaripe', 'phone', '+56 9 6451 0177', null),
  ('la-catita', 'phone', '+56 9 8805 6248', null),
  ('el-torres', 'phone', '+56 9 8903 3175', null),
  ('sunshine-sushi', 'phone', '+56 9 9525 4584', null),
  ('tocato', 'phone', '+56 9 4013 8577', null),
  ('bahia-lilen', 'phone', '+56 9 9201 1917', null),
  ('burgazo', 'phone', '+56 9 3079 5042', null),
  ('la-casa-de-cesar', 'phone', '+56 33 279 0384', null),
  ('la-maison-des-fous', 'phone', '+56 9 9216 2447', null),
  ('casa-hidalgo', 'phone', '+56 9 8979 4016', null),
  ('la-quebrada-papudo', 'phone', '+56 9 7837 9155', null),
  ('sabor-marino', 'phone', '+56 9 6706 7130', null),
  ('la-mare', 'phone', '+56 9 4047 7012', null),
  ('sazon-papudo', 'phone', '+56 9 4262 8192', null),
  ('don-rola', 'phone', '+56 9 5323 5645', null),
  ('chungungos', 'phone', '+56 9 6695 7059', null),
  ('el-bunker', 'phone', '+56 9 8470 1156', null),
  ('panaderia-soriano', 'phone', '+56 9 4509 4747', null),
  ('panaderia-la-tinita', 'phone', '+56 9 6465 0441', null),
  ('el-rey-de-la-quinoa', 'phone', '+56 9 9123 1796', null),
  ('saborigenes', 'phone', '+56 9 8559 9670', null),
  ('gran-z', 'phone', '+56 9 4598 2985', null),
  ('ambiente-mar', 'phone', '+56 9 6607 5483', null),
  ('espacio-lila', 'phone', '+56 9 9093 1464', null),
  ('cabanas-aquario', 'phone', '+56 9 9789 0355', null),
  ('la-quebrada-lodge', 'phone', '+56 9 8136 6391', null),
  ('residencial-la-plaza', 'phone', '+56 9 6633 3158', null),
  ('cabanas-de-pepino', 'phone', '+56 9 4005 3243', null),
  ('rustico-cabanas', 'phone', '+56 9 9532 8136', null),
  ('residencial-papudo', 'phone', '+56 9 8649 4740', null),
  ('hostal-la-abeja', 'phone', '+56 9 7491 3423', null),
  ('cabanas-los-arrayanes', 'phone', '+56 9 9744 6270', null),
  ('pura-vida-cabanas', 'phone', '+56 9 4545 4885', null),
  ('hotel-plaza-papudo', 'phone', '+56 9 9574 5282', null),
  ('hotel-moderno-petra-mar', 'phone', '+56 9 7478 7820', null),
  ('arenas-de-papudo', 'phone', '+56 9 7478 7820', null),
  ('hotel-rompe-olas', 'phone', '+56 9 6919 3048', null),
  ('rancho-carmelitas', 'phone', '+56 9 6727 4017', null),
  ('cabanas-angelo', 'phone', '+56 9 4887 0353', null),
  ('refugio-las-salinas', 'phone', '+56 9 8479 4757', null),
  ('ecocamping-santiago-waves', 'phone', '+56 9 8648 9027', null),
  ('cabanas-los-troncos', 'phone', '+56 9 8527 5993', null)
) as v(slug, cta_kind, cta_value, info_updated_at)
where p.slug = v.slug and not p.managed_in_panel and (p.cta_kind is null or p.info_updated_at is null);

-- Eventos recurrentes
insert into public.events (slug, sort_order, category_id, locality_id, recurrence_month, recurrence_day, season, featured, is_demo, illustration)
select v.slug, v.sort_order, c.id, l.id, v.month::smallint, v.day::smallint, v.season, v.featured, v.is_demo, v.illustration
from (values
  ('feria-internacional-integracion-papudo', 1, 'gastronomia', 'papudo', 2, null, null, true, false, 'feria'),
  ('festival-de-verano-papudo', 2, 'recreacion', 'papudo', null, null, 'summer', false, false, null),
  ('glorias-navales-papudo', 3, 'patrimonio', 'papudo', 5, 21, null, false, false, null),
  ('fiesta-de-san-pedro', 4, 'patrimonio', 'papudo', 7, null, null, true, false, 'procesion'),
  ('fiestas-patrias-papudo', 5, 'patrimonio', 'papudo', 9, null, null, false, false, 'fondas'),
  ('combate-naval-de-papudo', 6, 'patrimonio', 'papudo', 11, 26, null, true, false, 'buque'),
  ('fiesta-costumbrista-pullally', 7, 'ruralidad', 'pullally', null, null, null, false, false, null),
  ('ano-nuevo-junto-al-mar', 8, 'recreacion', 'papudo', 1, null, null, false, false, null),
  ('noche-del-tango', 9, 'recreacion', 'papudo', 1, null, null, false, false, null),
  ('concurso-castillos-de-arena', 10, 'balneario', 'papudo', 1, null, null, false, false, null),
  ('expo-vive-papudo', 11, 'recreacion', 'papudo', 2, null, null, false, false, null),
  ('noche-del-pescador', 12, 'gastronomia', 'papudo', 2, null, null, false, false, null),
  ('noche-del-vino', 13, 'gastronomia', 'papudo', 2, null, null, false, false, null),
  ('trilla-de-la-quinoa', 14, 'ruralidad', null, 2, null, null, false, false, null),
  ('topman-triatlon', 15, 'deportes', 'papudo', 4, null, null, false, false, null),
  ('gran-fiesta-de-el-llano', 16, 'ruralidad', 'pullally', 9, null, null, false, false, null),
  ('carreras-a-la-chilena-parque-urbano', 17, 'ruralidad', null, 9, null, null, false, false, null),
  ('dia-de-muertos-papudo', 18, 'patrimonio', 'papudo', 10, null, null, false, false, null),
  ('feria-gastronomica-y-cervecera', 19, 'gastronomia', 'papudo', 10, null, null, false, false, null),
  ('trineos-del-viejito-pascuero', 20, 'recreacion', 'papudo', 12, null, null, false, false, null),
  ('demo-noche-de-bandas', 21, 'recreacion', 'papudo', 1, null, 'summer', false, true, 'musica'),
  ('demo-cata-de-mariscos', 22, 'gastronomia', 'papudo', 2, null, null, false, true, 'mariscos')
) as v(slug, sort_order, category, locality, month, day, season, featured, is_demo, illustration)
join public.categories c on c.slug = v.category
left join public.localities l on l.slug = v.locality
on conflict (slug) do update set
  sort_order = excluded.sort_order, category_id = excluded.category_id, locality_id = excluded.locality_id,
  recurrence_month = excluded.recurrence_month, recurrence_day = excluded.recurrence_day,
  season = excluded.season, featured = excluded.featured, is_demo = excluded.is_demo,
  illustration = excluded.illustration;

delete from public.event_translations
  where event_id in (select id from public.events where slug in ('feria-internacional-integracion-papudo', 'festival-de-verano-papudo', 'glorias-navales-papudo', 'fiesta-de-san-pedro', 'fiestas-patrias-papudo', 'combate-naval-de-papudo', 'fiesta-costumbrista-pullally', 'ano-nuevo-junto-al-mar', 'noche-del-tango', 'concurso-castillos-de-arena', 'expo-vive-papudo', 'noche-del-pescador', 'noche-del-vino', 'trilla-de-la-quinoa', 'topman-triatlon', 'gran-fiesta-de-el-llano', 'carreras-a-la-chilena-parque-urbano', 'dia-de-muertos-papudo', 'feria-gastronomica-y-cervecera', 'trineos-del-viejito-pascuero', 'demo-noche-de-bandas', 'demo-cata-de-mariscos'));
insert into public.event_translations (event_id, locale, name, description, translation_status)
select e.id, v.locale::public.locale, v.name, v.description, v.status::public.translation_status
from (values
  ('feria-internacional-integracion-papudo', 'es', 'Feria Internacional de Integración de Papudo (FIP)', 'Cada febrero reúne música, artesanos, productores y diseñadores de distintos países, con foco en productos gourmet, vitivinícolas y olivícolas, y en estrechar lazos con provincias de Argentina.', null),
  ('feria-internacional-integracion-papudo', 'en', 'Papudo International Integration Fair (FIP)', 'Every February it brings together music, artisans, producers and designers from several countries, with a focus on gourmet, wine and olive products and on strengthening ties with Argentine provinces.', 'draft'),
  ('festival-de-verano-papudo', 'es', 'Festival de Verano Papudo', 'Festival de la temporada estival que el PLADETUR lista entre las actividades de la comuna. Fechas y programa por confirmar con la Municipalidad.', null),
  ('festival-de-verano-papudo', 'en', 'Papudo Summer Festival', 'Summer-season festival that the PLADETUR lists among the commune''s activities. Dates and programme to be confirmed with the Municipality.', 'draft'),
  ('glorias-navales-papudo', 'es', 'Día de las Glorias Navales', 'Desfile y ceremonia por las glorias navales, una de las celebraciones nacionales que la comunidad de Papudo vive con desfiles.', null),
  ('glorias-navales-papudo', 'en', 'Naval Glories Day', 'Parade and ceremony for Chile''s naval glories, one of the national celebrations that the Papudo community marks with parades.', 'draft'),
  ('fiesta-de-san-pedro', 'es', 'Fiesta de San Pedro', 'Fiesta religiosa de julio: procesión desde el Templo San Pedro Pescador por las calles hasta la caleta, con la imagen escoltada por pescadores, paseos de lancha y misa en la Iglesia Nuestra Señora de las Mercedes.', null),
  ('fiesta-de-san-pedro', 'en', 'Saint Peter''s Festival', 'July religious festival: a procession from the San Pedro Pescador church through the streets to the fishing cove, with the image escorted by fishermen, boat rides and mass at Nuestra Señora de las Mercedes church.', 'draft'),
  ('fiestas-patrias-papudo', 'es', 'Fiestas Patrias', 'Carreras a la chilena, desfile, fondas y juegos populares, además de fiestas costumbristas en Pullally y en Playa Chica según el PLADETUR.', null),
  ('fiestas-patrias-papudo', 'en', 'Chilean Independence Day celebrations', 'Chilean-style horse races, a parade, fondas and traditional games, plus traditional fairs in Pullally and Playa Chica according to the PLADETUR.', 'draft'),
  ('combate-naval-de-papudo', 'es', 'Aniversario del Combate Naval de Papudo', 'Cada 26 de noviembre se conmemora el combate de 1865 con una ceremonia y un desfile cívico-militar junto al monumento a los héroes, con la Armada, autoridades y escuelas. En 2025 se cumplieron 160 años.', null),
  ('combate-naval-de-papudo', 'en', 'Anniversary of the Naval Combat of Papudo', 'Every 26 November the 1865 combat is commemorated with a civic-military ceremony and parade by the heroes'' monument, with the Navy, authorities and schools. 2025 marked 160 years.', 'draft'),
  ('fiesta-costumbrista-pullally', 'es', 'Fiesta Costumbrista en Pullally', 'Fiesta de las tradiciones del campo, coordinada por la Municipalidad con emprendedores y la red de turismo local de Pullally. Fecha por confirmar.', null),
  ('fiesta-costumbrista-pullally', 'en', 'Traditional Fair in Pullally', 'Festival of countryside traditions, coordinated by the Municipality with entrepreneurs and Pullally''s local tourism network. Date to be confirmed.', 'draft'),
  ('ano-nuevo-junto-al-mar', 'es', 'Fiesta de Año Nuevo junto al mar', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('ano-nuevo-junto-al-mar', 'en', 'New Year by the sea', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('noche-del-tango', 'es', 'Noche del Tango', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('noche-del-tango', 'en', 'Tango Night', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('concurso-castillos-de-arena', 'es', 'Concurso de castillos de arena', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('concurso-castillos-de-arena', 'en', 'Sandcastle contest', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('expo-vive-papudo', 'es', 'Expo Vive Papudo', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('expo-vive-papudo', 'en', 'Expo Vive Papudo', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('noche-del-pescador', 'es', 'Noche del Pescador', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('noche-del-pescador', 'en', 'Fisherman''s Night', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('noche-del-vino', 'es', 'Noche del Vino', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('noche-del-vino', 'en', 'Wine Night', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('trilla-de-la-quinoa', 'es', 'La Trilla de la Quinoa', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('trilla-de-la-quinoa', 'en', 'Quinoa threshing festival', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('topman-triatlon', 'es', 'Topman Triatlón', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('topman-triatlon', 'en', 'Topman Triathlon', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('gran-fiesta-de-el-llano', 'es', 'Gran Fiesta de El Llano', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('gran-fiesta-de-el-llano', 'en', 'El Llano grand festival', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('carreras-a-la-chilena-parque-urbano', 'es', 'Carreras a la chilena en el Parque Urbano', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('carreras-a-la-chilena-parque-urbano', 'en', 'Chilean horse races at the Urban Park', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('dia-de-muertos-papudo', 'es', 'Día de Muertos', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('dia-de-muertos-papudo', 'en', 'Day of the Dead', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('feria-gastronomica-y-cervecera', 'es', 'Feria Gastronómica y Cervecera', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('feria-gastronomica-y-cervecera', 'en', 'Food and craft beer fair', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('trineos-del-viejito-pascuero', 'es', 'Trineos del Viejito Pascuero', 'Parte del calendario de festividades de la Municipalidad de Papudo.', null),
  ('trineos-del-viejito-pascuero', 'en', 'Santa Claus sleighs', 'Part of the Municipality of Papudo festival calendar.', 'draft'),
  ('demo-noche-de-bandas', 'es', 'Noche de bandas en la costanera (ejemplo)', 'Música en vivo con bandas locales, feria de artesanía y comida al paso frente al mar.', null),
  ('demo-noche-de-bandas', 'en', 'Band night on the seafront (example)', 'Live music from local bands, a craft fair and street food by the sea.', 'draft'),
  ('demo-noche-de-bandas', 'pt', 'Noite de bandas na orla (exemplo)', 'Música ao vivo com bandas locais, feira de artesanato e comida de rua de frente para o mar.', 'draft'),
  ('demo-cata-de-mariscos', 'es', 'Cata de mariscos en la caleta (ejemplo)', 'Degustación de productos del mar con pescadores y cocineras de la zona.', null),
  ('demo-cata-de-mariscos', 'en', 'Seafood tasting at the cove (example)', 'Tasting of seafood with local fishermen and cooks.', 'draft'),
  ('demo-cata-de-mariscos', 'pt', 'Degustação de frutos do mar na caleta (exemplo)', 'Degustação de produtos do mar com pescadores e cozinheiras da região.', 'draft')
) as v(slug, locale, name, description, status)
join public.events e on e.slug = v.slug;

delete from public.sources
  where event_id in (select id from public.events where slug in ('feria-internacional-integracion-papudo', 'festival-de-verano-papudo', 'glorias-navales-papudo', 'fiesta-de-san-pedro', 'fiestas-patrias-papudo', 'combate-naval-de-papudo', 'fiesta-costumbrista-pullally', 'ano-nuevo-junto-al-mar', 'noche-del-tango', 'concurso-castillos-de-arena', 'expo-vive-papudo', 'noche-del-pescador', 'noche-del-vino', 'trilla-de-la-quinoa', 'topman-triatlon', 'gran-fiesta-de-el-llano', 'carreras-a-la-chilena-parque-urbano', 'dia-de-muertos-papudo', 'feria-gastronomica-y-cervecera', 'trineos-del-viejito-pascuero', 'demo-noche-de-bandas', 'demo-cata-de-mariscos'));
insert into public.sources (event_id, sort_order, title, url)
select e.id, v.sort_order, v.title, v.url
from (values
  ('feria-internacional-integracion-papudo', 0, 'PLADETUR de Papudo, iD, 2023 (p. 79)', 'https://munipapudo.cl/municipalidad/accesos-directos/plan-de-desarrollo-turistico-pladetur'),
  ('festival-de-verano-papudo', 0, 'PLADETUR de Papudo, iD, 2023 (p. 188)', 'https://munipapudo.cl/municipalidad/accesos-directos/plan-de-desarrollo-turistico-pladetur'),
  ('glorias-navales-papudo', 0, 'G5 Noticias — Papudo realiza impecables desfiles (22-05-2023)', 'https://g5noticias.cl/2023/05/22/papudo-realiza-impecables-desfiles-en-conmemoracion-de-las-glorias-navales/'),
  ('glorias-navales-papudo', 1, 'PLADETUR de Papudo, iD, 2023 (p. 79)', 'https://munipapudo.cl/municipalidad/accesos-directos/plan-de-desarrollo-turistico-pladetur'),
  ('fiesta-de-san-pedro', 0, 'PLADETUR de Papudo, iD, 2023 (p. 79)', 'https://munipapudo.cl/municipalidad/accesos-directos/plan-de-desarrollo-turistico-pladetur'),
  ('fiestas-patrias-papudo', 0, 'PLADETUR de Papudo, iD, 2023 (p. 79)', 'https://munipapudo.cl/municipalidad/accesos-directos/plan-de-desarrollo-turistico-pladetur'),
  ('combate-naval-de-papudo', 0, 'La Ligua Noticias — Papudo conmemora 160° aniversario del Combate Naval (28-11-2025)', 'https://laliguanoticias.cl/2025/11/28/comuna-de-papudo-conmemora-160-aniversario-del-combate-naval-con-solemne-desfile-civico-militar/'),
  ('combate-naval-de-papudo', 1, 'Armada de Chile — 140° aniversario del Combate Naval de Papudo', 'https://www.armada.cl/noticias-navales/140-aniversario-del-combate-naval-de-papudo'),
  ('fiesta-costumbrista-pullally', 0, 'PLADETUR de Papudo, iD, 2023 (pp. 79 y 188)', 'https://munipapudo.cl/municipalidad/accesos-directos/plan-de-desarrollo-turistico-pladetur'),
  ('ano-nuevo-junto-al-mar', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('noche-del-tango', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('concurso-castillos-de-arena', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('expo-vive-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('noche-del-pescador', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('noche-del-vino', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('trilla-de-la-quinoa', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('topman-triatlon', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('gran-fiesta-de-el-llano', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('carreras-a-la-chilena-parque-urbano', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('dia-de-muertos-papudo', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('feria-gastronomica-y-cervecera', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl'),
  ('trineos-del-viejito-pascuero', 0, 'Guía Turística Papudo 2026 — Municipalidad de Papudo', 'https://www.munipapudo.cl')
) as v(slug, sort_order, title, url)
join public.events e on e.slug = v.slug;

-- Rutas y sus paradas
insert into public.routes (slug, sort_order, duration_minutes, cover_image_path) values
  ('ruta-costera-papudo', 1, null, '/rutas/ruta-costera-papudo.webp'),
  ('papudo-a-pie', 2, null, '/ilustraciones/paseo-costanera.webp')
on conflict (slug) do update set
  sort_order = excluded.sort_order, duration_minutes = excluded.duration_minutes, cover_image_path = excluded.cover_image_path;

delete from public.route_translations
  where route_id in (select id from public.routes where slug in ('ruta-costera-papudo', 'papudo-a-pie'));
insert into public.route_translations (route_id, locale, name, short_description, cover_alt, translation_status)
select r.id, v.locale::public.locale, v.name, v.description, v.cover_alt, v.status::public.translation_status
from (values
  ('ruta-costera-papudo', 'es', 'Ruta costera de Papudo', 'Del humedal al balneario: las Salinas de Pullally, a unos 12 km al norte del pueblo, y las playas del balneario, con Playa Chica como alternativa más resguardada.', 'Ilustración de la bahía de Papudo al atardecer: playa, paseo costero, humedal con aves y lomas de campo.', null),
  ('ruta-costera-papudo', 'en', 'Papudo coastal route', 'From wetland to seaside town: the Salinas de Pullally, about 12 km north of the town, and the resort''s beaches, with Playa Chica as the more sheltered option.', 'Illustration of Papudo bay at sunset: beach, seafront promenade, wetland with birds and countryside hills.', 'draft'),
  ('papudo-a-pie', 'es', 'Papudo a pie', 'Un paseo por el centro del balneario: la Plaza, Playa Chica y la playa principal, siguiendo el paseo La Terraza.', 'Ilustración de un paseo peatonal junto a la playa al atardecer, con familias caminando, puestos de artesanía y faroles.', null),
  ('papudo-a-pie', 'en', 'Papudo on foot', 'A stroll through the heart of the resort: the main square, Playa Chica and the main beach, along the La Terraza promenade.', 'Illustration of a seafront promenade at sunset, with families walking, craft stalls and street lamps.', 'draft')
) as v(slug, locale, name, description, cover_alt, status)
join public.routes r on r.slug = v.slug;

delete from public.route_stops
  where route_id in (select id from public.routes where slug in ('ruta-costera-papudo', 'papudo-a-pie'));
insert into public.route_stops (route_id, place_id, position)
select r.id, p.id, v.position
from (values
  ('ruta-costera-papudo', 0, 'papudo-salinas-pullally'),
  ('ruta-costera-papudo', 1, 'playa-papudo'),
  ('ruta-costera-papudo', 2, 'playa-chica-papudo'),
  ('papudo-a-pie', 0, 'papudo-plaza'),
  ('papudo-a-pie', 1, 'playa-chica-papudo'),
  ('papudo-a-pie', 2, 'playa-papudo'),
  ('papudo-a-pie', 3, 'papudo-parque')
) as v(route, position, place)
join public.routes r on r.slug = v.route
join public.places p on p.slug = v.place;


delete from public.sources
  where route_id in (select id from public.routes where slug in ('ruta-costera-papudo', 'papudo-a-pie'));
insert into public.sources (route_id, sort_order, title, url)
select r.id, v.sort_order, v.title, v.url
from (values
  ('ruta-costera-papudo', 0, 'minube — Qué ver en Papudo', 'https://www.minube.com/tips/actualidad/rincones-unicos-que-visitar-en-papudo-mar-y-montana-te-esperan'),
  ('papudo-a-pie', 0, 'PlayasDeChile.com — Playas en Papudo', 'https://www.playasdechile.com/playas-en-papudo/')
) as v(slug, sort_order, title, url)
join public.routes r on r.slug = v.slug;

-- Publicar (la verificación sigue en 'pending': nada está confirmado en terreno)
update public.places set publication_status = 'published'
  where slug in ('playa-papudo', 'playa-chica-papudo', 'papudo-pullally', 'papudo-salinas-pullally', 'roots-salinas', 'papudo-playa-los-lilenes', 'papudo-parque', 'papudo-plaza', 'iglesia-nuestra-senora-de-las-mercedes', 'humedal-urbano-estero-agua-salada', 'caleta-de-pescadores-papudo', 'restaurante-donde-pablo', 'fuente-papudo', 'hotel-carande', 'playa-grande-papudo', 'playa-espejito', 'playa-las-playillas', 'playa-de-los-changos', 'quebrada-del-maqui', 'quebrada-del-frances', 'templo-san-pedro-pescador', 'edificio-consistorial', 'chalet-recart', 'gruta-virgen-de-lourdes', 'parque-de-pullally', 'la-casona-pullally', 'la-santita-pullally', 'el-llano-pullally', 'bosque-relicto-de-olivillos', 'dunas-las-salinas', 'cabalgatas-lilen', 'pintarroja-dive-center', 'gorgonia-expediciones', 'intemperie-turismo', 'la-vasija-de-sol', 'arriendo-de-kayak-papudo', 'empopado', 'buenaventura-paseos-en-lancha', 'awkan-ecoturismo', 'feria-artesanal-manos-papudanas', 'feria-de-verduras-papudo', 'feria-artesanal-espacio-parque', 'feria-artesanal-el-lilen', 'escuela-de-surf-salinas-experience', 'escuela-de-surf-salinas-de-pullally', 'feria-de-productores-pullally', 'feria-de-emprendedores-pullally', 'viveros-las-camelias', 'il-gabbiano', 'la-roca', 'la-canita', 'mamma-mia-papudo', 'la-plaza-restaurante', 'mar-de-luna', 'club-de-yates-papudo', 'casa-rivera', 'restaurante-rompe-olas', 'la-grota', 'casa-conaripe', 'la-catita', 'el-torres', 'sunshine-sushi', 'banana-papudo', 'tocato', 'bahia-lilen', 'gran-azul', 'puerto-madero-papudo', 'burgazo', 'papudoretro', 'la-casa-de-cesar', 'la-maison-des-fous', 'casa-hidalgo', 'la-quebrada-papudo', 'sabor-marino', 'la-mare', 'sazon-papudo', 'don-rola', 'chungungos', 'el-bunker', 'panaderia-soriano', 'panaderia-la-tinita', 'el-rey-de-la-quinoa', 'saborigenes', 'gran-z', 'casa-papudo-hotel-boutique', 'ambiente-mar', 'espacio-lila', 'cabanas-aquario', 'la-quebrada-lodge', 'residencial-la-plaza', 'cabanas-de-pepino', 'rustico-cabanas', 'residencial-papudo', 'hostal-la-abeja', 'cabanas-los-arrayanes', 'pura-vida-cabanas', 'hotel-plaza-papudo', 'hotel-moderno-petra-mar', 'arenas-de-papudo', 'hotel-rompe-olas', 'rancho-carmelitas', 'cabanas-angelo', 'refugio-las-salinas', 'ecocamping-santiago-waves', 'cabanas-los-troncos', 'demo-parador-ola-mansa', 'demo-cabalgatas-del-valle', 'demo-escuela-de-surf-ola-brava', 'demo-circuito-casas-antiguas', 'demo-cocineria-sabor-a-mar', 'demo-huerta-y-quesos-el-retono', 'demo-cabanas-brisa-salina') and publication_status = 'draft' and not managed_in_panel;
update public.events set publication_status = 'published'
  where slug in ('feria-internacional-integracion-papudo', 'festival-de-verano-papudo', 'glorias-navales-papudo', 'fiesta-de-san-pedro', 'fiestas-patrias-papudo', 'combate-naval-de-papudo', 'fiesta-costumbrista-pullally', 'ano-nuevo-junto-al-mar', 'noche-del-tango', 'concurso-castillos-de-arena', 'expo-vive-papudo', 'noche-del-pescador', 'noche-del-vino', 'trilla-de-la-quinoa', 'topman-triatlon', 'gran-fiesta-de-el-llano', 'carreras-a-la-chilena-parque-urbano', 'dia-de-muertos-papudo', 'feria-gastronomica-y-cervecera', 'trineos-del-viejito-pascuero', 'demo-noche-de-bandas', 'demo-cata-de-mariscos') and publication_status = 'draft';
update public.routes set publication_status = 'published'
  where slug in ('ruta-costera-papudo', 'papudo-a-pie') and publication_status = 'draft';

commit;
