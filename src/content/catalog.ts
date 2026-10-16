import type { CategorySlug } from "@/content/types";

export type CategoryDef = {
  slug: CategorySlug;
  es: string;
  en: string;
  pt: string;
  /** Minutos de visita ESTIMADOS por defecto para el motor de recorridos. */
  defaultVisitMinutes: number;
};

export const CATEGORY_DEFS: CategoryDef[] = [
  {
    slug: "balneario",
    es: "Balneario",
    en: "Seaside",
    pt: "Balneário",
    defaultVisitMinutes: 90,
  },
  {
    slug: "recreacion",
    es: "Recreación",
    en: "Recreation",
    pt: "Recreação",
    defaultVisitMinutes: 90,
  },
  {
    slug: "deportes",
    es: "Deportes",
    en: "Sports",
    pt: "Esportes",
    defaultVisitMinutes: 90,
  },
  {
    slug: "patrimonio",
    es: "Cultura y patrimonio",
    en: "Culture & heritage",
    pt: "Cultura e patrimônio",
    defaultVisitMinutes: 30,
  },
  {
    slug: "gastronomia",
    es: "Gastronomía",
    en: "Food",
    pt: "Gastronomia",
    defaultVisitMinutes: 60,
  },
  {
    slug: "ruralidad",
    es: "Campo y ruralidad",
    en: "Countryside",
    pt: "Campo e ruralidade",
    defaultVisitMinutes: 60,
  },
  {
    slug: "alojamiento",
    es: "Alojamiento",
    en: "Stay",
    pt: "Hospedagem",
    defaultVisitMinutes: 0,
  },
];

/**
 * Categorías anteriores → actuales, para que sigan funcionando los enlaces y
 * afiches QR que ya se compartieron (`?categoria=playas`).
 */
export const LEGACY_CATEGORY: Record<string, CategorySlug> = {
  playas: "balneario",
  naturaleza: "ruralidad",
  actividades: "recreacion",
};

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
