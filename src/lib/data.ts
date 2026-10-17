/**
 * Capa de datos. `getData()` entrega las consultas sobre el contenido del
 * sitio: de Supabase si está configurado, o de `src/content` como respaldo
 * (src/lib/db/content-source.ts). El resto de la app usa estos tipos.
 */
import { cache } from "react";
import type { SiteContent } from "@/content";
import { CATEGORY_DEFS, LEGACY_CATEGORY } from "@/content/catalog";
import {
  CATEGORY_ILLUSTRATION,
  ILLUSTRATIONS,
  LOCALITY_ILLUSTRATION,
  PLACE_ILLUSTRATION,
  type IllustrationKey,
} from "@/content/images";
import { DEMO_REVIEWS } from "@/content/demo-content";
import type { CategorySlug, EventContent, Source } from "@/content/types";
import type { Locale } from "@/i18n/routing";
import { loadContent } from "@/lib/db/content-source";

/**
 * Las fichas y eventos de EJEMPLO (ficticios) se muestran por defecto en la
 * demostración y se ocultan con NEXT_PUBLIC_SHOW_DEMO=0 (docs/DECISIONES.md).
 */
export const SHOW_DEMO = process.env.NEXT_PUBLIC_SHOW_DEMO !== "0";

/** Promedio y cantidad de las opiniones simuladas de una ficha de ejemplo. */
export function seededRating(slug: string): {
  average: number | null;
  count: number;
} {
  const r = DEMO_REVIEWS[slug] ?? [];
  if (r.length === 0) return { average: null, count: 0 };
  return {
    average: r.reduce((n, x) => n + x.rating, 0) / r.length,
    count: r.length,
  };
}

export type Place = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: CategorySlug;
  categoryName: string;
  localitySlug: string | null;
  localityName: string | null;
  /** null = sin coordenada verificada. */
  latitude: number | null;
  longitude: number | null;
  hasLocation: boolean;
  address: string | null;
  business: boolean;
  visitMinutes: number;
  sources: Source[];
  /** Todo el contenido está sin verificar en terreno. */
  verification: "pending" | "verified" | "outdated";
  /** `true` si el texto mostrado es español porque falta la traducción. */
  fallbackToSpanish: boolean;
  /** Ilustración (IA) de la ficha: la del lugar o, si no, la de su categoría. */
  picture: Picture;
  /** Ficha de EJEMPLO (ficticia). */
  demo: boolean;
  /** Opiniones simuladas (solo fichas de ejemplo). */
  ratingAverage: number | null;
  ratingCount: number;
};

export type Locality = {
  slug: string;
  name: string;
  summary: string | null;
  source: Source | null;
  latitude: number | null;
  longitude: number | null;
  picture: Picture | null;
};

export type RouteStop = { place: Place; notes: string | null };

export type Route = {
  slug: string;
  name: string;
  description: string;
  durationMinutes: number | null;
  stops: RouteStop[];
  source: Source | null;
  cover: { src: string; alt: string } | null;
};

export type Category = { slug: CategorySlug; name: string; count: number };

export type Picture = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

function picture(key: IllustrationKey, locale: Locale): Picture {
  const i = ILLUSTRATIONS[key];
  return {
    src: i.src,
    width: i.width,
    height: i.height,
    alt: locale === "en" ? i.alt.en : i.alt.es,
  };
}

export const illustrationFor = (key: IllustrationKey, locale: Locale) =>
  picture(key, locale);

const pick = <T>(locale: Locale, es: T, en?: T, pt?: T): T =>
  locale === "en" && en ? en : locale === "pt" && pt ? pt : es;

export type PlaceFilters = {
  category?: string;
  locality?: string;
  query?: string;
};

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export type EventItem = {
  slug: string;
  name: string;
  shortDescription: string;
  categorySlug: CategorySlug;
  categoryName: string;
  localitySlug: string | null;
  localityName: string | null;
  /** Mes (1–12) o null si falta confirmar. */
  month: number | null;
  day: number | null;
  season: "summer" | null;
  sources: Source[];
  verification: "pending" | "verified" | "outdated";
  fallbackToSpanish: boolean;
  featured: boolean;
  /** Evento de EJEMPLO (ficticio). */
  demo: boolean;
  picture: Picture;
  ratingAverage: number | null;
  ratingCount: number;
};

export const isCategorySlug = (v: string | undefined): v is CategorySlug =>
  CATEGORY_DEFS.some((c) => c.slug === v);

/** Slug actual de una categoría, aceptando los nombres anteriores. */
export function canonicalCategory(v: string | undefined): CategorySlug | null {
  if (isCategorySlug(v)) return v;
  return (v && LEGACY_CATEGORY[v]) || null;
}

/**
 * Consultas sobre un contenido dado. Las fichas y eventos de EJEMPLO se
 * incluyen solo si `showDemo` (NEXT_PUBLIC_SHOW_DEMO distinto de "0").
 */
export function createData(content: SiteContent, showDemo = SHOW_DEMO) {
  const { localities, routes } = content;
  const realPlaces = content.places.filter((p) => !p.demo);
  const realEvents = content.events.filter((e) => !e.demo);
  const places = showDemo ? content.places : realPlaces;
  const events = showDemo ? content.events : realEvents;

  function listLocalities(locale: Locale): Locality[] {
    return localities.map((l) => ({
      slug: l.slug,
      name: pick(locale, l.es, l.en),
      summary: (locale === "en" ? l.summaryEn : undefined) ?? l.summary ?? null,
      source: l.sourceUrl
        ? { url: l.sourceUrl, label: l.sourceLabel ?? l.sourceUrl }
        : null,
      latitude: l.latitude,
      longitude: l.longitude,
      picture: LOCALITY_ILLUSTRATION[l.slug]
        ? picture(LOCALITY_ILLUSTRATION[l.slug]!, locale)
        : null,
    }));
  }

  function getLocality(slug: string, locale: Locale): Locality | undefined {
    return listLocalities(locale).find((l) => l.slug === slug);
  }
  const listLocalitySlugs = () => localities.map((l) => l.slug);

  function toPlace(slug: string, locale: Locale): Place | undefined {
    const p = places.find((x) => x.slug === slug);
    if (!p) return undefined;
    const cat = CATEGORY_DEFS.find((c) => c.slug === p.categorySlug)!;
    const loc = p.localitySlug
      ? localities.find((l) => l.slug === p.localitySlug)
      : undefined;
    const text = pick(locale, p.es, p.en, p.pt);
    const rating = seededRating(p.slug);
    return {
      slug: p.slug,
      name: text.name,
      shortDescription: text.short,
      description: text.description,
      categorySlug: p.categorySlug,
      categoryName: pick(locale, cat.es, cat.en, cat.pt),
      localitySlug: loc?.slug ?? null,
      localityName: loc ? pick(locale, loc.es, loc.en) : null,
      latitude: p.latitude,
      longitude: p.longitude,
      hasLocation: p.latitude !== null && p.longitude !== null,
      address: p.address ?? null,
      business: p.business === true,
      visitMinutes: cat.defaultVisitMinutes,
      sources: [p.source, p.tvSource, ...(p.extraSources ?? [])].filter(
        (s): s is Source => Boolean(s),
      ),
      verification: "pending",
      fallbackToSpanish:
        (locale === "en" && !p.en) || (locale === "pt" && !p.pt),
      picture: picture(
        PLACE_ILLUSTRATION[p.slug] ?? CATEGORY_ILLUSTRATION[p.categorySlug],
        locale,
      ),
      demo: p.demo === true,
      ratingAverage: rating.average,
      ratingCount: rating.count,
    };
  }

  function listPlaces(locale: Locale, filters: PlaceFilters = {}): Place[] {
    const q = filters.query ? normalize(filters.query.trim()) : "";
    return places
      .map((p) => toPlace(p.slug, locale)!)
      .filter((p) => !filters.category || p.categorySlug === filters.category)
      .filter((p) => !filters.locality || p.localitySlug === filters.locality)
      .filter(
        (p) =>
          !q ||
          normalize(
            `${p.name} ${p.shortDescription} ${p.localityName ?? ""}`,
          ).includes(q),
      );
  }

  const getPlace = (slug: string, locale: Locale) => toPlace(slug, locale);

  function toEvent(e: EventContent, locale: Locale): EventItem {
    const cat = CATEGORY_DEFS.find((c) => c.slug === e.categorySlug)!;
    const loc = localities.find((l) => l.slug === e.localitySlug);
    const text = pick(locale, e.es, e.en, e.pt);
    const rating = seededRating(e.slug);
    return {
      slug: e.slug,
      name: text.name,
      shortDescription: text.short,
      categorySlug: e.categorySlug,
      categoryName: pick(locale, cat.es, cat.en, cat.pt),
      localitySlug: loc?.slug ?? null,
      localityName: loc ? pick(locale, loc.es, loc.en) : null,
      month: e.month,
      day: e.day ?? null,
      season: e.season ?? null,
      sources: [e.source, ...(e.extraSources ?? [])].filter((s): s is Source =>
        Boolean(s),
      ),
      verification: "pending",
      fallbackToSpanish:
        (locale === "en" && !e.en) || (locale === "pt" && !e.pt),
      featured: e.featured === true,
      demo: e.demo === true,
      picture: picture(
        e.illustration ?? CATEGORY_ILLUSTRATION[e.categorySlug],
        locale,
      ),
      ratingAverage: rating.average,
      ratingCount: rating.count,
    };
  }

  /** Agenda anual: ordenada por mes; los eventos sin mes van al final. */
  function listEvents(
    locale: Locale,
    filters: { category?: string } = {},
  ): EventItem[] {
    return events
      .map((e) => toEvent(e, locale))
      .filter((e) => !filters.category || e.categorySlug === filters.category)
      .sort(
        (a, b) =>
          (a.month ?? 99) - (b.month ?? 99) || (a.day ?? 0) - (b.day ?? 0),
      );
  }

  function getEvent(slug: string, locale: Locale): EventItem | undefined {
    const e = events.find((x) => x.slug === slug);
    return e ? toEvent(e, locale) : undefined;
  }

  const listEventSlugs = () => events.map((e) => e.slug);
  /** Para el sitemap: solo eventos reales. */
  const listIndexableEventSlugs = () => realEvents.map((e) => e.slug);

  const listPlaceSlugs = () => places.map((p) => p.slug);
  /** Para el sitemap: solo fichas reales (las de ejemplo no se indexan). */
  const listIndexablePlaceSlugs = () => realPlaces.map((p) => p.slug);

  function listCategories(locale: Locale): Category[] {
    return CATEGORY_DEFS.map((c) => ({
      slug: c.slug,
      name: pick(locale, c.es, c.en, c.pt),
      count: places.filter((p) => p.categorySlug === c.slug).length,
    }));
  }

  function listRoutes(locale: Locale): Route[] {
    return routes.map((r) => getRoute(r.slug, locale)!);
  }

  function getRoute(slug: string, locale: Locale): Route | undefined {
    const r = routes.find((x) => x.slug === slug);
    if (!r) return undefined;
    const text = pick(locale, r.es, r.en);
    return {
      slug: r.slug,
      name: text.name,
      description: text.description,
      durationMinutes: r.durationMinutes,
      stops: r.stops.flatMap((s) => {
        const place = toPlace(s.slug, locale);
        return place
          ? [
              {
                place,
                notes: s.notes ? pick(locale, s.notes.es, s.notes.en) : null,
              },
            ]
          : [];
      }),
      source: r.source ?? null,
      cover: r.cover
        ? {
            src: r.cover.src,
            alt: locale === "en" ? r.cover.alt.en : r.cover.alt.es,
          }
        : null,
    };
  }

  const listRouteSlugs = () => routes.map((r) => r.slug);

  return {
    listLocalities,
    getLocality,
    listLocalitySlugs,
    listPlaces,
    getPlace,
    listPlaceSlugs,
    /** Para el sitemap: solo fichas reales (las de ejemplo no se indexan). */
    listIndexablePlaceSlugs,
    listEvents,
    getEvent,
    listEventSlugs,
    /** Para el sitemap: solo eventos reales. */
    listIndexableEventSlugs,
    listCategories,
    listRoutes,
    getRoute,
    listRouteSlugs,
  };
}

export type Data = ReturnType<typeof createData>;

/** Datos del sitio para esta petición (Supabase o, si no hay, el repo). */
export const getData = cache(async (): Promise<Data> =>
  createData(await loadContent()),
);

/** Lugar con coordenada verificada (se puede ubicar en el mapa y en recorridos). */
export type LocatedPlace = Place & { latitude: number; longitude: number };
export const isLocated = (p: Place): p is LocatedPlace => p.hasLocation;
