import type { CategorySlug } from "@/content/types";

/**
 * Ilustraciones generadas con IA (docs/IMAGENES.md). Son escenas genéricas de
 * la costa y el campo de Papudo, NO fotos de un lugar concreto: siempre se
 * muestran con el rótulo "Ilustración IA". Las fotos reales, cuando existan,
 * las reemplazan por ficha.
 */
export type IllustrationKey =
  | "humedal"
  | "paseo"
  | "plaza"
  | "hostales"
  | "playa"
  | "caleta"
  | "cabalgata"
  | "surf"
  | "parador"
  | "casas"
  | "cocineria"
  | "mariscos"
  | "huerta"
  | "cabanas"
  | "musica"
  | "feria"
  | "buque"
  | "procesion"
  | "fondas";

export type Illustration = {
  src: string;
  width: number;
  height: number;
  alt: { es: string; en: string };
};

export const ILLUSTRATIONS: Record<IllustrationKey, Illustration> = {
  humedal: {
    src: "/ilustraciones/humedal.webp",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de un humedal costero al atardecer, con laguna tranquila, aves, un bote en un muelle de madera, dunas y el mar al fondo.",
      en: "Illustration of a coastal wetland at sunset, with a calm lagoon, birds, a boat at a wooden pier, dunes and the sea beyond.",
    },
  },
  paseo: {
    src: "/ilustraciones/paseo-costanera.webp",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de un paseo peatonal junto a la playa al atardecer, con familias caminando, puestos de artesanía y faroles.",
      en: "Illustration of a seafront promenade at sunset, with families walking, craft stalls and street lamps.",
    },
  },
  plaza: {
    src: "/ilustraciones/plaza.webp",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de la plaza de un pueblo costero de día, con árboles, una iglesia, feria artesanal y el mar al fondo.",
      en: "Illustration of a coastal town square by day, with trees, a church, a craft fair and the sea in the background.",
    },
  },
  hostales: {
    src: "/ilustraciones/hostales.webp",
    width: 1200,
    height: 900,
    alt: {
      es: "Ilustración de una terraza frente al mar al atardecer, con una mesa para dos, gaviotas y un letrero de madera en blanco.",
      en: "Illustration of a seaside terrace at sunset, with a table for two, seagulls and a blank wooden sign.",
    },
  },
  playa: {
    src: "/ilustraciones/playa.webp",
    width: 1200,
    height: 900,
    alt: {
      es: "Ilustración de una playa de arena dorada con olas turquesa, rocas y una brújula en la orilla al atardecer.",
      en: "Illustration of a golden-sand beach with turquoise waves, rocks and a compass on the shore at sunset.",
    },
  },
  caleta: {
    src: "/ilustraciones/caleta.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de una caleta de pescadores al atardecer, con botes de colores varados en la arena y casas al fondo.",
      en: "Illustration of a fishing cove at sunset, with colourful boats pulled up on the sand and houses beyond.",
    },
  },
  cabalgata: {
    src: "/ilustraciones/cabalgata.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de dos jinetes a caballo al atardecer por un camino de campo cerca del mar.",
      en: "Illustration of two horse riders at sunset on a country trail near the sea.",
    },
  },
  surf: {
    src: "/ilustraciones/surf.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de una persona surfeando una ola turquesa, con tablas clavadas en la arena.",
      en: "Illustration of a person surfing a turquoise wave, with boards stuck in the sand.",
    },
  },
  parador: {
    src: "/ilustraciones/parador.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de un parador de playa con quitasoles, reposeras y un toldo a rayas, bajo el sol.",
      en: "Illustration of a beach kiosk with parasols, loungers and a striped awning in the sun.",
    },
  },
  casas: {
    src: "/ilustraciones/casas.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de una calle empedrada con casas antiguas de colores y faroles, con gente paseando.",
      en: "Illustration of a cobbled street with old colourful houses and street lamps, with people strolling.",
    },
  },
  cocineria: {
    src: "/ilustraciones/cocineria.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de una mesa de madera con un pescado entero, vasos y guirnaldas de luces frente al mar al atardecer.",
      en: "Illustration of a wooden table with a whole fish, glasses and string lights facing the sea at sunset.",
    },
  },
  mariscos: {
    src: "/ilustraciones/mariscos.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de una mesa de degustación de mariscos bajo un toldo, con botes en la caleta al fondo.",
      en: "Illustration of a seafood tasting table under an awning, with boats in the cove behind.",
    },
  },
  huerta: {
    src: "/ilustraciones/huerta.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de una huerta con hileras de cultivos, un establo rojo, una vaca y una canasta de verduras.",
      en: "Illustration of a vegetable garden with crop rows, a red barn, a cow and a basket of vegetables.",
    },
  },
  cabanas: {
    src: "/ilustraciones/cabanas.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de cabañas de madera entre árboles al atardecer, con el mar al fondo.",
      en: "Illustration of wooden cabins among trees at sunset, with the sea in the distance.",
    },
  },
  musica: {
    src: "/ilustraciones/musica.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de un escenario al aire libre de noche, con una banda en vivo, luces y público.",
      en: "Illustration of an open-air stage at night, with a live band, lights and a crowd.",
    },
  },
  feria: {
    src: "/ilustraciones/feria.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de una feria de puestos con toldos de colores, banderines, frutas y artesanías.",
      en: "Illustration of a fair with colourful awnings, bunting, fruit and crafts.",
    },
  },
  buque: {
    src: "/ilustraciones/buque.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de un buque de velas con bandera chilena navegando en el mar al atardecer.",
      en: "Illustration of a sailing warship with a Chilean flag at sea at sunset.",
    },
  },
  procesion: {
    src: "/ilustraciones/procesion.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de botes engalanados con banderines en el mar, con una iglesia en la costa.",
      en: "Illustration of boats decked with bunting at sea, with a church on the shore.",
    },
  },
  fondas: {
    src: "/ilustraciones/fondas.svg",
    width: 1200,
    height: 675,
    alt: {
      es: "Ilustración de fondas con banderas chilenas, ramadas, un jinete y gente de fiesta.",
      en: "Illustration of fondas with Chilean flags, thatched stalls, a rider and festive people.",
    },
  },
};

export const CATEGORY_ILLUSTRATION: Record<CategorySlug, IllustrationKey> = {
  balneario: "playa",
  recreacion: "paseo",
  deportes: "playa",
  patrimonio: "plaza",
  gastronomia: "hostales",
  ruralidad: "humedal",
  alojamiento: "hostales",
};

/** Lugares con una escena que les calza mejor que la de su categoría. */
export const PLACE_ILLUSTRATION: Record<string, IllustrationKey> = {
  "papudo-parque": "paseo",
  "papudo-plaza": "plaza",
  "papudo-pullally": "humedal",
  "papudo-salinas-pullally": "humedal",
  "caleta-de-pescadores-papudo": "caleta",
  "demo-parador-ola-mansa": "parador",
  "demo-cabalgatas-del-valle": "cabalgata",
  "demo-escuela-de-surf-ola-brava": "surf",
  "demo-circuito-casas-antiguas": "casas",
  "demo-cocineria-sabor-a-mar": "cocineria",
  "demo-huerta-y-quesos-el-retono": "huerta",
  "demo-cabanas-brisa-salina": "cabanas",
};

export const LOCALITY_ILLUSTRATION: Record<string, IllustrationKey> = {
  papudo: "paseo",
  pullally: "humedal",
  "las-salinas-papudo": "humedal",
};
