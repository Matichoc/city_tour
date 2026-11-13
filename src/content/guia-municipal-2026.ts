/**
 * Datos de la «Guía Turística Papudo» (Municipalidad de Papudo, 2026), que la
 * municipalidad entregó en PDF el 11 de noviembre de 2026.
 *
 * Reglas (docs/PLAN.md §8):
 * - Solo lo que dice la guía: nombre, descripción, dirección, teléfono, redes y
 *   horarios. No se agrega nada que no esté en ella.
 * - Sin coordenadas: la guía no las trae, así que estas fichas no aparecen en
 *   el mapa ni en los recorridos hasta que se ubiquen. «Cómo llegar» usa la
 *   dirección cuando la hay.
 * - Todo queda `pending` (sin verificar en terreno) y con la guía como fuente.
 * - Solo en español: en inglés y portugués se muestra el español.
 * - No se repiten lugares que ya estaban (ver GUIDE_ALSO_IN): a esos se les
 *   suma la guía como fuente adicional.
 */
import type {
  CategorySlug,
  EventContent,
  PlaceContent,
  Source,
} from "@/content/types";

export const GUIDE_SOURCE: Source = {
  url: "https://www.munipapudo.cl",
  label: "Guía Turística Papudo 2026 — Municipalidad de Papudo",
};

const ig = (handle: string) =>
  `https://www.instagram.com/${handle.replace(/^@/, "")}/`;

type Entry = {
  slug: string;
  loc: "papudo" | "pullally" | "las-salinas-papudo";
  cat: CategorySlug;
  name: string;
  short: string;
  description?: string;
  address?: string;
  phone?: string;
  instagram?: string;
  website?: string;
  hoursText?: string;
  business?: boolean;
};

/**
 * Ubicaciones de los códigos QR de la guía: cada atractivo trae un QR a
 * Google Maps. Se leyeron el 12 de noviembre de 2026 y se asociaron por su
 * posición en la página. El QR de la Plaza de Armas no se pudo leer.
 */
type QrPin = { lat: number; lng: number; maps: string };
const qr = (lat: number, lng: number, code: string): QrPin => ({
  lat,
  lng,
  maps: `https://maps.app.goo.gl/${code}`,
});

export const GUIDE_QR: Record<string, QrPin> = {
  // Nuevos
  "playa-las-playillas": qr(-32.4587709, -71.4312745, "9xVWzrjb14dWYBa4A"),
  "quebrada-del-maqui": qr(-32.490755, -71.424261, "vicrHDZvuzPdU7bP8"),
  "playa-espejito": qr(-32.487444, -71.431404, "15ZDebqpeSf1HKu57"),
  "playa-grande-papudo": qr(-32.504288, -71.4440143, "kBcke2GCJpGqX5VT6"),
  "templo-san-pedro-pescador": qr(
    -32.5069727,
    -71.4354009,
    "HkXxevCVJAXo6PBK8",
  ),
  "edificio-consistorial": qr(-32.5080784, -71.4457043, "SJk9HwppJXqyYdRM6"),
  "chalet-recart": qr(-32.5064673, -71.4477106, "F2yunN77ynDzPZCs6"),
  "gruta-virgen-de-lourdes": qr(-32.5048445, -71.4515048, "BsnGSYyZkMkifE4F8"),
  "playa-de-los-changos": qr(-32.502222, -71.454445, "SW1yUncjgCfBR3JP9"),
  "quebrada-del-frances": qr(-32.519536, -71.445635, "sTyr6TMFz4KFh2YPA"),
  "la-casona-pullally": qr(-32.4346124, -71.3195471, "7w6QkZ1HAn6BLz7V9"),
  "parque-de-pullally": qr(-32.4346481, -71.3177554, "DyYSjcLaEwK7rxpD6"),
  "la-santita-pullally": qr(-32.4349814, -71.3140982, "4NqKahjWvAzNvrjR8"),
  "el-llano-pullally": qr(-32.431214, -71.322366, "svxLynGFfjAmPsmN6"),
  "dunas-las-salinas": qr(-32.420069, -71.379807, "SLtCQn5K36sryS4k7"),
  // El QR de «Escuelas de surf» marca dónde están las dos escuelas.
  "escuela-de-surf-salinas-experience": qr(
    -32.416194,
    -71.412421,
    "uGHM8NVFRRr8bJKo9",
  ),
  "escuela-de-surf-salinas-de-pullally": qr(
    -32.416194,
    -71.412421,
    "uGHM8NVFRRr8bJKo9",
  ),
  // Ya existían sin coordenada o con una aproximada: se usa la del QR.
  "humedal-urbano-estero-agua-salada": qr(
    -32.5020827,
    -71.435157,
    "psfvBEZRQbrt5ks6A",
  ),
  "iglesia-nuestra-senora-de-las-mercedes": qr(
    -32.5063536,
    -71.4495344,
    "bf4FB3LZwXBR7tnJ7",
  ),
  "playa-chica-papudo": qr(-32.5057388, -71.4484262, "RjG2cSVevgHTwYn87"),
};

const place = (e: Entry): PlaceContent => ({
  slug: e.slug,
  localitySlug: e.loc,
  categorySlug: e.cat,
  latitude: GUIDE_QR[e.slug]?.lat ?? null,
  longitude: GUIDE_QR[e.slug]?.lng ?? null,
  ...(GUIDE_QR[e.slug] ? { mapsUrl: GUIDE_QR[e.slug].maps } : {}),
  ...(e.address ? { address: e.address } : {}),
  ...(e.business ? { business: true } : {}),
  es: { name: e.name, short: e.short, description: e.description ?? e.short },
  ...(e.phone ? { cta: { kind: "phone" as const, value: e.phone } } : {}),
  ...(e.instagram ? { instagram: ig(e.instagram) } : {}),
  ...(e.website ? { website: e.website } : {}),
  ...(e.hoursText ? { hoursText: e.hoursText } : {}),
  source: GUIDE_SOURCE,
});

// ── Atractivos ──────────────────────────────────────────────────────────
const ATTRACTIONS: Entry[] = [
  {
    slug: "playa-grande-papudo",
    loc: "papudo",
    cat: "balneario",
    name: "Playa Grande",
    short:
      "La playa más extensa de Papudo, de arenas doradas, ideal para caminar y practicar surf y bodyboard. No es apta para el baño.",
    description:
      "Playa papudana a 443 metros al noreste de Playa Chica. Es la más extensa de Papudo, de arenas doradas e ideal para grandes caminatas. Sus condiciones marítimas permiten practicar surf y bodyboard. No es apta para el baño.",
  },
  {
    slug: "playa-espejito",
    loc: "papudo",
    cat: "balneario",
    name: "Playa Espejito",
    short:
      "Playa tranquila a 2,7 km al noreste de Playa Chica, con un pozo de agua dulce. No es apta para el baño.",
    description:
      "Playa ubicada a 2,7 km al noreste de Playa Chica. Se caracteriza por su tranquilidad y por tener un pozo de agua dulce. En este sector deja de ser apta para el baño.",
  },
  {
    slug: "playa-las-playillas",
    loc: "papudo",
    cat: "balneario",
    name: "Las Playillas",
    short:
      "Playa del borde costero norte, a 6 km al noroeste, rodeada de naturaleza. Se llega a pie: cerca de una hora caminando desde Playa Los Lilenes.",
    description:
      "Se encuentra a 6 km al noroeste, en el sector norte del borde costero papudano, pasado Espejito. La rodea un fundo privado donde abunda la naturaleza y se llega a pie: desde Playa Los Lilenes, donde comienza la caminata, son aproximadamente una hora caminando.",
  },
  {
    slug: "playa-de-los-changos",
    loc: "papudo",
    cat: "balneario",
    name: "Playa de los Changos",
    short:
      "Playa rocosa junto al muelle, a 700 m al noroeste de Playa Chica. No es apta para el baño, pero es una muy buena opción para caminar.",
    description:
      "Playa ubicada a un costado del muelle de Papudo, a 700 metros al noroeste de Playa Chica. Está llena de rocas y frente a un mar más abierto, por lo que no es apta para el baño, pero es una muy buena opción para caminar y disfrutar del paisaje.",
  },
  {
    slug: "quebrada-del-maqui",
    loc: "papudo",
    cat: "deportes",
    name: "Quebrada del Maqui",
    short:
      "Quebrada a 3,1 km al noreste de Playa Chica, muy usada para trekking y mountain bike.",
  },
  {
    slug: "quebrada-del-frances",
    loc: "papudo",
    cat: "deportes",
    name: "Quebrada del Francés",
    short:
      "Larga quebrada en el cerro La Higuera, a 1,9 km al sur de Playa Chica: favorita para trekking, bicicleta y caminatas.",
    description:
      "Es una quebrada muy larga que llega a los pies de la antena, en el cerro La Higuera, a 1,9 km al sur de Playa Chica. Es uno de los lugares favoritos para hacer trekking, andar en bicicleta y caminar. Cuenta la leyenda que el pirata Francis Drake escondió aquí un tesoro de monedas de oro, y de ahí viene su nombre.",
  },
  {
    slug: "templo-san-pedro-pescador",
    loc: "papudo",
    cat: "patrimonio",
    name: "Templo católico San Pedro Pescador",
    short:
      "Templo construido en 2001 cerca de la entrada del pueblo, donde la comunidad parroquial celebra sus principales liturgias.",
    description:
      "Está en la calle Víctor Fazzio 1005, a 1,2 km al este de Playa Chica. Fue construido en 2001 cerca de la entrada del pueblo, en el mismo lugar donde por décadas existió una capilla sufragánea de la Parroquia de Las Mercedes. Hoy es donde la comunidad parroquial participa de las celebraciones litúrgicas principales.",
    address: "Víctor Fazzio 1005, Papudo",
  },
  {
    slug: "edificio-consistorial",
    loc: "papudo",
    cat: "patrimonio",
    name: "Edificio Consistorial",
    short:
      "Edificio casi al centro de la Plaza de Armas, donde funciona la Biblioteca Municipal y sesiona el Concejo Municipal.",
  },
  {
    slug: "chalet-recart",
    loc: "papudo",
    cat: "patrimonio",
    name: "Chalet Recart",
    short:
      "Obra del arquitecto Josué Smith Solar, destacada por su diseño y ubicación. Hoy pertenece a la Municipalidad de Papudo.",
  },
  {
    slug: "gruta-virgen-de-lourdes",
    loc: "papudo",
    cat: "patrimonio",
    name: "Gruta Virgen de Lourdes",
    short: "Lugar donde los fieles católicos se reúnen a orar.",
  },
  {
    slug: "parque-de-pullally",
    loc: "pullally",
    cat: "ruralidad",
    name: "Parque de Pullally",
    short:
      "Antiguo parque de la familia Irarrázaval, con especies exóticas como pino ciprés, secuoya y roble australiano. Un pulmón verde de la zona.",
    description:
      "Hace muchos años fue una propiedad privada: básicamente el patio de la familia Irarrázaval, con especies exóticas como pino ciprés, secuoya y roble australiano. Llegaba hasta la calle del Llano y sumaba 33 hectáreas. A principios del siglo XX, tras el terremoto de 1906, Fernando Irarrázaval Mackenna trajo a un paisajista francés para remodelarlo.",
  },
  {
    slug: "la-casona-pullally",
    loc: "pullally",
    cat: "patrimonio",
    name: "La Casona y ruinas de la ex Hacienda",
    short:
      "Ruinas de la casona de los Irarrázaval, reconstruida en estilo neoclásico francés tras el terremoto de 1906.",
    description:
      "Perteneció a José Santiago Irarrázaval Portales, nacido allí en 1734. Tras el terremoto de 1906, Fernando Irarrázaval Mackenna la reconstruyó en estilo neoclásico francés, y sus ruinas aún se observan. El sismo de 1965 volvió a dañarla y, en plena reforma agraria, expertos la declararon irrecuperable. Considerada por los habitantes un símbolo de esclavitud y represión, nunca fue protegida. En 1966 el fundo fue expropiado.",
  },
  {
    slug: "la-santita-pullally",
    loc: "pullally",
    cat: "patrimonio",
    name: "La Santita",
    short:
      "Imagen de fierro forjado traída de Francia, que fue el oratorio de los patrones de la hacienda.",
    description:
      "Desde un principio fue un oratorio para los patrones. Es una imagen de fierro forjado originaria de Francia. La gente del pueblo comenzó a llamarla «la Santita» cuando pudo acceder a ella. Junto a ella existía un estanque de agua para su mantención.",
  },
  {
    slug: "el-llano-pullally",
    loc: "pullally",
    cat: "recreacion",
    name: "El Llano",
    short:
      "Escenario de las carreras a la chilena de Pullally, que toman vida cada septiembre.",
    description:
      "La actividad del Llano comenzó con Irarrázaval Mackenna como una instancia de distracción abierta a todos, empezando por la gente de Pullally. Al principio funcionaba solo el 18 de septiembre; con los años se sumó el feriado del 19. Desde entonces, el Llano toma vida con las carreras a la chilena.",
  },
  {
    slug: "bosque-relicto-de-olivillos",
    loc: "pullally",
    cat: "ruralidad",
    name: "Bosque Relicto de Olivillos",
    short:
      "Un verdadero tesoro botánico, testimonio de la flora nativa de la zona.",
  },
  {
    slug: "dunas-las-salinas",
    loc: "las-salinas-papudo",
    cat: "ruralidad",
    name: "Dunas de Las Salinas",
    short:
      "Dunas al norte de Papudo, en Las Salinas. Son de difícil acceso, ya que las bordean los ríos La Ligua y Petorca.",
  },
];

// ── Qué hacer: operadores, escuelas y ferias ───────────────────────────
const ACTIVITIES: Entry[] = [
  {
    slug: "cabalgatas-lilen",
    loc: "papudo",
    cat: "recreacion",
    business: true,
    name: "Cabalgatas Lilen",
    short: "Cabalgatas en Papudo.",
    phone: "+56 9 4440 9698",
    instagram: "cabalgataslilen.papudo",
  },
  {
    slug: "pintarroja-dive-center",
    loc: "papudo",
    cat: "deportes",
    business: true,
    name: "Pintarroja Dive Center",
    short: "Centro de buceo: buceo recreativo y actividades náuticas.",
    address: "Riquelme 431, Papudo",
    phone: "+56 9 9883 0988",
    instagram: "pintarrojadivecenter",
  },
  {
    slug: "gorgonia-expediciones",
    loc: "papudo",
    cat: "deportes",
    business: true,
    name: "Gorgonia Expediciones",
    short: "Experiencias de buceo.",
    phone: "+56 9 3066 0804",
    instagram: "gorgoniaexpediciones",
  },
  {
    slug: "intemperie-turismo",
    loc: "papudo",
    cat: "deportes",
    business: true,
    name: "Intemperie",
    short: "Turismo de naturaleza: excursiones náuticas y trekking.",
    address: "Av. Irarrázaval s/n, a un costado del Chalet Recart, Papudo",
    phone: "+56 9 8362 9476",
  },
  {
    slug: "la-vasija-de-sol",
    loc: "papudo",
    cat: "recreacion",
    business: true,
    name: "La Vasija de Sol",
    short: "Terapias complementarias.",
    phone: "+56 9 5395 2490",
    website: "https://www.lavasijadesol.com",
  },
  {
    slug: "arriendo-de-kayak-papudo",
    loc: "papudo",
    cat: "deportes",
    business: true,
    name: "Arriendo de kayak",
    short: "Arriendo de kayak en la caleta de pescadores de Papudo.",
    address: "Av. Irarrázaval 86, Papudo",
    phone: "+56 9 5407 4251",
  },
  {
    slug: "empopado",
    loc: "papudo",
    cat: "deportes",
    business: true,
    name: "Empopado",
    short:
      "Escuela de deportes náuticos: windsurf, navegación a vela, ski y wakeboard, paddle surf y licencia de patrón de bahía.",
    instagram: "Empopado",
  },
  {
    slug: "buenaventura-paseos-en-lancha",
    loc: "papudo",
    cat: "recreacion",
    business: true,
    name: "Buenaventura",
    short: "Paseos en lancha y pesca deportiva, desde las 12:00.",
    address: "Av. Irarrázaval s/n, costanera frente a Playa Chica, Papudo",
    phone: "+56 9 8810 9808",
    instagram: "josevalebuenaventura.xzx",
  },
  {
    slug: "awkan-ecoturismo",
    loc: "papudo",
    cat: "deportes",
    business: true,
    name: "Awkan Ecoturismo",
    short: "Agencia de ecoturismo: kayak, trekking, astroturismo y escalada.",
    address: "Riveros 775, Papudo",
    phone: "+56 9 2709 1378",
    instagram: "awkan.ecoturismo",
  },
  {
    slug: "feria-artesanal-manos-papudanas",
    loc: "papudo",
    cat: "patrimonio",
    name: "Feria Artesanal Manos Papudanas",
    short:
      "Feria artesanal en la costanera de Playa Chica, los sábados y domingos.",
    address: "Costanera de Playa Chica, Papudo",
    hoursText: "Sábados y domingos.",
  },
  {
    slug: "feria-de-verduras-papudo",
    loc: "papudo",
    cat: "gastronomia",
    name: "Feria de verduras",
    short:
      "Feria de verduras los miércoles y domingos, de 08:30 a 15:00 aproximadamente.",
    hoursText:
      "Miércoles y domingo, desde las 08:30 hasta las 15:00 aproximadamente.",
  },
  {
    slug: "feria-artesanal-espacio-parque",
    loc: "papudo",
    cat: "patrimonio",
    name: "Feria Artesanal Espacio Parque",
    short: "Feria artesanal en el Parque Municipal de Papudo, en Playa Grande.",
    address: "Parque Municipal, Playa Grande, Papudo",
  },
  {
    slug: "feria-artesanal-el-lilen",
    loc: "papudo",
    cat: "patrimonio",
    name: "Feria Artesanal El Lilen",
    short: "Feria artesanal en la costanera de Playa Grande.",
    address: "Costanera de Playa Grande, Papudo",
  },
  {
    slug: "escuela-de-surf-salinas-experience",
    loc: "las-salinas-papudo",
    cat: "deportes",
    business: true,
    name: "Escuela de Surf Salinas Experience",
    short: "Escuela de surf en la playa de Las Salinas.",
    address: "Playa Las Salinas",
    website: "https://www.salinasexperience.cl",
  },
  {
    slug: "escuela-de-surf-salinas-de-pullally",
    loc: "las-salinas-papudo",
    cat: "deportes",
    business: true,
    name: "Escuela de Surf Salinas de Pullally",
    short: "Escuela de surf en la playa de Las Salinas.",
    address: "Playa Las Salinas",
    website: "https://www.salinasdepullallysurf.cl",
  },
  {
    slug: "feria-de-productores-pullally",
    loc: "pullally",
    cat: "ruralidad",
    name: "Feria de Productores",
    short: "Feria de productores los domingos de 09:00 a 14:30.",
    address: "Av. Las Salinas con 3 Oriente, Pullally",
    hoursText: "Domingos de 09:00 a 14:30.",
  },
  {
    slug: "feria-de-emprendedores-pullally",
    loc: "pullally",
    cat: "ruralidad",
    name: "Feria de Emprendedores",
    short:
      "Feria de emprendedores en las ruinas de la ex Hacienda, los fines de semana 1 y 15.",
    address: "Ruinas ex Hacienda, Pullally",
    hoursText: "Fines de semana 1 y 15.",
  },
  {
    slug: "viveros-las-camelias",
    loc: "pullally",
    cat: "ruralidad",
    business: true,
    name: "Viveros Las Camelias",
    short: "Vivero en el sector de las ruinas de Pullally.",
    address: "Av. Las Salinas, sector ruinas, Pullally",
    phone: "+56 9 8413 5191",
  },
];

// ── Dónde comer ─────────────────────────────────────────────────────────
const food = (
  e: Omit<Entry, "cat" | "business" | "short"> & { short?: string },
): Entry => ({
  short:
    e.short ?? (e.address ? `Restaurante en ${e.address}.` : "Restaurante."),
  ...e,
  cat: "gastronomia",
  business: true,
});

const FOOD: Entry[] = [
  food({
    slug: "il-gabbiano",
    loc: "papudo",
    name: "Il Gabbiano",
    address: "Chorrillos 183, Papudo",
    instagram: "ilgabbiano7_restoranhostal",
  }),
  food({
    slug: "la-roca",
    loc: "papudo",
    name: "La Roca",
    address: "Chorrillos 149, Papudo",
    instagram: "Larocapapudo",
  }),
  food({
    slug: "la-canita",
    loc: "papudo",
    name: "La Cañita",
    address: "Av. El Estero 211, local 11, Papudo",
    instagram: "Lacanita_pp2",
  }),
  food({
    slug: "mamma-mia-papudo",
    loc: "papudo",
    name: "Mamma Mia",
    address: "D. Fernández Concha 502, Papudo",
    phone: "+56 9 6309 1899",
    instagram: "mamma.mia.papudo",
  }),
  food({
    slug: "la-plaza-restaurante",
    loc: "papudo",
    name: "La Plaza",
    address: "Chorrillos 119, Papudo",
    instagram: "rest.laplaza",
  }),
  food({
    slug: "mar-de-luna",
    loc: "papudo",
    name: "Mar de Luna",
    address: "Chorrillos 107, Papudo",
    instagram: "Mardelunarestaurante",
  }),
  food({
    slug: "club-de-yates-papudo",
    loc: "papudo",
    name: "Club de Yates",
    address: "Irarrázaval 0201, Papudo",
    instagram: "elclubpapudo",
  }),
  food({
    slug: "casa-rivera",
    loc: "papudo",
    name: "Casa Rivera",
    address: "Miraflores 112, Papudo",
    phone: "+56 9 9630 7364",
    instagram: "casariverapapudo",
  }),
  food({
    slug: "restaurante-rompe-olas",
    loc: "papudo",
    name: "Restaurante Rompe Olas",
    address: "Chorrillos 157, Papudo",
    phone: "+56 9 6919 3048",
  }),
  food({
    slug: "la-grota",
    loc: "papudo",
    name: "La Grota",
    address: "Esmeralda 296, Papudo",
    phone: "+56 9 9379 1134",
    instagram: "lagrottapapudo",
  }),
  food({
    slug: "casa-conaripe",
    loc: "papudo",
    name: "Casa Coñaripe",
    address: "D. Fernández Concha 525, Papudo",
    phone: "+56 9 6451 0177",
    instagram: "casa_conaripe",
  }),
  food({
    slug: "la-catita",
    loc: "papudo",
    name: "La Catita",
    address: "Víctor Fazio Rigazzi 1051, Papudo",
    phone: "+56 9 8805 6248",
    instagram: "restaurante.lacatita",
  }),
  food({
    slug: "el-torres",
    loc: "papudo",
    name: "El Torres",
    address: "Miraflores 88, Papudo",
    phone: "+56 9 8903 3175",
    instagram: "eltorresoficial",
  }),
  food({
    slug: "sunshine-sushi",
    loc: "papudo",
    name: "Sunshine Sushi",
    address: "Miraflores 186, Papudo",
    phone: "+56 9 9525 4584",
    instagram: "sunshinesushi",
  }),
  food({
    slug: "banana-papudo",
    loc: "papudo",
    name: "Banana",
    address: "Av. Irarrázaval 86, Papudo",
  }),
  food({
    slug: "tocato",
    loc: "papudo",
    name: "Tocato",
    address: "Miraflores 210, Papudo",
    phone: "+56 9 4013 8577",
    instagram: "nostocatodos",
  }),
  food({
    slug: "bahia-lilen",
    loc: "papudo",
    name: "Bahía Lilen",
    address: "Cochrane 184, Papudo",
    phone: "+56 9 9201 1917",
    instagram: "bahialilen",
  }),
  food({
    slug: "gran-azul",
    loc: "papudo",
    name: "Gran Azul",
    address: "Av. Irarrázaval 86, Papudo",
  }),
  food({
    slug: "puerto-madero-papudo",
    loc: "papudo",
    name: "Puerto Madero",
    address: "Av. Irarrázaval 88, Papudo",
  }),
  food({
    slug: "burgazo",
    loc: "papudo",
    name: "Burgazo",
    address: "D. Fernández Concha 210, Papudo",
    phone: "+56 9 3079 5042",
    instagram: "burgazo.cl",
  }),
  food({
    slug: "papudoretro",
    loc: "papudo",
    name: "PapudoRetro",
    address: "Irarrázaval 55, locales 8 y 9, Papudo",
    instagram: "papudoretro",
  }),
  food({
    slug: "la-casa-de-cesar",
    loc: "papudo",
    name: "La Casa de César",
    address: "D. Fernández Concha con Chorrillos, Papudo",
    phone: "+56 33 279 0384",
    instagram: "la_casa_de_cesar_papudo",
  }),
  food({
    slug: "la-maison-des-fous",
    loc: "papudo",
    name: "La Maison des Fous",
    address: "Blanco 132, Papudo",
    phone: "+56 9 9216 2447",
    instagram: "lamaisondesfouspapudo",
  }),
  food({
    slug: "casa-hidalgo",
    loc: "papudo",
    name: "Casa Hidalgo",
    address: "Chorrillos 157, Papudo",
    phone: "+56 9 8979 4016",
    instagram: "casahidalgo",
  }),
  food({
    slug: "la-quebrada-papudo",
    loc: "papudo",
    name: "La Quebrada Papudo",
    address: "Prat 30, Papudo",
    phone: "+56 9 7837 9155",
    instagram: "la_quebrada_papudo",
  }),
  food({
    slug: "sabor-marino",
    loc: "papudo",
    name: "Sabor Marino",
    address: "Av. Víctor Fazio, Papudo",
    phone: "+56 9 6706 7130",
    instagram: "sabormarino69",
  }),
  food({
    slug: "la-mare",
    loc: "papudo",
    name: "La Mare",
    address: "Chorrillos 37, Papudo",
    phone: "+56 9 4047 7012",
    instagram: "La_mare_pizza",
  }),
  food({
    slug: "sazon-papudo",
    loc: "papudo",
    name: "Sazón",
    address: "Av. El Estero 211, local 9, Papudo",
    phone: "+56 9 4262 8192",
    instagram: "sazonpapudo_",
  }),
  food({
    slug: "don-rola",
    loc: "papudo",
    name: "Don Rola",
    address: "D. Fernández Concha 555, Papudo",
    phone: "+56 9 5323 5645",
  }),
  food({
    slug: "chungungos",
    loc: "papudo",
    name: "Chungungos",
    address: "Strip center Portal Papudo, sector Papudo Laguna",
    phone: "+56 9 6695 7059",
    instagram: "chungungo_s",
  }),
  food({
    slug: "el-bunker",
    loc: "papudo",
    name: "El Bunker",
    address: "Av. Víctor Fazio 1502, Papudo",
    phone: "+56 9 8470 1156",
    instagram: "elbunkerrestobarpapudo",
  }),
  food({
    slug: "panaderia-soriano",
    loc: "pullally",
    name: "Panadería y Pastelería Soriano",
    short: "Panadería y pastelería en Pullally.",
    address: "Av. Las Salinas 12e, Pullally",
    phone: "+56 9 4509 4747",
  }),
  food({
    slug: "panaderia-la-tinita",
    loc: "pullally",
    name: "Panadería y Pastelería La Tinita",
    short: "Panadería y pastelería en Pullally.",
    address: "Av. Las Salinas 113, Pullally",
    phone: "+56 9 6465 0441",
  }),
  food({
    slug: "el-rey-de-la-quinoa",
    loc: "las-salinas-papudo",
    name: "El Rey de la Quinoa",
    address: "Km 3,5 camino Las Salinas",
    phone: "+56 9 9123 1796",
  }),
  food({
    slug: "saborigenes",
    loc: "las-salinas-papudo",
    name: "Saborigenes",
    short: "Food truck en la playa Las Salinas.",
    address: "Playa Las Salinas",
    phone: "+56 9 8559 9670",
  }),
  food({
    slug: "gran-z",
    loc: "las-salinas-papudo",
    name: "Gran Z",
    address: "Km 5 camino Las Salinas",
    phone: "+56 9 4598 2985",
  }),
];

// ── Dónde dormir ────────────────────────────────────────────────────────
const stay = (
  e: Omit<Entry, "cat" | "business" | "short"> & {
    short?: string;
    kind: string;
  },
): Entry => ({
  short: `${e.kind}${e.address ? ` en ${e.address}` : ""}.`,
  ...e,
  cat: "alojamiento",
  business: true,
});

const STAY: Entry[] = [
  stay({
    slug: "casa-papudo-hotel-boutique",
    loc: "papudo",
    kind: "Hotel boutique",
    name: "Casa Papudo Hotel Boutique",
    address: "Riquelme 194, Papudo",
    instagram: "Casapapudo",
  }),
  stay({
    slug: "ambiente-mar",
    loc: "papudo",
    kind: "Alojamiento",
    name: "Ambiente Mar",
    address: "Ruta E-30-F 645, Papudo",
    phone: "+56 9 6607 5483",
    website: "https://ambientemar.cl",
  }),
  stay({
    slug: "espacio-lila",
    loc: "papudo",
    kind: "Hostal",
    name: "Espacio Lila",
    address: "Chorrillos 459, Papudo",
    phone: "+56 9 9093 1464",
    instagram: "hostal_espacio_lila",
  }),
  stay({
    slug: "cabanas-aquario",
    loc: "papudo",
    kind: "Cabañas",
    name: "Cabañas Aquario",
    address: "D. Fernández Concha 623, Papudo",
    phone: "+56 9 9789 0355",
    website: "https://www.cabanasaquario.cl",
  }),
  stay({
    slug: "la-quebrada-lodge",
    loc: "papudo",
    kind: "Lodge",
    name: "La Quebrada Lodge",
    address: "Arturo Prat 30, Papudo",
    phone: "+56 9 8136 6391",
    instagram: "quebradalodge",
  }),
  stay({
    slug: "residencial-la-plaza",
    loc: "papudo",
    kind: "Residencial",
    name: "Residencial La Plaza",
    address: "Chorrillos 119, Papudo",
    phone: "+56 9 6633 3158",
    instagram: "rest.laplaza",
  }),
  stay({
    slug: "cabanas-de-pepino",
    loc: "papudo",
    kind: "Cabañas",
    name: "Cabañas de Pepino",
    address: "D. Fernández Concha, Papudo",
    phone: "+56 9 4005 3243",
    instagram: "cabanasdepepino",
  }),
  stay({
    slug: "rustico-cabanas",
    loc: "papudo",
    kind: "Cabañas",
    name: "Rústico Cabañas",
    address: "Baquedano 31, Papudo",
    phone: "+56 9 9532 8136",
    instagram: "cabanasrusticopapudo",
  }),
  stay({
    slug: "residencial-papudo",
    loc: "papudo",
    kind: "Residencial",
    name: "Residencial Papudo",
    address: "D. Fernández Concha 512, Papudo",
    phone: "+56 9 8649 4740",
    website: "https://www.residencialpapudo.cl",
  }),
  stay({
    slug: "hostal-la-abeja",
    loc: "papudo",
    kind: "Hostal",
    name: "Hostal La Abeja",
    address: "Chorrillos 36, Papudo",
    phone: "+56 9 7491 3423",
  }),
  stay({
    slug: "cabanas-los-arrayanes",
    loc: "papudo",
    kind: "Cabañas",
    name: "Cabañas Los Arrayanes",
    address: "Pasaje Baquedano 333, Papudo",
    phone: "+56 9 9744 6270",
  }),
  stay({
    slug: "pura-vida-cabanas",
    loc: "papudo",
    kind: "Cabañas",
    name: "Pura Vida",
    address: "Baquedano 251, Papudo",
    phone: "+56 9 4545 4885",
    instagram: "Puravidacabanas",
  }),
  stay({
    slug: "hotel-plaza-papudo",
    loc: "papudo",
    kind: "Hotel",
    name: "Hotel Plaza",
    address: "Miraflores 176, Papudo",
    phone: "+56 9 9574 5282",
  }),
  stay({
    slug: "hotel-moderno-petra-mar",
    loc: "papudo",
    kind: "Hotel",
    name: "Hotel Moderno Petra Mar",
    address: "Riveros 515, Papudo",
    phone: "+56 9 7478 7820",
  }),
  stay({
    slug: "arenas-de-papudo",
    loc: "papudo",
    kind: "Alojamiento",
    name: "Arenas de Papudo",
    address: "Riveros 515, Papudo",
    phone: "+56 9 7478 7820",
    website: "https://arenasdepapudo.cl",
  }),
  stay({
    slug: "hotel-rompe-olas",
    loc: "papudo",
    kind: "Hotel",
    name: "Hotel Rompe Olas",
    address: "Chorrillos 157, Papudo",
    phone: "+56 9 6919 3048",
  }),
  stay({
    slug: "rancho-carmelitas",
    loc: "pullally",
    kind: "Alojamiento",
    name: "Rancho Carmelitas",
    address: "pasaje interior por Av. Las Salinas, Pullally",
    phone: "+56 9 6727 4017",
  }),
  stay({
    slug: "cabanas-angelo",
    loc: "pullally",
    kind: "Cabañas",
    name: "Cabañas Angelo",
    address: "calle 6 Oriente, Pullally",
    phone: "+56 9 4887 0353",
  }),
  stay({
    slug: "refugio-las-salinas",
    loc: "las-salinas-papudo",
    kind: "Alojamiento",
    name: "Refugio Las Salinas",
    address: "Km 5,7 carretera Las Salinas",
    phone: "+56 9 8479 4757",
  }),
  stay({
    slug: "ecocamping-santiago-waves",
    loc: "las-salinas-papudo",
    kind: "Ecocamping",
    name: "Ecocamping Santiago Waves",
    address: "Km 7 camino Las Salinas",
    phone: "+56 9 8648 9027",
  }),
  stay({
    slug: "cabanas-los-troncos",
    loc: "las-salinas-papudo",
    kind: "Cabañas",
    name: "Cabañas Los Troncos",
    address: "Km 1,6 carretera Las Salinas",
    phone: "+56 9 8527 5993",
  }),
];

export const GUIDE_PLACES: PlaceContent[] = [
  ...ATTRACTIONS,
  ...ACTIVITIES,
  ...FOOD,
  ...STAY,
].map(place);

/**
 * Lugares que ya estaban en el repo y que la guía también menciona: no se
 * duplican; se les suma la guía como fuente adicional.
 */
export const GUIDE_ALSO_IN = [
  "playa-chica-papudo",
  "papudo-playa-los-lilenes",
  "papudo-plaza",
  "iglesia-nuestra-senora-de-las-mercedes",
  "humedal-urbano-estero-agua-salada",
  "caleta-de-pescadores-papudo",
  "papudo-parque",
  "papudo-pullally",
  "papudo-salinas-pullally",
  "restaurante-donde-pablo",
  "fuente-papudo",
  "hotel-carande",
  "roots-salinas",
];

/** Resumen de cada localidad según la guía (reemplaza el anterior). */
export const GUIDE_LOCALITY_SUMMARIES: Record<string, string> = {
  papudo:
    "Fundado en 1857, es uno de los balnearios más tradicionales de la Región de Valparaíso. Mezcla un pasado ilustre —lo visitaron Arturo Prat y el expresidente Manuel Montt, y Pedro de Valdivia lo describió como «el paraíso de Dios»— con una vida costera vibrante. Está a 170 km de Santiago por la Ruta 5 Norte y a 82 km de Viña del Mar y Valparaíso por el camino costero, donde la cordillera de la costa se encuentra con el mar.",
  pullally:
    "A 18 km al oriente de Papudo, Pullally tiene un profundo arraigo rural y tradiciones campesinas ligadas a la vocación agropecuaria de la zona. Su parque, el bosque relicto de olivillos y las ruinas de la ex Hacienda cuentan su historia, y sus fiestas, ferias y las carreras a la chilena en El Llano mantienen viva la tradición.",
  "las-salinas-papudo":
    "A 12 km al norte de Papudo, Las Salinas es un poblado rural y costero para una experiencia de playa más auténtica, lejos del bullicio. Su caleta reúne a los pescadores y sus mariscos frescos, y su playa es ideal para dar las primeras olas en surf. El camino es un circuito de agroturismo entre dunas, caseríos y cultivos de alfalfa, quinua, frutillas y maíz.",
};

// ── Festividades (calendario municipal de la guía) ────────────────────
const fest = (
  slug: string,
  month: number,
  name: string,
  nameEn: string,
  cat: CategorySlug,
  loc: string | null = "papudo",
): EventContent => ({
  slug,
  categorySlug: cat,
  localitySlug: loc,
  month,
  es: {
    name,
    short: `Parte del calendario de festividades de la Municipalidad de Papudo.`,
  },
  en: {
    name: nameEn,
    short: "Part of the Municipality of Papudo festival calendar.",
  },
  source: GUIDE_SOURCE,
});

/** Eventos de la guía que no estaban en el repo (los repetidos se omiten). */
export const GUIDE_EVENTS: EventContent[] = [
  fest(
    "ano-nuevo-junto-al-mar",
    1,
    "Fiesta de Año Nuevo junto al mar",
    "New Year by the sea",
    "recreacion",
  ),
  fest("noche-del-tango", 1, "Noche del Tango", "Tango Night", "recreacion"),
  fest(
    "concurso-castillos-de-arena",
    1,
    "Concurso de castillos de arena",
    "Sandcastle contest",
    "balneario",
  ),
  fest(
    "expo-vive-papudo",
    2,
    "Expo Vive Papudo",
    "Expo Vive Papudo",
    "recreacion",
  ),
  fest(
    "noche-del-pescador",
    2,
    "Noche del Pescador",
    "Fisherman's Night",
    "gastronomia",
  ),
  fest("noche-del-vino", 2, "Noche del Vino", "Wine Night", "gastronomia"),
  fest(
    "trilla-de-la-quinoa",
    2,
    "La Trilla de la Quinoa",
    "Quinoa threshing festival",
    "ruralidad",
    null,
  ),
  fest("topman-triatlon", 4, "Topman Triatlón", "Topman Triathlon", "deportes"),
  fest(
    "gran-fiesta-de-el-llano",
    9,
    "Gran Fiesta de El Llano",
    "El Llano grand festival",
    "ruralidad",
    "pullally",
  ),
  fest(
    "carreras-a-la-chilena-parque-urbano",
    9,
    "Carreras a la chilena en el Parque Urbano",
    "Chilean horse races at the Urban Park",
    "ruralidad",
    null,
  ),
  fest(
    "dia-de-muertos-papudo",
    10,
    "Día de Muertos",
    "Day of the Dead",
    "patrimonio",
  ),
  fest(
    "feria-gastronomica-y-cervecera",
    10,
    "Feria Gastronómica y Cervecera",
    "Food and craft beer fair",
    "gastronomia",
  ),
  fest(
    "trineos-del-viejito-pascuero",
    12,
    "Trineos del Viejito Pascuero",
    "Santa Claus sleighs",
    "recreacion",
  ),
];
