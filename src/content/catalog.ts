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
 * Contacto de la Municipalidad: solo datos con fuente pública.
 * - Sitio: registro de la Superintendencia de Salud (CESFAM Papudo, dependiente
 *   de la municipalidad). Wikipedia cita además municipalidadpapudo.cl.
 * - Teléfono: Memoria explicativa del Plan Regulador Comunal (MMA, 2022).
 * Redes sociales y correo se retiraron por no encontrar una fuente que los respalde.
 */
export const MUNICIPALITY = {
  name: "Municipalidad de Papudo",
  website: "https://www.munipapudo.cl",
  address: "Chorrillos 9, Papudo",
  links: [{ kind: "phone", value: "+56332325100" }],
  sources: [
    {
      url: "https://www.superdesalud.gob.cl/registro/centro-de-salud-familiar-papudo/",
      label: "Superintendencia de Salud — Centro de Salud Familiar Papudo",
    },
    {
      url: "https://eae.mma.gob.cl/storage/documents/04_Anteproyecto_Memoria_Explicativa_PRC_Papudo.pdf.pdf",
      label: "MMA — Anteproyecto Plan Regulador Comunal de Papudo",
    },
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
