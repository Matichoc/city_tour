/**
 * Origen del contenido del sitio. Con `NEXT_PUBLIC_SUPABASE_URL` y
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` lee de Supabase (solo lo publicado, por RLS);
 * sin ellas, o si la base falla o está vacía, usa el contenido del repo. Así el
 * sitio nunca queda en blanco.
 */
import { STATIC_CONTENT, type SiteContent } from "@/content";
import { CATEGORY_DEFS } from "@/content/catalog";
import { ILLUSTRATIONS, type IllustrationKey } from "@/content/images";
import type {
  CategorySlug,
  EventContent,
  LocalityContent,
  PlaceContent,
  RouteContent,
  Source,
} from "@/content/types";

/** Segundos que una página puede mostrar datos de la base sin volver a pedirlos. */
export const CONTENT_REVALIDATE_SECONDS = 300;

export type SupabaseConfig = { url: string; key: string };

/** Acepta la URL del proyecto aunque venga con `/rest/v1/` al final. */
export function supabaseConfig(
  env: Record<string, string | undefined> = process.env,
): SupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && key ? { url, key } : null;
}

// ── Filas tal como las entrega PostgREST ──────────────────────────────────
type Tr<T> = ({ locale: string } & T)[];
type SourceRow = { sort_order: number; title: string; url: string | null };
type SlugRef = { slug: string } | null;

export type PlaceRow = {
  slug: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  is_demo: boolean;
  is_business: boolean;
  category: SlugRef;
  locality: SlugRef;
  translations: Tr<{
    name: string;
    short_description: string | null;
    full_description: string | null;
  }>;
  sources: SourceRow[];
};

export type EventRow = {
  slug: string;
  recurrence_month: number | null;
  recurrence_day: number | null;
  season: string | null;
  featured: boolean;
  is_demo: boolean;
  illustration: string | null;
  category: SlugRef;
  locality: SlugRef;
  translations: Tr<{ name: string; description: string | null }>;
  sources: SourceRow[];
};

export type RouteRow = {
  slug: string;
  duration_minutes: number | null;
  cover_image_path: string | null;
  translations: Tr<{
    name: string;
    short_description: string | null;
    cover_alt: string | null;
  }>;
  stops: {
    position: number;
    place: SlugRef;
    translations: Tr<{ narrative: string | null }>;
  }[];
  sources: SourceRow[];
};

export type LocalityRow = {
  slug: string;
  latitude: number | null;
  longitude: number | null;
  source_url: string | null;
  source_label: string | null;
  translations: Tr<{ name: string; summary: string | null }>;
};

export type ContentRows = {
  localities: LocalityRow[];
  places: PlaceRow[];
  events: EventRow[];
  routes: RouteRow[];
};

const SOURCES = "sources(sort_order,title,url)";
export const QUERIES: Record<keyof ContentRows, string> = {
  localities:
    "localities?select=slug,latitude,longitude,source_url,source_label," +
    "translations:locality_translations(locale,name,summary)&order=sort_order,slug",
  places:
    "places?select=slug,latitude,longitude,address,is_demo,is_business," +
    "category:categories(slug),locality:localities(slug)," +
    `translations:place_translations(locale,name,short_description,full_description),${SOURCES}` +
    "&publication_status=eq.published&order=sort_order,slug&sources.order=sort_order",
  events:
    "events?select=slug,recurrence_month,recurrence_day,season,featured,is_demo,illustration," +
    "category:categories(slug),locality:localities(slug)," +
    `translations:event_translations(locale,name,description),${SOURCES}` +
    "&publication_status=eq.published&order=sort_order,slug&sources.order=sort_order",
  routes:
    "routes?select=slug,duration_minutes,cover_image_path," +
    "translations:route_translations(locale,name,short_description,cover_alt)," +
    "stops:route_stops(position,place:places(slug),translations:route_stop_translations(locale,narrative))," +
    `${SOURCES}&publication_status=eq.published&order=sort_order,slug` +
    "&stops.order=position&sources.order=sort_order",
};

// ── Filas → contenido del sitio ───────────────────────────────────────────
const tr = <T>(rows: Tr<T>, locale: string) =>
  rows.find((r) => r.locale === locale);

const toSources = (rows: SourceRow[]): Source[] =>
  [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((s) => (s.url ? [{ url: s.url, label: s.title }] : []));

const categoryOf = (ref: SlugRef): CategorySlug | null =>
  CATEGORY_DEFS.find((c) => c.slug === ref?.slug)?.slug ?? null;

const isIllustration = (k: string | null): k is IllustrationKey =>
  k !== null && k in ILLUSTRATIONS;

function toPlace(r: PlaceRow): PlaceContent | null {
  const categorySlug = categoryOf(r.category);
  const text = (locale: string) => {
    const t = tr(r.translations, locale);
    return t
      ? {
          name: t.name,
          short: t.short_description ?? "",
          description: t.full_description ?? "",
        }
      : undefined;
  };
  const es = text("es");
  if (!categorySlug || !es) return null;
  const [source, ...extraSources] = toSources(r.sources);
  return {
    slug: r.slug,
    localitySlug: r.locality?.slug ?? null,
    categorySlug,
    latitude: r.latitude,
    longitude: r.longitude,
    ...(r.address ? { address: r.address } : {}),
    ...(r.is_business ? { business: true } : {}),
    es,
    ...(text("en") ? { en: text("en") } : {}),
    ...(text("pt") ? { pt: text("pt") } : {}),
    ...(r.is_demo ? { demo: true } : {}),
    ...(source ? { source } : {}),
    ...(extraSources.length ? { extraSources } : {}),
  };
}

function toEvent(r: EventRow): EventContent | null {
  const categorySlug = categoryOf(r.category);
  const text = (locale: string) => {
    const t = tr(r.translations, locale);
    return t ? { name: t.name, short: t.description ?? "" } : undefined;
  };
  const es = text("es");
  if (!categorySlug || !es) return null;
  const [source, ...extraSources] = toSources(r.sources);
  return {
    slug: r.slug,
    categorySlug,
    localitySlug: r.locality?.slug ?? null,
    month: r.recurrence_month,
    ...(r.recurrence_day ? { day: r.recurrence_day } : {}),
    ...(r.season === "summer" ? { season: "summer" as const } : {}),
    ...(r.featured ? { featured: true } : {}),
    ...(isIllustration(r.illustration) ? { illustration: r.illustration } : {}),
    ...(r.is_demo ? { demo: true } : {}),
    es,
    ...(text("en") ? { en: text("en") } : {}),
    ...(text("pt") ? { pt: text("pt") } : {}),
    ...(source ? { source } : {}),
    ...(extraSources.length ? { extraSources } : {}),
  };
}

function toRoute(r: RouteRow): RouteContent | null {
  const es = tr(r.translations, "es");
  if (!es) return null;
  const en = tr(r.translations, "en");
  const [source] = toSources(r.sources);
  return {
    slug: r.slug,
    durationMinutes: r.duration_minutes,
    es: { name: es.name, description: es.short_description ?? "" },
    ...(en
      ? { en: { name: en.name, description: en.short_description ?? "" } }
      : {}),
    stops: [...r.stops]
      .sort((a, b) => a.position - b.position)
      .flatMap((s) => {
        if (!s.place) return [];
        const nEs = tr(s.translations, "es")?.narrative;
        const nEn = tr(s.translations, "en")?.narrative;
        return [
          {
            slug: s.place.slug,
            ...(nEs ? { notes: { es: nEs, ...(nEn ? { en: nEn } : {}) } } : {}),
          },
        ];
      }),
    ...(source ? { source } : {}),
    ...(r.cover_image_path
      ? {
          cover: {
            src: r.cover_image_path,
            alt: {
              es: es.cover_alt ?? "",
              en: en?.cover_alt ?? es.cover_alt ?? "",
            },
          },
        }
      : {}),
  };
}

function toLocality(r: LocalityRow): LocalityContent | null {
  const es = tr(r.translations, "es");
  if (!es) return null;
  const en = tr(r.translations, "en");
  return {
    slug: r.slug,
    es: es.name,
    en: en?.name ?? es.name,
    latitude: r.latitude,
    longitude: r.longitude,
    ...(es.summary ? { summary: es.summary } : {}),
    ...(en?.summary ? { summaryEn: en.summary } : {}),
    ...(r.source_url ? { sourceUrl: r.source_url } : {}),
    ...(r.source_label ? { sourceLabel: r.source_label } : {}),
  };
}

const keep = <T>(x: T | null): x is T => x !== null;

export function rowsToContent(rows: ContentRows): SiteContent {
  return {
    localities: rows.localities.map(toLocality).filter(keep),
    places: rows.places.map(toPlace).filter(keep),
    events: rows.events.map(toEvent).filter(keep),
    routes: rows.routes.map(toRoute).filter(keep),
  };
}

// ── Lectura ───────────────────────────────────────────────────────────────
async function fetchRows(cfg: SupabaseConfig): Promise<ContentRows> {
  const get = async <T>(query: string): Promise<T> => {
    const res = await fetch(`${cfg.url}/rest/v1/${query}`, {
      // Solo `apikey`: sirve tanto para la clave anon (JWT) como para la nueva
      // clave publicable (`sb_publishable_…`), que no es un JWT.
      headers: { apikey: cfg.key },
      next: { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["content"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status} en ${query}`);
    return (await res.json()) as T;
  };
  const [localities, places, events, routes] = await Promise.all([
    get<LocalityRow[]>(QUERIES.localities),
    get<PlaceRow[]>(QUERIES.places),
    get<EventRow[]>(QUERIES.events),
    get<RouteRow[]>(QUERIES.routes),
  ]);
  return { localities, places, events, routes };
}

export async function loadContent(
  cfg: SupabaseConfig | null = supabaseConfig(),
): Promise<SiteContent> {
  if (!cfg) return STATIC_CONTENT;
  try {
    const content = rowsToContent(await fetchRows(cfg));
    if (content.places.length === 0) {
      console.warn(
        "[contenido] La base no tiene lugares publicados: se usa el contenido del repo.",
      );
      return STATIC_CONTENT;
    }
    return content;
  } catch (error) {
    console.error(
      "[contenido] No se pudo leer Supabase: se usa el contenido del repo.",
      error,
    );
    return STATIC_CONTENT;
  }
}
