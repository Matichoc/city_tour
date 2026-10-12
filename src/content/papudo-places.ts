/**
 * Contenido real de Papudo, portado de `directorio_turistico`
 * (scripts/seed.ts), donde ya estaba investigado y con su fuente.
 *
 * Reglas (docs/PLAN.md §8): todo queda `pending` (sin verificar en terreno).
 * Las coordenadas con nota "provistas por el usuario" son de un pin real; el
 * resto son aproximadas y deben confirmarse con la municipalidad. No se agrega
 * ningún dato (horarios, precios, contactos) que no esté respaldado por una
 * fuente.
 */
import type { LocalityContent, PlaceContent } from "@/content/types";

export const LOCALITIES: LocalityContent[] = [
  {
    slug: "papudo",
    es: "Papudo",
    en: "Papudo",
    latitude: -32.506887299999995,
    longitude: -71.445776,
    summary:
      "Cabecera de la comuna de Papudo (6.356 habitantes, Censo 2017), balneario con el paseo peatonal La Terraza, que bordea Playa Chica y Playa Grande y es el punto de encuentro del pueblo en verano.",
    summaryEn:
      "Seat of the Papudo commune (6,356 inhabitants, 2017 Census), a seaside resort with the pedestrian promenade La Terraza, which runs along Playa Chica and Playa Grande and is the town's gathering place in summer.",
  },
  {
    slug: "pullally",
    es: "Pullally",
    en: "Pullally",
    latitude: -32.4330819,
    longitude: -71.32377009999999,
    summary:
      "Da nombre al humedal Salinas de Pullally, Santuario de la Naturaleza que se extiende junto a las dunas de Longotoma, entre La Ligua y Papudo.",
    summaryEn:
      "It gives its name to the Salinas de Pullally wetland, a Nature Sanctuary that extends alongside the Longotoma dunes, between La Ligua and Papudo.",
    sourceUrl:
      "https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma",
    sourceLabel: "Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma",
  },
  {
    slug: "las-salinas-papudo",
    es: "Las Salinas",
    en: "Las Salinas",
    latitude: -32.411236599999995,
    longitude: -71.4108425,
    summary:
      "Localidad rural a 12 km de la playa, con familias dedicadas a la agricultura y una pequeña caleta de pesca artesanal en la desembocadura del río La Ligua. Se han encontrado restos arqueológicos changos en las dunas de Salinas de Pullally.",
    summaryEn:
      "Rural village 12 km from the beach, with families dedicated to farming and a small artisanal fishing cove at the mouth of the La Ligua River. Chango archaeological remains have been found in the Salinas de Pullally dunes.",
  },
];

export const PLACES: PlaceContent[] = [
  {
    slug: "playa-papudo",
    localitySlug: "papudo",
    categorySlug: "playas",
    latitude: -32.5061,
    longitude: -71.4472,
    es: {
      name: "Playa de Papudo",
      short:
        "Playa principal del balneario; La Terraza la bordea desde la gruta de la Virgen de Lourdes hasta la avenida Glorias Navales.",
      description:
        "Papudo es una comuna balnearia de la provincia de Petorca, con 6.356 habitantes según el Censo 2017. La Playa de Papudo es la principal del pueblo, bordeada por el paseo La Terraza desde la gruta de la Virgen de Lourdes hasta la avenida Glorias Navales — el punto de encuentro del balneario en verano. Sus aguas aparecieron en Sabingo (Chilevisión), donde Dani Urrizola aprendió a bucear en Papudo.",
    },
    en: {
      name: "Papudo Beach",
      short:
        "The resort's main beach; a pedestrian promenade runs along it from the Virgin of Lourdes grotto to Glorias Navales avenue.",
      description:
        "Papudo is a beach town in Petorca province, with 6,356 residents per the 2017 census. Papudo Beach is the town's main strand, lined by the La Terraza promenade from the Virgin of Lourdes grotto to Glorias Navales avenue — the resort's summer gathering point. Its waters were featured on Chilean TV show Sabingo (Chilevisión), where host Dani Urrizola learned to dive here.",
    },
    source: {
      url: "https://www.playasdechile.com/playas-en-papudo/",
      label: "PlayasDeChile.com — Playas en Papudo",
    },
    tvSource: {
      url: "https://www.chilevision.cl/programas/sabingo/rutas-turisticas/dani-urrizola-aprendio-a-bucear-en-las-maravillosas-playas-de-papudo",
      label: "Chilevisión — Sabingo: buceo en Papudo",
    },
  },
  {
    slug: "playa-chica-papudo",
    localitySlug: "papudo",
    categorySlug: "playas",
    latitude: -32.5075,
    longitude: -71.4478,
    es: {
      name: "Playa Chica",
      short:
        "Playa resguardada apta para el baño y deportes acuáticos, más protegida del oleaje que Playa Grande.",
      description:
        "También en la comuna de Papudo (6.356 habitantes, Censo 2017), Playa Chica es una alternativa más resguardada que Playa Grande, apta para el baño y deportes acuáticos gracias a su menor oleaje.",
    },
    en: {
      name: "Playa Chica",
      short:
        "A sheltered beach suited for swimming and water sports, calmer than nearby Playa Grande.",
      description:
        "Also in Papudo commune (6,356 residents, 2017 census), Playa Chica is a more sheltered alternative to Playa Grande, suited for swimming and water sports thanks to its calmer surf.",
    },
    source: {
      url: "https://www.tripadvisor.com/Attraction_Review-g2161325-d6726685-Reviews-Playa_Chica-Papudo_Valparaiso_Region.html",
      label: "Tripadvisor — Playa Chica, Papudo",
    },
  },
  {
    // Corregido a pedido del usuario: esta ubicación (coordenadas de antes,
    // sin cambios) es la Laguna Pullally, no las Salinas — son dos lugares
    // distintos del mismo humedal. "Salinas de Pullally" pasa a su propia
    // entrada, en las coordenadas reales que dio el usuario.
    slug: "papudo-pullally",
    localitySlug: "pullally",
    categorySlug: "naturaleza",
    latitude: -32.43467097116685,
    longitude: -71.31775915116937,
    es: {
      name: "Laguna Pullally",
      short:
        "Laguna dentro del Santuario de la Naturaleza Salinas de Pullally y Dunas de Longotoma (declarado en 2020), en la desembocadura de los ríos Petorca y La Ligua; el humedal alberga 137 especies de aves (más de un cuarto de las descritas en Chile), varias migratorias.",
      description:
        "En la comuna de Papudo (6.356 habitantes, Censo 2017), esta laguna forma parte del Santuario de la Naturaleza Salinas de Pullally y Dunas de Longotoma (declarado en 2020), en la desembocadura de los ríos Petorca y La Ligua. El humedal registra 137 especies de aves — más de un cuarto de las descritas en Chile — entre ellas gaviota garuma, perrito y pilpilén, además de especies migratorias del hemisferio norte.",
    },
    en: {
      name: "Pullally Lagoon",
      short:
        "A lagoon within the Salinas de Pullally y Dunas de Longotoma Nature Sanctuary (declared in 2020), at the mouth of the Petorca and La Ligua rivers; the wetland is home to 137 bird species (over a quarter of those recorded in Chile), several of them migratory.",
      description:
        "In Papudo commune (6,356 residents, 2017 census), this lagoon is part of the Salinas de Pullally y Dunas de Longotoma Nature Sanctuary (declared in 2020), at the mouth of the Petorca and La Ligua rivers. The wetland has recorded 137 bird species — over a quarter of those described in Chile — including the grey gull, black-necked stilt and American oystercatcher, plus migratory species from the northern hemisphere.",
    },
    source: {
      url: "https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma",
      label: "Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma",
    },
  },
  {
    // Coordenadas exactas provistas por el usuario — lugar real distinto de
    // la Laguna Pullally (ver nota arriba), dentro del mismo humedal/
    // santuario protegido.
    slug: "papudo-salinas-pullally",
    localitySlug: "las-salinas-papudo",
    categorySlug: "naturaleza",
    latitude: -32.41007831226611,
    longitude: -71.41062008860503,
    es: {
      name: "Salinas de Pullally",
      short:
        "Sector de salinas del Santuario de la Naturaleza Salinas de Pullally y Dunas de Longotoma (declarado en 2020), entre las desembocaduras de los ríos Petorca y La Ligua.",
      description:
        "En la comuna de Papudo (6.356 habitantes, Censo 2017), este sector de salinas —a unos 12 km al norte del balneario— es una caleta de pescadores artesanales en la desembocadura del río Ligua, donde botes amarrados a un pequeño muelle cruzan el río. El encuentro entre el río y el mar deja aguas tranquilas aptas para niños, mientras el sector abierto atrae a surfistas por la calidad de sus olas.",
    },
    en: {
      name: "Salinas de Pullally",
      short:
        "The salt-flat sector of the Salinas de Pullally y Dunas de Longotoma Nature Sanctuary (declared in 2020), between the mouths of the Petorca and La Ligua rivers.",
      description:
        "In Papudo commune (6,356 residents, 2017 census), this salt-flat sector — about 12 km north of the resort town — is a small artisanal fishing cove at the mouth of the Río Ligua, where boats tied to a small pier ferry people across the river. Where the river meets the sea the water turns calm enough for children, while the open stretch draws surfers for the quality of its waves.",
    },
    source: {
      url: "https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma",
      label: "Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma",
    },
  },
  {
    slug: "papudo-playa-los-lilenes",
    localitySlug: null,
    categorySlug: "playas",
    latitude: -32.49109919617068,
    longitude: -71.4326761566141,
    es: {
      name: "Playa Los Lilenes",
      short:
        "Playa escondida y tranquila al norte de Papudo, a la que se llega por un sendero costero de unos 800 m (o a caballo); pocas visitas, ideal para nadar y descansar rodeado de naturaleza.",
      description:
        'En la comuna de Papudo (6.356 habitantes, Censo 2017), esta playa escondida se alcanza por un sendero costero de unos 800 m que también conecta con Punta Puyay y la llamada "playa del amor" — un circuito de caminata de baja exigencia y pocas visitas, ideal para nadar y descansar rodeado de naturaleza.',
    },
    en: {
      name: "Los Lilenes Beach",
      short:
        "A quiet, hidden beach north of Papudo, reached via an ~800 m coastal path (or on horseback); few visitors, great for swimming and relaxing surrounded by nature.",
      description:
        'In Papudo commune (6,356 residents, 2017 census), this hidden beach is reached along an ~800 m coastal trail that also connects to Punta Puyay and the so-called "playa del amor" — an easy, lightly visited walking circuit, ideal for swimming and relaxing surrounded by nature.',
    },
    source: {
      url: "https://tres60.travel/el-lilen-la-playa-escondida-de-chile-que-combina-naturaleza-y-tranquilidad/",
      label: "tres60.travel — El Lilén, la playa escondida de Chile",
    },
  },
  {
    slug: "papudo-parque",
    localitySlug: "papudo",
    categorySlug: "naturaleza",
    latitude: -32.50461851619594,
    longitude: -71.44310276706875,
    es: {
      name: "Costanera de Papudo",
      short:
        'Paseo peatonal "La Terraza", desde la gruta de la Virgen de Lourdes hasta Av. Glorias Navales, bordeando Playa Chica y Playa Grande; tiendas de artesanía, restaurantes, juegos infantiles y club de yates.',
      description:
        'En la comuna de Papudo (6.356 habitantes, Censo 2017), este paseo peatonal —"La Terraza"— bordea Playa Chica y Playa Grande desde la gruta de la Virgen de Lourdes hasta la avenida Glorias Navales. Es el punto de encuentro del balneario en verano, con tiendas de artesanía, restaurantes, juegos infantiles y el club de yates.',
    },
    en: {
      name: "Papudo Waterfront",
      short:
        '"La Terraza" pedestrian promenade, from the Virgin of Lourdes grotto to Glorias Navales avenue, running along Playa Chica and Playa Grande; craft shops, restaurants, a playground and a yacht club.',
      description:
        "In Papudo commune (6,356 residents, 2017 census), this pedestrian promenade — \"La Terraza\" — runs along Playa Chica and Playa Grande from the Virgin of Lourdes grotto to Glorias Navales avenue. It's the resort's summer gathering point, with craft shops, restaurants, a playground and the yacht club.",
    },
    source: {
      url: "https://www.playasdechile.com/playas-en-papudo/",
      label: "PlayasDeChile.com — Playas en Papudo",
    },
  },
  {
    slug: "papudo-plaza",
    localitySlug: "papudo",
    categorySlug: "patrimonio",
    latitude: -32.50745877114493,
    longitude: -71.44604956690678,
    es: {
      name: "Plaza de Papudo",
      short:
        "Plaza central del pueblo, punto de encuentro de la comunidad y sede de ferias artesanales; rodeada de tiendas y restaurantes, con áreas verdes para sentarse.",
      description:
        "En la comuna de Papudo (6.356 habitantes, Censo 2017), esta plaza central es el punto de encuentro de la comunidad y sede de ferias artesanales, rodeada de tiendas y restaurantes del pueblo.",
    },
    en: {
      name: "Papudo Main Square",
      short:
        "The town's central square, a community gathering point and home to craft fairs; surrounded by shops and restaurants, with green spaces to sit.",
      description:
        "In Papudo commune (6,356 residents, 2017 census), this central square is the community's gathering point and hosts craft fairs, surrounded by the town's shops and restaurants.",
    },
    source: {
      url: "http://www.vregion.cl/petorca/papudo/",
      label: "Valparaíso Región — Destino Papudo",
    },
  },
];
