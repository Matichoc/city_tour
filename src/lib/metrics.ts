import { z } from "zod";

/**
 * Métricas propias del sitio: conteos anónimos por día (sin cookies, sin IP y
 * sin identificar personas) que el panel muestra en /admin/metricas. La lista
 * de eventos es cerrada y debe coincidir con la de la migración 0034
 * (`metric_daily.name`). Este archivo es puro: lo usan el navegador, el
 * servidor y las pruebas.
 */
export const METRIC_EVENTS = [
  "place_view",
  "route_view",
  "event_view",
  "search_empty",
  "add_to_trip",
  "add_route",
  "navigate_click",
  "contact_click",
  "cta_click",
  "share",
  "qr_visit",
  "save_place",
  "live_start",
  "camera_start",
  "listen_play",
] as const;
export type MetricEvent = (typeof METRIC_EVENTS)[number];

export const METRIC_LOCALES = ["es", "en", "pt"] as const;

/** Un evento listo para enviar: qué pasó, sobre qué ficha y un detalle. */
export type Metric = { name: MetricEvent; subject: string; detail: string };

/** Eventos por envío (debe coincidir con `metric_batch` de la base). */
export const MAX_BATCH = 20;

const SLUG = /^[a-z0-9-]{0,80}$/;
const DETAIL = /^[a-z0-9-]{0,60}$/;

/**
 * Lo buscado sin resultados, limpio: minúsculas, sin números ni arrobas (nunca
 * un teléfono o un correo), solo letras y espacios, hasta 40 caracteres.
 * Devuelve "" si no queda nada útil.
 */
export function cleanSearchTerm(raw: string): string {
  const words = raw
    .toLowerCase()
    .normalize("NFC")
    .split(/\s+/)
    .filter((w) => w && !/[0-9@]/.test(w))
    .map((w) => w.replace(/[^\p{L}-]/gu, ""))
    .filter((w) => w.length > 0);
  const term = words.join(" ").slice(0, 40).trim();
  return term.length >= 2 ? term : "";
}

/** Slug de la página actual (`/es/lugares/caleta` → `caleta`), o "". */
export function subjectFromPath(path: string): string {
  const parts = path.split("?")[0]!.split("/").filter(Boolean);
  const last = parts.length === 3 ? decodeURIComponent(parts[2]!) : "";
  return SLUG.test(last) ? last : "";
}

/** Idioma de la página actual según su primer tramo, o "". */
export function localeFromPath(path: string): string {
  const first = path.split("/").filter(Boolean)[0] ?? "";
  return (METRIC_LOCALES as readonly string[]).includes(first) ? first : "";
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Convierte un evento del sitio (nombre y propiedades, como los que van a
 * Vercel) en un conteo. Devuelve null si no es un evento medido o si sus datos
 * no cumplen el formato.
 */
export function toMetric(
  name: string,
  props: Record<string, string | number> | undefined,
  path: string,
): Metric | null {
  if (!(METRIC_EVENTS as readonly string[]).includes(name)) return null;
  const p = props ?? {};
  let subject: string;
  if (name === "search_empty") subject = cleanSearchTerm(str(p.term));
  else subject = str(p.slug) || subjectFromPath(str(p.path) || path);
  const detail = (str(p.kind) || str(p.via) || str(p.origen)).toLowerCase();
  if (name === "search_empty" && !subject) return null;
  if (name !== "search_empty" && !SLUG.test(subject)) return null;
  if (!DETAIL.test(detail)) return null;
  return { name: name as MetricEvent, subject, detail };
}

/** Cuerpo que el navegador envía a /api/metricas. */
export const metricsBody = z.object({
  locale: z.enum(["", ...METRIC_LOCALES]).catch(""),
  events: z
    .array(
      z.object({
        name: z.enum(METRIC_EVENTS),
        subject: z.string().max(80),
        detail: z.string().regex(DETAIL),
      }),
    )
    .min(1)
    .max(MAX_BATCH),
});
export type MetricsBody = z.infer<typeof metricsBody>;

/**
 * Valida el cuerpo y deja solo eventos con el formato correcto (los mismos
 * filtros que aplica la base). Devuelve null si no hay nada que contar.
 */
export function parseMetricsBody(raw: unknown): MetricsBody | null {
  const parsed = metricsBody.safeParse(raw);
  if (!parsed.success) return null;
  const events = parsed.data.events
    .map((e) =>
      toMetric(
        e.name,
        { slug: e.subject, term: e.subject, kind: e.detail },
        "",
      ),
    )
    .filter((e): e is Metric => e !== null);
  return events.length ? { locale: parsed.data.locale, events } : null;
}

/** Navegadores automáticos (buscadores, vistas previas, pruebas): no cuentan. */
const BOT =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|node-fetch|axios|playwright|puppeteer/i;
export const isBot = (userAgent: string | null) =>
  !userAgent || BOT.test(userAgent);

// ── Informe del panel ──────────────────────────────────────────────────────

/** Lo que devuelve `metrics_report` (migración 0034). */
export type MetricsReport = {
  days: number;
  today: string;
  totals: { name: string; n: number; prev: number }[];
  daily: { day: string; name: string; n: number }[];
  top: { name: string; subject: string; n: number }[];
  details: { name: string; subject: string; detail: string; n: number }[];
  locales: { locale: string; n: number }[];
};

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
export const parsePeriod = (raw: string | undefined): Period =>
  (PERIODS as readonly number[]).includes(Number(raw))
    ? (Number(raw) as Period)
    : 30;

/** Indicadores de la cabecera: cada uno suma uno o más eventos. */
export const KPIS = [
  { key: "placeViews", events: ["place_view"] },
  { key: "directions", events: ["navigate_click"] },
  { key: "contacts", events: ["cta_click", "contact_click"] },
  { key: "addedToTrip", events: ["add_to_trip", "add_route"] },
  { key: "liveTrips", events: ["live_start"] },
  { key: "qrVisits", events: ["qr_visit"] },
] as const satisfies readonly {
  key: string;
  events: readonly MetricEvent[];
}[];
export type KpiKey = (typeof KPIS)[number]["key"];

/**
 * Cambio porcentual frente al período anterior, redondeado; null si antes no
 * había nada con qué comparar.
 */
export function change(n: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((n - prev) / prev) * 100);
}

export type Kpi = {
  key: KpiKey;
  n: number;
  prev: number;
  change: number | null;
};

export function kpis(report: MetricsReport): Kpi[] {
  return KPIS.map(({ key, events }) => {
    const rows = report.totals.filter((t) =>
      (events as readonly string[]).includes(t.name),
    );
    const n = rows.reduce((s, r) => s + Number(r.n), 0);
    const prev = rows.reduce((s, r) => s + Number(r.prev), 0);
    return { key, n, prev, change: change(n, prev) };
  });
}

/** Días del período (del más antiguo a hoy), con el total de interacciones. */
export function dailySeries(
  report: MetricsReport,
): { day: string; n: number }[] {
  const byDay = new Map<string, number>();
  for (const r of report.daily)
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + Number(r.n));
  const out: { day: string; n: number }[] = [];
  const today = new Date(`${report.today}T12:00:00Z`);
  for (let i = report.days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    out.push({ day, n: byDay.get(day) ?? 0 });
  }
  return out;
}

/** Columnas de la tabla de lugares (en orden). */
export const PLACE_COLUMNS = [
  "place_view",
  "navigate_click",
  "contacts",
  "add_to_trip",
  "save_place",
] as const;
export type PlaceColumn = (typeof PLACE_COLUMNS)[number];

/** Lugares con más interacciones, sumando todo lo que se hace en su ficha. */
export function placeTable(
  report: MetricsReport,
  isPlace: (slug: string) => boolean,
  limit = 10,
): { slug: string; total: number; cols: Record<PlaceColumn, number> }[] {
  const rows = new Map<string, Record<PlaceColumn, number>>();
  for (const t of report.top) {
    if (!isPlace(t.subject)) continue;
    const col: PlaceColumn | null =
      t.name === "cta_click" || t.name === "contact_click"
        ? "contacts"
        : (PLACE_COLUMNS as readonly string[]).includes(t.name)
          ? (t.name as PlaceColumn)
          : null;
    if (!col) continue;
    const r = rows.get(t.subject) ?? {
      place_view: 0,
      navigate_click: 0,
      contacts: 0,
      add_to_trip: 0,
      save_place: 0,
    };
    r[col] += Number(t.n);
    rows.set(t.subject, r);
  }
  return [...rows]
    .map(([slug, cols]) => ({
      slug,
      cols,
      total: Object.values(cols).reduce((s, n) => s + n, 0),
    }))
    .sort((a, b) => b.total - a.total || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}

/** Lo más contado de un evento (p. ej. rutas vistas o búsquedas sin resultado). */
export function topOf(
  report: MetricsReport,
  name: MetricEvent,
  limit = 10,
): { subject: string; n: number }[] {
  return report.top
    .filter((t) => t.name === name)
    .map((t) => ({ subject: t.subject, n: Number(t.n) }))
    .slice(0, limit);
}

/** Desglose de un evento por su detalle (origen del QR, tipo de botón...). */
export function detailsOf(
  report: MetricsReport,
  name: MetricEvent,
  limit = 10,
): { subject: string; detail: string; n: number }[] {
  return report.details
    .filter((d) => d.name === name)
    .map((d) => ({ subject: d.subject, detail: d.detail, n: Number(d.n) }))
    .slice(0, limit);
}

/** Embudo de rutas: vistas → agregadas al viaje → viajes en vivo. */
export function routeFunnel(report: MetricsReport) {
  const total = (name: MetricEvent) =>
    Number(report.totals.find((t) => t.name === name)?.n ?? 0);
  return [
    { key: "routeViews", n: total("route_view") },
    { key: "routeAdded", n: total("add_route") },
    { key: "liveTrips", n: total("live_start") },
  ] as const;
}

/** Reparto por idioma, en porcentaje entero (los sin idioma no cuentan). */
export function localeShare(
  report: MetricsReport,
): { locale: string; n: number; pct: number }[] {
  const rows = report.locales.filter((l) => l.locale);
  const sum = rows.reduce((s, l) => s + Number(l.n), 0);
  return rows.map((l) => ({
    locale: l.locale,
    n: Number(l.n),
    pct: sum ? Math.round((Number(l.n) / sum) * 100) : 0,
  }));
}

export const isEmpty = (report: MetricsReport) =>
  report.totals.every((t) => Number(t.n) === 0);

/** CSV del período: una fila por día y evento (para informes). */
export function reportCsv(
  report: MetricsReport,
  label: (name: string) => string,
): string {
  const lines = ["fecha;evento;cantidad"];
  for (const r of report.daily)
    lines.push(`${r.day};${label(r.name).replace(/;/g, ",")};${Number(r.n)}`);
  return `${lines.join("\n")}\n`;
}
