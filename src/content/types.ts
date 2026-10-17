import type { IllustrationKey } from "@/content/images";

export type Source = { url: string; label: string };

export type Verification = "pending" | "verified" | "outdated";

/** Botón de acción de un comercio (se edita en /admin/comercios). */
export type CtaKind =
  "whatsapp" | "phone" | "website" | "menu" | "booking" | "instagram";
export type PlaceCta = { kind: CtaKind; value: string };

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

/**
 * Horario de una temporada que se repite cada año. Los meses van de 1 a 12
 * (pueden dar la vuelta: 12 → 2); los días, 0 = domingo … 6 = sábado.
 */
export type PlaceHours = {
  fromMonth: number;
  toMonth: number;
  days: number[];
  /** También abre los festivos con este horario. */
  holidays?: boolean;
  /** "HH:MM", hora de Chile. */
  opens: string;
  closes: string;
};

export type PlaceContent = {
  slug: string;
  localitySlug: string | null;
  categorySlug: CategorySlug;
  /** null = sin coordenada verificada (no se muestra en el mapa ni en recorridos). */
  latitude: number | null;
  longitude: number | null;
  /** Dirección publicada por una fuente (sirve para "Cómo llegar" sin coordenada). */
  address?: string;
  /** Negocio local (alojamiento, restaurante...). */
  business?: boolean;
  es: PlaceText;
  /** Inglés opcional: si falta, se muestra el español. */
  en?: PlaceText;
  /** Portugués opcional: si falta, se muestra el español. */
  pt?: PlaceText;
  /** Ficha de EJEMPLO (ficticia): se rotula y no se indexa (demo-content.ts). */
  demo?: boolean;
  /** Estado de verificación en terreno (de la base); sin dato, `pending`. */
  verification?: Verification;
  /** Botón de acción del comercio (de la base). */
  cta?: PlaceCta;
  /** Última verificación en terreno (de la base, ISO). */
  lastVerifiedAt?: string;
  /** Última vez que el comercio confirmó sus datos (ISO). */
  infoUpdatedAt?: string;
  /** Instagram del local (enlace completo). */
  instagram?: string;
  /** Enlace de Google Maps que compartió el local. */
  mapsUrl?: string;
  /** Horarios por temporada, como los informó el local. */
  hours?: PlaceHours[];
  source?: Source;
  tvSource?: Source;
  extraSources?: Source[];
};

export type EventText = { name: string; short: string };

/** Evento recurrente (sin fecha de un año concreto: se confirma con el municipio). */
export type EventContent = {
  slug: string;
  categorySlug: CategorySlug;
  localitySlug: string | null;
  /** Mes en que se celebra (1–12); null = por confirmar. */
  month: number | null;
  /** Día fijo del mes, si lo tiene (p. ej. 26 de noviembre). */
  day?: number;
  /** Temporada cuando no hay mes. */
  season?: "summer";
  /** Aparece en el carrusel de destacados. */
  featured?: boolean;
  /** Ilustración del banner; si falta, la de su producto. */
  illustration?: IllustrationKey;
  /** Evento de EJEMPLO (ficticio): se rotula y no se indexa. */
  demo?: boolean;
  /** Estado de verificación en terreno (de la base); sin dato, `pending`. */
  verification?: Verification;
  es: EventText;
  en?: EventText;
  pt?: EventText;
  source?: Source;
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

/**
 * Los seis productos turísticos del PLADETUR de Papudo (iD, 2023, p. 136) más
 * alojamiento, que es un servicio y no un producto.
 */
export type CategorySlug =
  | "balneario"
  | "recreacion"
  | "deportes"
  | "patrimonio"
  | "gastronomia"
  | "ruralidad"
  | "alojamiento";
