import type { CategorySlug } from "@/content/types";

/**
 * Ilustraciones generadas con IA (docs/IMAGENES.md). Son escenas genéricas de
 * la costa y el campo de Papudo, NO fotos de un lugar concreto: siempre se
 * muestran con el rótulo "Ilustración IA". Las fotos reales, cuando existan,
 * las reemplazan por ficha.
 */
export type IllustrationKey =
  "humedal" | "paseo" | "plaza" | "hostales" | "playa";

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
};

export const LOCALITY_ILLUSTRATION: Record<string, IllustrationKey> = {
  papudo: "paseo",
  pullally: "humedal",
  "las-salinas-papudo": "humedal",
};
