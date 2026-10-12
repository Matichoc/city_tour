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
 * viene del repo de referencia (donde el sitio figuraba como
 * municipalidadpapudo.cl) y falta confirmarlo con la municipalidad.
 */
export const MUNICIPALITY = {
  name: "Municipalidad de Papudo",
  website: "https://www.munipapudo.cl",
  links: [
    { kind: "facebook", value: "https://www.facebook.com/munipapudo/" },
    { kind: "instagram", value: "https://www.instagram.com/munipapudo/" },
    { kind: "phone", value: "+56332325100" },
    { kind: "email", value: "contacto@municipalidadpapudo.cl" },
  ],
} as const;

/** Auspiciador permanente del sitio (como en directorio_turistico). */
export const SPONSOR = {
  slug: "matichoc",
  name: "Matichoc",
  logoPath: "/brand/matichoc-logo.webp",
  websiteUrl: "https://www.matichoc.cl",
  tagline: {
    es: "Chocolate artesanal hecho en La Ligua",
    en: "Artisanal chocolate made in La Ligua",
  },
} as const;
