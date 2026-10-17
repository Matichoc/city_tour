-- GENERADO desde src/content con `pnpm db:content`. No editar a mano.
-- Carga en Supabase el contenido que hoy muestra el sitio. Requiere las
-- migraciones hasta 0016 y supabase/seed.sql. Se puede ejecutar varias veces.
-- Mientras no exista el panel municipal, el repo manda: volver a ejecutarlo
-- sobrescribe los textos de estas fichas.
begin;

-- Localidades
insert into public.localities (slug, latitude, longitude, sort_order, source_url, source_label) values
  ('papudo', -32.506887299999995, -71.445776, 1, null, null),
  ('pullally', -32.4330819, -71.32377009999999, 2, 'https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma', 'Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma'),
  ('las-salinas-papudo', -32.411236599999995, -71.4108425, 3, null, null)
on conflict (slug) do update set
  latitude = excluded.latitude, longitude = excluded.longitude, sort_order = excluded.sort_order,
  source_url = excluded.source_url, source_label = excluded.source_label;

delete from public.locality_translations
  where locality_id in (select id from public.localities where slug in ('papudo', 'pullally', 'las-salinas-papudo'));
insert into public.locality_translations (locality_id, locale, name, summary, translation_status)
select l.id, v.locale::public.locale, v.name, v.summary, v.status::public.translation_status
from (values
  ('papudo', 'es', 'Papudo', 'Cabecera de la comuna de Papudo (6.356 habitantes, Censo 2017), balneario con el paseo peatonal La Terraza, que bordea Playa Chica y Playa Grande y es el punto de encuentro del pueblo en verano.', null),
  ('papudo', 'en', 'Papudo', 'Seat of the Papudo commune (6,356 inhabitants, 2017 Census), a seaside resort with the pedestrian promenade La Terraza, which runs along Playa Chica and Playa Grande and is the town''s gathering place in summer.', 'draft'),
  ('pullally', 'es', 'Pullally', 'Da nombre al humedal Salinas de Pullally, Santuario de la Naturaleza que se extiende junto a las dunas de Longotoma, entre La Ligua y Papudo.', null),
  ('pullally', 'en', 'Pullally', 'It gives its name to the Salinas de Pullally wetland, a Nature Sanctuary that extends alongside the Longotoma dunes, between La Ligua and Papudo.', 'draft'),
  ('las-salinas-papudo', 'es', 'Las Salinas', 'Localidad rural a 12 km de la playa, con familias dedicadas a la agricultura y una pequeña caleta de pesca artesanal en la desembocadura del río La Ligua. Se han encontrado restos arqueológicos changos en las dunas de Salinas de Pullally.', null),
  ('las-salinas-papudo', 'en', 'Las Salinas', 'Rural village 12 km from the beach, with families dedicated to farming and a small artisanal fishing cove at the mouth of the La Ligua River. Chango archaeological remains have been found in the Salinas de Pullally dunes.', 'draft')
) as v(slug, locale, name, summary, status)
join public.localities l on l.slug = v.slug;

-- Lugares (se crean en borrador y se publican al final, con su ficha en español)
insert into public.places (slug, sort_order, category_id, locality_id, latitude, longitude, address, is_demo, is_business)
select v.slug, v.sort_order, c.id, l.id, v.lat::numeric, v.lng::numeric, v.address, v.is_demo, v.is_business
from (values
  ('playa-papudo', 1, 'balneario', 'papudo', -32.5061, -71.4472, null, false, false),
  ('playa-chica-papudo', 2, 'balneario', 'papudo', -32.5075, -71.4478, null, false, false),
  ('papudo-pullally', 3, 'ruralidad', 'pullally', -32.43467097116685, -71.31775915116937, null, false, false),
  ('papudo-salinas-pullally', 4, 'ruralidad', 'las-salinas-papudo', -32.41007831226611, -71.41062008860503, null, false, false),
  ('roots-salinas', 5, 'gastronomia', 'las-salinas-papudo', -32.4163125, -71.4118125, null, false, true),
  ('papudo-playa-los-lilenes', 6, 'balneario', null, -32.49109919617068, -71.4326761566141, null, false, false),
  ('papudo-parque', 7, 'recreacion', 'papudo', -32.50461851619594, -71.44310276706875, null, false, false),
  ('papudo-plaza', 8, 'patrimonio', 'papudo', -32.50745877114493, -71.44604956690678, null, false, false),
  ('iglesia-nuestra-senora-de-las-mercedes', 9, 'patrimonio', 'papudo', null, null, null, false, false),
  ('humedal-urbano-estero-agua-salada', 10, 'recreacion', 'papudo', null, null, null, false, false),
  ('caleta-de-pescadores-papudo', 11, 'gastronomia', 'papudo', null, null, null, false, false),
  ('restaurante-donde-pablo', 12, 'gastronomia', 'papudo', null, null, 'Av. Glorias Navales 511, Papudo', false, true),
  ('fuente-papudo', 13, 'gastronomia', 'papudo', null, null, null, false, true),
  ('hotel-carande', 14, 'alojamiento', 'papudo', null, null, 'Chorrillos 89, Papudo', false, true),
  ('demo-parador-ola-mansa', 15, 'balneario', 'papudo', null, null, null, true, true),
  ('demo-cabalgatas-del-valle', 16, 'recreacion', 'pullally', null, null, null, true, true),
  ('demo-escuela-de-surf-ola-brava', 17, 'deportes', 'las-salinas-papudo', null, null, null, true, true),
  ('demo-circuito-casas-antiguas', 18, 'patrimonio', 'papudo', null, null, null, true, true),
  ('demo-cocineria-sabor-a-mar', 19, 'gastronomia', 'papudo', null, null, null, true, true),
  ('demo-huerta-y-quesos-el-retono', 20, 'ruralidad', 'pullally', null, null, null, true, true),
  ('demo-cabanas-brisa-salina', 21, 'alojamiento', 'las-salinas-papudo', null, null, null, true, true)
) as v(slug, sort_order, category, locality, lat, lng, address, is_demo, is_business)
join public.categories c on c.slug = v.category
left join public.localities l on l.slug = v.locality
on conflict (slug) do update set
  sort_order = excluded.sort_order, category_id = excluded.category_id, locality_id = excluded.locality_id,
  latitude = excluded.latitude, longitude = excluded.longitude, address = excluded.address,
  is_demo = excluded.is_demo, is_business = excluded.is_business;

delete from public.place_translations
  where place_id in (select id from public.places where slug in ('playa-papudo', 'playa-chica-papudo', 'papudo-pullally', 'papudo-salinas-pullally', 'roots-salinas', 'papudo-playa-los-lilenes', 'papudo-parque', 'papudo-plaza', 'iglesia-nuestra-senora-de-las-mercedes', 'humedal-urbano-estero-agua-salada', 'caleta-de-pescadores-papudo', 'restaurante-donde-pablo', 'fuente-papudo', 'hotel-carande', 'demo-parador-ola-mansa', 'demo-cabalgatas-del-valle', 'demo-escuela-de-surf-ola-brava', 'demo-circuito-casas-antiguas', 'demo-cocineria-sabor-a-mar', 'demo-huerta-y-quesos-el-retono', 'demo-cabanas-brisa-salina'));
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
  ('roots-salinas', 'es', 'Roots Salinas', 'Local de comida en el sector Las Salinas de Pullally, comuna de Papudo. Información pendiente de verificación.', 'Local de comida en el sector Las Salinas de Pullally, en la comuna de Papudo. Su ubicación proviene de Google Maps (Plus Code HHMQ+F7); horarios, carta y contacto están pendientes de verificación.', null),
  ('roots-salinas', 'en', 'Roots Salinas', 'Food spot in the Las Salinas de Pullally area, commune of Papudo. Information pending verification.', 'Food spot in the Las Salinas de Pullally area, in the commune of Papudo. Its location comes from Google Maps (Plus Code HHMQ+F7); opening hours, menu and contact details are pending verification.', 'draft'),
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
join public.places p on p.slug = v.slug;

delete from public.sources
  where place_id in (select id from public.places where slug in ('playa-papudo', 'playa-chica-papudo', 'papudo-pullally', 'papudo-salinas-pullally', 'roots-salinas', 'papudo-playa-los-lilenes', 'papudo-parque', 'papudo-plaza', 'iglesia-nuestra-senora-de-las-mercedes', 'humedal-urbano-estero-agua-salada', 'caleta-de-pescadores-papudo', 'restaurante-donde-pablo', 'fuente-papudo', 'hotel-carande', 'demo-parador-ola-mansa', 'demo-cabalgatas-del-valle', 'demo-escuela-de-surf-ola-brava', 'demo-circuito-casas-antiguas', 'demo-cocineria-sabor-a-mar', 'demo-huerta-y-quesos-el-retono', 'demo-cabanas-brisa-salina'));
insert into public.sources (place_id, sort_order, title, url)
select p.id, v.sort_order, v.title, v.url
from (values
  ('playa-papudo', 0, 'PlayasDeChile.com — Playas en Papudo', 'https://www.playasdechile.com/playas-en-papudo/'),
  ('playa-papudo', 1, 'Chilevisión — Sabingo: buceo en Papudo', 'https://www.chilevision.cl/programas/sabingo/rutas-turisticas/dani-urrizola-aprendio-a-bucear-en-las-maravillosas-playas-de-papudo'),
  ('playa-chica-papudo', 0, 'Tripadvisor — Playa Chica, Papudo', 'https://www.tripadvisor.com/Attraction_Review-g2161325-d6726685-Reviews-Playa_Chica-Papudo_Valparaiso_Region.html'),
  ('papudo-pullally', 0, 'Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma', 'https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma'),
  ('papudo-pullally', 1, 'Consejo de Monumentos Nacionales — Santuario Humedal Salinas de Pullally - Dunas de Longotoma', 'https://www.monumentos.gob.cl/monumentos/santuarios-de-la-naturaleza/humedal-salinas-de-pullally-dunas-de-longotoma'),
  ('papudo-salinas-pullally', 0, 'Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma', 'https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma'),
  ('papudo-salinas-pullally', 1, 'Consejo de Monumentos Nacionales — Santuario Humedal Salinas de Pullally - Dunas de Longotoma', 'https://www.monumentos.gob.cl/monumentos/santuarios-de-la-naturaleza/humedal-salinas-de-pullally-dunas-de-longotoma'),
  ('roots-salinas', 0, 'Google Maps — Roots Salinas (HHMQ+F7, Papudo)', 'https://maps.app.goo.gl/JN5FnoUCrZ6MjZXK8'),
  ('papudo-playa-los-lilenes', 0, 'tres60.travel — El Lilén, la playa escondida de Chile', 'https://tres60.travel/el-lilen-la-playa-escondida-de-chile-que-combina-naturaleza-y-tranquilidad/'),
  ('papudo-parque', 0, 'PlayasDeChile.com — Playas en Papudo', 'https://www.playasdechile.com/playas-en-papudo/'),
  ('papudo-plaza', 0, 'Valparaíso Región — Destino Papudo', 'http://www.vregion.cl/petorca/papudo/'),
  ('iglesia-nuestra-senora-de-las-mercedes', 0, 'Wikipedia — Iglesia de Nuestra Señora de las Mercedes (Papudo)', 'https://en.wikipedia.org/wiki/Iglesia_de_Nuestra_Se%C3%B1ora_de_las_Mercedes_(Papudo)'),
  ('iglesia-nuestra-senora-de-las-mercedes', 1, 'Academia X-Ray — Historia y arquitectura de la iglesia', 'https://academiaxray.cl/blog/iglesia-nuestra-senora-de-las-mercedes-papudo/'),
  ('iglesia-nuestra-senora-de-las-mercedes', 2, 'EcuRed — Papudo (Chile)', 'https://www.ecured.cu/Papudo_(Chile)'),
  ('humedal-urbano-estero-agua-salada', 0, 'Redimin — Tribunal Ambiental y Humedal Urbano Estero Agua Salada', 'https://www.redimin.cl/segundo-tribunal-ambiental-rechazo-reclamacion-de-consorcio-punta-puyai-contra-declaracion-del-humedal-urbano-estero-agua-salada-en-papudo'),
  ('humedal-urbano-estero-agua-salada', 1, 'Segundo Tribunal Ambiental — Sentencia R-354-2022', 'https://www.diarioconstitucional.cl/wp-content/uploads/2023/07/R-354-2022_19-07-2023_Sentencia.pdf'),
  ('caleta-de-pescadores-papudo', 0, 'EcuRed — Papudo (Chile)', 'https://www.ecured.cu/Papudo_(Chile)'),
  ('caleta-de-pescadores-papudo', 1, 'Infraestructura Pública — DOP confirma avances en nueva caleta para Papudo', 'https://www.infraestructurapublica.cl/?p=79866'),
  ('restaurante-donde-pablo', 0, 'Tripadvisor — Donde Pablo, Papudo', 'https://www.tripadvisor.co.nz/Restaurant_Review-g2161325-d10663184-Reviews-Donde_Pablo-Papudo_Valparaiso_Region.html'),
  ('restaurante-donde-pablo', 1, 'Diario Uno — El restaurante enfrente de la playa en Papudo', 'https://www.diariouno.com.ar/el-restaurante-enfrente-la-playa-papudo-varias-opciones-menos-30000-n1516569'),
  ('fuente-papudo', 0, 'El Mercurio de Valparaíso — De tapas y copas (2024)', 'https://www.mercuriovalpo.cl/impresa/2024/04/26/full/cuerpo-principal/24'),
  ('fuente-papudo', 1, 'Diario Uno — Restaurantes de Papudo', 'https://www.diariouno.com.ar/el-restaurante-papudo-que-ofrece-un-delicioso-pastel-jaiba-menos-15000-argentinos-n1525552'),
  ('hotel-carande', 0, 'Fodor''s — Hotel Carande', 'https://www.fodors.com/world/south-america/chile/the-central-coast/hotels/reviews/hotel-carande-442059'),
  ('hotel-carande', 1, 'Kayak — Hotel Carande, Papudo', 'https://www.kayak.com/Papudo-Hotels-Hotel-Carande.2918681.ksp')
) as v(slug, sort_order, title, url)
join public.places p on p.slug = v.slug;

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
  ('demo-noche-de-bandas', 8, 'recreacion', 'papudo', 1, null, 'summer', false, true, 'musica'),
  ('demo-cata-de-mariscos', 9, 'gastronomia', 'papudo', 2, null, null, false, true, 'mariscos')
) as v(slug, sort_order, category, locality, month, day, season, featured, is_demo, illustration)
join public.categories c on c.slug = v.category
left join public.localities l on l.slug = v.locality
on conflict (slug) do update set
  sort_order = excluded.sort_order, category_id = excluded.category_id, locality_id = excluded.locality_id,
  recurrence_month = excluded.recurrence_month, recurrence_day = excluded.recurrence_day,
  season = excluded.season, featured = excluded.featured, is_demo = excluded.is_demo,
  illustration = excluded.illustration;

delete from public.event_translations
  where event_id in (select id from public.events where slug in ('feria-internacional-integracion-papudo', 'festival-de-verano-papudo', 'glorias-navales-papudo', 'fiesta-de-san-pedro', 'fiestas-patrias-papudo', 'combate-naval-de-papudo', 'fiesta-costumbrista-pullally', 'demo-noche-de-bandas', 'demo-cata-de-mariscos'));
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
  ('demo-noche-de-bandas', 'es', 'Noche de bandas en la costanera (ejemplo)', 'Música en vivo con bandas locales, feria de artesanía y comida al paso frente al mar.', null),
  ('demo-noche-de-bandas', 'en', 'Band night on the seafront (example)', 'Live music from local bands, a craft fair and street food by the sea.', 'draft'),
  ('demo-noche-de-bandas', 'pt', 'Noite de bandas na orla (exemplo)', 'Música ao vivo com bandas locais, feira de artesanato e comida de rua de frente para o mar.', 'draft'),
  ('demo-cata-de-mariscos', 'es', 'Cata de mariscos en la caleta (ejemplo)', 'Degustación de productos del mar con pescadores y cocineras de la zona.', null),
  ('demo-cata-de-mariscos', 'en', 'Seafood tasting at the cove (example)', 'Tasting of seafood with local fishermen and cooks.', 'draft'),
  ('demo-cata-de-mariscos', 'pt', 'Degustação de frutos do mar na caleta (exemplo)', 'Degustação de produtos do mar com pescadores e cozinheiras da região.', 'draft')
) as v(slug, locale, name, description, status)
join public.events e on e.slug = v.slug;

delete from public.sources
  where event_id in (select id from public.events where slug in ('feria-internacional-integracion-papudo', 'festival-de-verano-papudo', 'glorias-navales-papudo', 'fiesta-de-san-pedro', 'fiestas-patrias-papudo', 'combate-naval-de-papudo', 'fiesta-costumbrista-pullally', 'demo-noche-de-bandas', 'demo-cata-de-mariscos'));
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
  ('fiesta-costumbrista-pullally', 0, 'PLADETUR de Papudo, iD, 2023 (pp. 79 y 188)', 'https://munipapudo.cl/municipalidad/accesos-directos/plan-de-desarrollo-turistico-pladetur')
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
  where slug in ('playa-papudo', 'playa-chica-papudo', 'papudo-pullally', 'papudo-salinas-pullally', 'roots-salinas', 'papudo-playa-los-lilenes', 'papudo-parque', 'papudo-plaza', 'iglesia-nuestra-senora-de-las-mercedes', 'humedal-urbano-estero-agua-salada', 'caleta-de-pescadores-papudo', 'restaurante-donde-pablo', 'fuente-papudo', 'hotel-carande', 'demo-parador-ola-mansa', 'demo-cabalgatas-del-valle', 'demo-escuela-de-surf-ola-brava', 'demo-circuito-casas-antiguas', 'demo-cocineria-sabor-a-mar', 'demo-huerta-y-quesos-el-retono', 'demo-cabanas-brisa-salina') and publication_status = 'draft';
update public.events set publication_status = 'published'
  where slug in ('feria-internacional-integracion-papudo', 'festival-de-verano-papudo', 'glorias-navales-papudo', 'fiesta-de-san-pedro', 'fiestas-patrias-papudo', 'combate-naval-de-papudo', 'fiesta-costumbrista-pullally', 'demo-noche-de-bandas', 'demo-cata-de-mariscos') and publication_status = 'draft';
update public.routes set publication_status = 'published'
  where slug in ('ruta-costera-papudo', 'papudo-a-pie') and publication_status = 'draft';

commit;
