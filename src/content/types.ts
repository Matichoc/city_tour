export type Source = { url: string; label: string };

export type LocalityContent = {
  slug: string;
  es: string;
  en: string;
  latitude: number | null;
  longitude: number | null;
  summary?: string;
  summaryEn?: string;
  sourceUrl?: string;
  sourceLabel?: string;
};

export type PlaceText = { name: string; short: string; description: string };

export type PlaceContent = {
  slug: string;
  localitySlug: string | null;
  categorySlug: CategorySlug;
  latitude: number;
  longitude: number;
  es: PlaceText;
  /** Inglés opcional: si falta, se muestra el español. */
  en?: PlaceText;
  source?: Source;
  tvSource?: Source;
};

export type RouteStopContent = {
  slug: string;
  notes?: { es: string; en?: string };
};

export type RouteContent = {
  slug: string;
  durationMinutes: number | null;
  es: { name: string; description: string };
  en?: { name: string; description: string };
  stops: RouteStopContent[];
  source?: Source;
  /** Ilustración de portada (hecha con IA: se rotula como ilustración). */
  cover?: { src: string; alt: { es: string; en: string } };
};

export type CategorySlug =
  | "playas"
  | "naturaleza"
  | "patrimonio"
  | "gastronomia"
  | "alojamiento"
  | "actividades";
