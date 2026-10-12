import type { CategorySlug } from "@/content/types";

export type CategoryDef = {
  slug: CategorySlug;
  es: string;
  en: string;
  /** Minutos de visita ESTIMADOS por defecto para el motor de recorridos. */
  defaultVisitMinutes: number;
};

export const CATEGORY_DEFS: CategoryDef[] = [
  { slug: "playas", es: "Playas", en: "Beaches", defaultVisitMinutes: 90 },
  {
    slug: "naturaleza",
    es: "Campo y naturaleza",
    en: "Countryside & nature",
    defaultVisitMinutes: 60,
  },
  {
    slug: "patrimonio",
    es: "Patrimonio",
    en: "Heritage",
    defaultVisitMinutes: 30,
  },
  {
    slug: "gastronomia",
    es: "Gastronomía",
    en: "Food",
    defaultVisitMinutes: 60,
  },
  {
    slug: "alojamiento",
    es: "Alojamiento",
    en: "Stay",
    defaultVisitMinutes: 0,
  },
  {
    slug: "actividades",
    es: "Actividades",
    en: "Activities",
    defaultVisitMinutes: 90,
  },
];

/** Centro del mapa: coordenada de la localidad de Papudo (directorio_turistico). */
export const PAPUDO_CENTER = {
  latitude: -32.5069,
  longitude: -71.4458,
} as const;

/**
 * Contacto de la Municipalidad. El sitio web lo entregó el usuario; el resto
 * viene del repo de referencia y falta confirmarlo con la municipalidad.
 */
export const MUNICIPALITY = {
  name: "Municipalidad de Papudo",
  website: "https://www.munipapudo.cl",
  links: [
    { kind: "facebook", value: "https://www.facebook.com/munipapudo/" },
    { kind: "instagram", value: "https://www.instagram.com/munipapudo/" },
    { kind: "phone", value: "+56332325100" },
  ],
} as const;
