/**
 * Capa de datos. Hoy lee de `src/content` (contenido real de Papudo con
 * fuente). Al conectar Supabase (Fase 2) se cambia solo este archivo: el resto
 * de la app usa estos tipos.
 */
import { CATEGORY_DEFS } from "@/content/catalog";
import { LOCALITIES, PLACES } from "@/content/papudo-places";
import { ROUTES } from "@/content/papudo-routes";
import type { CategorySlug, Source } from "@/content/types";
import type { Locale } from "@/i18n/routing";

export type Place = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: CategorySlug;
  categoryName: string;
  localitySlug: string | null;
  localityName: string | null;
  latitude: number;
  longitude: number;
  visitMinutes: number;
  sources: Source[];
  /** Todo el contenido está sin verificar en terreno. */
  verification: "pending" | "verified" | "outdated";
  /** `true` si el texto mostrado es español porque falta la traducción. */
  fallbackToSpanish: boolean;
};

export type Locality = {
  slug: string;
  name: string;
  summary: string | null;
  source: Source | null;
  latitude: number | null;
  longitude: number | null;
};

export type RouteStop = { place: Place; notes: string | null };

export type Route = {
  slug: string;
  name: string;
  description: string;
  durationMinutes: number | null;
  stops: RouteStop[];
  source: Source | null;
};

export type Category = { slug: CategorySlug; name: string; count: number };

const pick = <T>(locale: Locale, es: T, en?: T): T =>
  locale === "en" && en ? en : es;

export function listLocalities(locale: Locale): Locality[] {
  return LOCALITIES.map((l) => ({
    slug: l.slug,
    name: pick(locale, l.es, l.en),
    summary: (locale === "en" ? l.summaryEn : undefined) ?? l.summary ?? null,
    source: l.sourceUrl
      ? { url: l.sourceUrl, label: l.sourceLabel ?? l.sourceUrl }
      : null,
    latitude: l.latitude,
    longitude: l.longitude,
  }));
}

function toPlace(slug: string, locale: Locale): Place | undefined {
  const p = PLACES.find((x) => x.slug === slug);
  if (!p) return undefined;
  const cat = CATEGORY_DEFS.find((c) => c.slug === p.categorySlug)!;
  const loc = p.localitySlug
    ? LOCALITIES.find((l) => l.slug === p.localitySlug)
    : undefined;
  const text = pick(locale, p.es, p.en);
  return {
    slug: p.slug,
    name: text.name,
    shortDescription: text.short,
    description: text.description,
    categorySlug: p.categorySlug,
    categoryName: pick(locale, cat.es, cat.en),
    localitySlug: loc?.slug ?? null,
    localityName: loc ? pick(locale, loc.es, loc.en) : null,
    latitude: p.latitude,
    longitude: p.longitude,
    visitMinutes: cat.defaultVisitMinutes,
    sources: [p.source, p.tvSource].filter((s): s is Source => Boolean(s)),
    verification: "pending",
    fallbackToSpanish: locale === "en" && !p.en,
  };
}

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

export function listPlaces(
  locale: Locale,
  filters: PlaceFilters = {},
): Place[] {
  const q = filters.query ? normalize(filters.query.trim()) : "";
  return PLACES.map((p) => toPlace(p.slug, locale)!)
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

export const getPlace = (slug: string, locale: Locale) => toPlace(slug, locale);
export const listPlaceSlugs = () => PLACES.map((p) => p.slug);

export function listCategories(locale: Locale): Category[] {
  return CATEGORY_DEFS.map((c) => ({
    slug: c.slug,
    name: pick(locale, c.es, c.en),
    count: PLACES.filter((p) => p.categorySlug === c.slug).length,
  }));
}

export const isCategorySlug = (v: string | undefined): v is CategorySlug =>
  CATEGORY_DEFS.some((c) => c.slug === v);

export function listRoutes(locale: Locale): Route[] {
  return ROUTES.map((r) => getRoute(r.slug, locale)!);
}

export function getRoute(slug: string, locale: Locale): Route | undefined {
  const r = ROUTES.find((x) => x.slug === slug);
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
  };
}

export const listRouteSlugs = () => ROUTES.map((r) => r.slug);
