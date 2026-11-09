import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  change,
  cleanSearchTerm,
  dailySeries,
  isBot,
  isEmpty,
  kpis,
  localeFromPath,
  localeShare,
  METRIC_EVENTS,
  parseMetricsBody,
  parsePeriod,
  placeTable,
  reportCsv,
  routeFunnel,
  subjectFromPath,
  toMetric,
  type MetricsReport,
} from "@/lib/metrics";
import { metricsBind } from "@/lib/review-gate";
import { navGroups } from "@/lib/admin/nav";
import es from "@/messages/es.json";

const emptyReport = (over: Partial<MetricsReport> = {}): MetricsReport => ({
  days: 7,
  today: "2026-11-09",
  totals: [],
  daily: [],
  top: [],
  details: [],
  locales: [],
  ...over,
});

describe("eventos de métricas", () => {
  it("la lista cerrada coincide con la de la base (migración 0034)", () => {
    const sql = readFileSync("supabase/migrations/0034_metrics.sql", "utf8");
    const table = /name text not null check \(name in \(([\s\S]*?)\)\)/.exec(
      sql,
    )![1]!;
    const names = [...table.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(names.sort()).toEqual([...METRIC_EVENTS].sort());
  });

  it("cada evento tiene su nombre en el panel", () => {
    for (const e of METRIC_EVENTS)
      expect(
        (es.admin.metrics.event as Record<string, string>)[e],
      ).toBeTruthy();
  });

  it("toma la ficha de las propiedades o de la página", () => {
    expect(toMetric("place_view", { slug: "playa-papudo" }, "/es")).toEqual({
      name: "place_view",
      subject: "playa-papudo",
      detail: "",
    });
    expect(
      toMetric(
        "share",
        { path: "/en/routes/ruta-costera", via: "whatsapp" },
        "/x",
      ),
    ).toEqual({ name: "share", subject: "ruta-costera", detail: "whatsapp" });
    expect(
      toMetric("qr_visit", { origen: "letrero-plaza" }, "/es/lugares/plaza"),
    ).toEqual({ name: "qr_visit", subject: "plaza", detail: "letrero-plaza" });
    expect(toMetric("cta_click", { slug: "x", kind: "whatsapp" }, "")).toEqual({
      name: "cta_click",
      subject: "x",
      detail: "whatsapp",
    });
  });

  it("ignora eventos fuera de la lista o con datos raros", () => {
    expect(toMetric("otro", {}, "/es")).toBeNull();
    expect(toMetric("place_view", { slug: "Con Espacios" }, "")).toBeNull();
    expect(
      toMetric("cta_click", { slug: "x", kind: "<script>" }, ""),
    ).toBeNull();
    expect(toMetric("search_empty", { term: "123 456" }, "")).toBeNull();
  });

  it("lo buscado nunca guarda números ni correos", () => {
    expect(cleanSearchTerm("  Cabañas con PISCINA ")).toBe(
      "cabañas con piscina",
    );
    expect(cleanSearchTerm("llamar +56 9 4258 6908")).toBe("llamar");
    expect(cleanSearchTerm("ana@correo.cl surf")).toBe("surf");
    expect(cleanSearchTerm("a")).toBe("");
    expect(cleanSearchTerm("x".repeat(90))).toHaveLength(40);
  });

  it("lee la ficha y el idioma desde la dirección", () => {
    expect(subjectFromPath("/es/lugares/caleta-papudo?origen=qr")).toBe(
      "caleta-papudo",
    );
    expect(subjectFromPath("/es/explorar")).toBe("");
    expect(localeFromPath("/pt/roteiros/x")).toBe("pt");
    expect(localeFromPath("/fr/x")).toBe("");
  });

  it("valida el envío del navegador", () => {
    expect(
      parseMetricsBody({
        locale: "es",
        events: [
          { name: "place_view", subject: "playa-papudo", detail: "" },
          { name: "search_empty", subject: "kayak 2", detail: "" },
        ],
      }),
    ).toEqual({
      locale: "es",
      events: [
        { name: "place_view", subject: "playa-papudo", detail: "" },
        { name: "search_empty", subject: "kayak", detail: "" },
      ],
    });
    expect(parseMetricsBody({ locale: "xx", events: [] })).toBeNull();
    expect(
      parseMetricsBody({
        events: Array.from({ length: 21 }, () => ({
          name: "share",
          subject: "",
          detail: "",
        })),
      }),
    ).toBeNull();
    expect(parseMetricsBody({ events: [{ name: "hack" }] })).toBeNull();
  });

  it("no cuenta robots ni navegadores sin identificación", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("WhatsApp/2.23")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(
      isBot(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      ),
    ).toBe(false);
  });

  it("resume el envío igual que la base (vector de tests/db/metrics.check.sql)", () => {
    expect(
      metricsBind(
        JSON.stringify([
          { name: "place_view", subject: "playa-papudo", detail: "" },
        ]),
      ),
    ).toBe("f96186cefedb3327e7f3801ecbbb7c7ea0ca0b0a5c5a02a5d7ea3ad2f089140b");
  });
});

describe("informe del panel", () => {
  const report = emptyReport({
    totals: [
      { name: "place_view", n: 120, prev: 100 },
      { name: "cta_click", n: 5, prev: 0 },
      { name: "contact_click", n: 3, prev: 0 },
      { name: "route_view", n: 40, prev: 10 },
      { name: "add_route", n: 8, prev: 2 },
      { name: "live_start", n: 2, prev: 0 },
    ],
    daily: [
      { day: "2026-11-09", name: "place_view", n: 7 },
      { day: "2026-11-09", name: "share", n: 2 },
      { day: "2026-11-05", name: "place_view", n: 4 },
    ],
    top: [
      { name: "place_view", subject: "playa-papudo", n: 80 },
      { name: "place_view", subject: "caleta", n: 40 },
      { name: "cta_click", subject: "caleta", n: 5 },
      { name: "contact_click", subject: "caleta", n: 3 },
      { name: "navigate_click", subject: "playa-papudo", n: 9 },
      { name: "route_view", subject: "ruta-costera", n: 40 },
    ],
    locales: [
      { locale: "es", n: 75 },
      { locale: "en", n: 25 },
      { locale: "", n: 3 },
    ],
  });

  it("acepta solo 7, 30 o 90 días", () => {
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod("90")).toBe(90);
    expect(parsePeriod("365")).toBe(30);
    expect(parsePeriod(undefined)).toBe(30);
  });

  it("compara con el período anterior solo si había datos", () => {
    expect(change(120, 100)).toBe(20);
    expect(change(50, 100)).toBe(-50);
    expect(change(5, 0)).toBeNull();
  });

  it("suma los indicadores y junta los dos tipos de contacto", () => {
    const k = Object.fromEntries(kpis(report).map((x) => [x.key, x]));
    expect(k.placeViews).toMatchObject({ n: 120, prev: 100, change: 20 });
    expect(k.contacts).toMatchObject({ n: 8, change: null });
    expect(k.addedToTrip!.n).toBe(8);
  });

  it("rellena con cero los días sin datos", () => {
    const s = dailySeries(report);
    expect(s).toHaveLength(7);
    expect(s[0]).toEqual({ day: "2026-11-03", n: 0 });
    expect(s.at(-1)).toEqual({ day: "2026-11-09", n: 9 });
    expect(s.find((d) => d.day === "2026-11-05")!.n).toBe(4);
  });

  it("ordena los lugares por todo lo que pasa en su ficha", () => {
    const rows = placeTable(report, (s) => s !== "ruta-costera");
    expect(rows.map((r) => r.slug)).toEqual(["playa-papudo", "caleta"]);
    expect(rows[1]!.cols).toMatchObject({ place_view: 40, contacts: 8 });
    expect(rows[0]!.total).toBe(89);
  });

  it("arma el embudo de rutas y el reparto por idioma", () => {
    expect(routeFunnel(report).map((f) => f.n)).toEqual([40, 8, 2]);
    expect(localeShare(report)).toEqual([
      { locale: "es", n: 75, pct: 75 },
      { locale: "en", n: 25, pct: 25 },
    ]);
  });

  it("sabe cuándo no hay nada que mostrar", () => {
    expect(isEmpty(emptyReport())).toBe(true);
    expect(isEmpty(report)).toBe(false);
  });

  it("exporta un CSV con nombres legibles", () => {
    expect(reportCsv(report, (n) => `«${n}»`).split("\n")[1]).toBe(
      "2026-11-09;«place_view»;7",
    );
  });

  it("el menú del panel incluye Métricas", () => {
    const hrefs = navGroups({ canEdit: false, superadmin: false }).flatMap(
      (g) => g.items.map((i) => i.href),
    );
    expect(hrefs).toContain("/admin/metricas");
  });
});
