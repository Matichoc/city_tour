/**
 * Datos de DEMOSTRACIÓN. Sirven solo para ver la interfaz mientras no existe
 * la base de datos (Fase 1). Ningún dato de contacto, horario, precio ni
 * coordenada está verificado: todo queda `pending` y la UI lo muestra así.
 * Reglas: ver docs/PLAN.md §8 (no inventar información turística).
 */
import type { Locale } from "@/i18n/routing";

export type CategorySlug =
  | "playas"
  | "patrimonio"
  | "gastronomia"
  | "alojamiento"
  | "naturaleza"
  | "actividades";

export type Localized = { es: string; en?: string };

export type VerificationStatus = "pending" | "verified" | "outdated";

export type Place = {
  slug: string;
  category: CategorySlug;
  name: Localized;
  shortDescription: Localized;
  /** `true` = ficha ficticia de ejemplo (no existe en la realidad). */
  fictitious: boolean;
  verification: VerificationStatus;
  /** Fuente pública de la que sale el nombre, si existe. */
  source?: { title: string; url: string };
};

export const CATEGORIES: { slug: CategorySlug; name: Localized }[] = [
  { slug: "playas", name: { es: "Playas", en: "Beaches" } },
  { slug: "patrimonio", name: { es: "Patrimonio", en: "Heritage" } },
  { slug: "gastronomia", name: { es: "Gastronomía", en: "Food" } },
  { slug: "alojamiento", name: { es: "Alojamiento", en: "Stay" } },
  { slug: "naturaleza", name: { es: "Naturaleza", en: "Nature" } },
  { slug: "actividades", name: { es: "Actividades", en: "Activities" } },
];

const PENDING_ES =
  "Ficha de demostración. Descripción pendiente de verificación.";
const PENDING_EN = "Demo listing. Description pending verification.";

export const PLACES: Place[] = [
  {
    slug: "playa-grande-de-papudo",
    category: "playas",
    name: { es: "Playa Grande de Papudo", en: "Papudo Main Beach" },
    shortDescription: { es: PENDING_ES, en: PENDING_EN },
    fictitious: false,
    verification: "pending",
  },
  {
    slug: "playa-chica-de-papudo",
    category: "playas",
    name: { es: "Playa Chica de Papudo", en: "Papudo Small Beach" },
    shortDescription: { es: PENDING_ES, en: PENDING_EN },
    fictitious: false,
    verification: "pending",
  },
  {
    slug: "paseo-la-terraza",
    category: "patrimonio",
    name: { es: "Paseo La Terraza" },
    shortDescription: { es: PENDING_ES },
    fictitious: false,
    verification: "pending",
    source: {
      title: "EcuRed — Papudo (Chile)",
      url: "https://www.ecured.cu/Papudo_(Chile)",
    },
  },
  {
    slug: "iglesia-nuestra-senora-de-las-mercedes",
    category: "patrimonio",
    name: {
      es: "Iglesia Nuestra Señora de las Mercedes",
      en: "Our Lady of Mercy Church",
    },
    shortDescription: { es: PENDING_ES, en: PENDING_EN },
    fictitious: false,
    verification: "pending",
    source: {
      title: "EcuRed — Papudo (Chile)",
      url: "https://www.ecured.cu/Papudo_(Chile)",
    },
  },
  {
    slug: "alojamiento-de-ejemplo",
    category: "alojamiento",
    name: { es: "Alojamiento de ejemplo", en: "Sample stay" },
    shortDescription: {
      es: "Ficha ficticia para probar la interfaz. No existe.",
      en: "Fictitious listing to test the interface. It does not exist.",
    },
    fictitious: true,
    verification: "pending",
  },
  {
    slug: "restaurante-de-ejemplo",
    category: "gastronomia",
    name: { es: "Restaurante de ejemplo", en: "Sample restaurant" },
    shortDescription: {
      es: "Ficha ficticia para probar la interfaz. No existe.",
      en: "Fictitious listing to test the interface. It does not exist.",
    },
    fictitious: true,
    verification: "pending",
  },
];

/** Devuelve el texto en el idioma pedido; si falta, cae a español. */
export function localize(text: Localized, locale: Locale): string {
  return (locale === "en" ? text.en : undefined) ?? text.es;
}

export function listPlaces(category?: string): Place[] {
  if (!category) return PLACES;
  return PLACES.filter((p) => p.category === category);
}

export function getPlace(slug: string): Place | undefined {
  return PLACES.find((p) => p.slug === slug);
}

export function isCategorySlug(
  value: string | undefined,
): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}
