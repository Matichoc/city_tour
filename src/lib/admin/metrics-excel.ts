/**
 * Libro Excel de Métricas: una hoja por tema, con los mismos cálculos que la
 * página (src/lib/metrics.ts). Los nombres de lugares, rutas y eventos se
 * resuelven afuera, igual que en la página.
 */
import {
  PLACE_COLUMNS,
  dailySeries,
  detailsOf,
  kpis,
  localeShare,
  placeTable,
  routeFunnel,
  topOf,
  type MetricsReport,
} from "@/lib/metrics";
import type { Sheet } from "@/lib/xlsx";

export type MetricsNames = {
  place: (slug: string) => string | undefined;
  route: (slug: string) => string | undefined;
  event: (slug: string) => string | undefined;
  any: (slug: string) => string;
};

/** Textos de la planilla (admin.metrics en los mensajes). */
export type MetricsExcelText = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function metricsSheets(
  report: MetricsReport,
  names: MetricsNames,
  t: MetricsExcelText,
  eventLabel: (name: string) => string,
): Sheet[] {
  const x = (k: string) => t(`xlsx.${k}`);
  const period = t("period", { days: report.days });

  const summary: Sheet = {
    name: t("summaryTitle"),
    widths: [34, 14, 18, 12],
    rows: [
      [x("indicator"), period, x("previous"), `${x("change")} (%)`],
      // El cambio ya viene en porcentaje entero (null si antes no había nada).
      ...kpis(report).map((k) => [t(`kpi.${k.key}`), k.n, k.prev, k.change]),
      [],
      [x("periodEnds"), report.today],
    ],
  };

  const daily: Sheet = {
    name: t("dailyTitle"),
    widths: [14, 16],
    rows: [
      [x("date"), x("interactions")],
      ...dailySeries(report).map((d) => [d.day, d.n]),
    ],
  };

  const detail: Sheet = {
    name: x("detailSheet"),
    widths: [14, 34, 12],
    rows: [
      [x("date"), x("event"), x("count")],
      ...report.daily.map((r) => [r.day, eventLabel(r.name), Number(r.n)]),
    ],
  };

  const places: Sheet = {
    name: x("placesSheet"),
    widths: [36, 10, 14, 12, 10, 12, 10],
    rows: [
      [t("place"), ...PLACE_COLUMNS.map((c) => t(`col.${c}`)), x("total")],
      ...placeTable(report, (s) => Boolean(names.place(s)), 500).map((p) => [
        names.place(p.slug) ?? p.slug,
        ...PLACE_COLUMNS.map((c) => p.cols[c]),
        p.total,
      ]),
    ],
  };

  const routes: Sheet = {
    name: t("routesTitle"),
    widths: [36, 12],
    rows: [
      [x("step"), x("count")],
      ...routeFunnel(report).map((f) => [t(`funnel.${f.key}`), f.n]),
      [],
      [t("topRoutes"), x("views")],
      ...topOf(report, "route_view", 100).map((r) => [
        names.route(r.subject) ?? r.subject,
        r.n,
      ]),
    ],
  };

  const events: Sheet = {
    name: x("eventsSheet"),
    widths: [40, 12],
    rows: [
      [x("event"), x("views")],
      ...topOf(report, "event_view", 100).map((e) => [
        names.event(e.subject) ?? e.subject,
        e.n,
      ]),
    ],
  };

  const qr: Sheet = {
    name: t("qrTitle"),
    widths: [30, 36, 10],
    rows: [
      [x("origin"), x("page"), x("visits")],
      ...detailsOf(report, "qr_visit", 200).map((q) => [
        q.detail,
        q.subject ? names.any(q.subject) : null,
        q.n,
      ]),
    ],
  };

  const searches: Sheet = {
    name: x("searchSheet"),
    widths: [36, 10],
    rows: [
      [x("search"), x("times")],
      ...topOf(report, "search_empty", 200).map((s) => [s.subject, s.n]),
    ],
  };

  const locales: Sheet = {
    name: t("localesTitle"),
    widths: [16, 16, 10],
    rows: [
      [x("language"), x("interactions"), "%"],
      ...localeShare(report).map((l) => [t(`locale.${l.locale}`), l.n, l.pct]),
    ],
  };

  return [
    summary,
    daily,
    places,
    routes,
    events,
    qr,
    searches,
    locales,
    detail,
  ];
}
