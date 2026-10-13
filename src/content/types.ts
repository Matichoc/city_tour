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
  /** null = sin coordenada verificada (no se muestra en el mapa ni en recorridos). */
  latitude: number | null;
  longitude: number | null;
  /** Dirección publicada por una fuente (sirve para "Cómo llegar" sin coordenada). */
  address?: string;
  /** Enlace directo a Google Maps cuando aún no hay coordenadas verificadas. */
  mapsUrl?: string;
  /** Negocio local (alojamiento, restaurante...). */
  business?: boolean;
  es: PlaceText;
  /** Inglés opcional: si falta, se muestra el español. */
  en?: PlaceText;
  source?: Source;
  tvSource?: Source;
  extraSources?: Source[];
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
