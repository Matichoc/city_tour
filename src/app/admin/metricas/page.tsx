import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession, publicPath } from "@/lib/admin/api";
import { metricsReport } from "@/lib/admin/metrics";
import { getData } from "@/lib/data";
import {
  dailySeries,
  detailsOf,
  isEmpty,
  kpis,
  localeShare,
  parsePeriod,
  PERIODS,
  PLACE_COLUMNS,
  placeTable,
  routeFunnel,
  topOf,
  type MetricsReport,
} from "@/lib/metrics";
import { DailyBars } from "@/components/admin/daily-bars";

/** Métricas de uso de la guía: conteos anónimos por día (migración 0034). */
export default async function MetricsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({ locale: "es", namespace: "admin.metrics" });
  const days = parsePeriod((await searchParams).dias);

  let report: MetricsReport;
  try {
    report = await metricsReport(session.token, days);
  } catch (error) {
    console.error("[admin] no se pudieron leer las métricas", error);
    return (
      <>
        <h1 className="font-display text-sea-deep text-3xl font-extrabold">
          {t("title")}
        </h1>
        <p className="text-coral-ink mt-3">{t("loadError")}</p>
      </>
    );
  }

  const data = await getData();
  const placeName = (slug: string) => data.getPlace(slug, "es")?.name;
  const routeName = (slug: string) => data.getRoute(slug, "es")?.name;
  const eventName = (slug: string) => data.getEvent(slug, "es")?.name;
  const anyName = (slug: string) =>
    placeName(slug) ?? routeName(slug) ?? eventName(slug) ?? slug;
  const num = (n: number) => n.toLocaleString("es-CL");

  const empty = isEmpty(report);
  const series = dailySeries(report);
  const places = placeTable(report, (s) => Boolean(placeName(s)));
  const funnel = routeFunnel(report);
  const routes = topOf(report, "route_view", 5);
  const events = topOf(report, "event_view", 5);
  const qr = detailsOf(report, "qr_visit", 10);
  const searches = topOf(report, "search_empty", 10);
  const locales = localeShare(report);

  const card = "border-border bg-surface rounded-2xl border p-4";
  const h2 = "font-display text-sea-deep text-xl font-extrabold";
  const th = "py-2 pr-3 text-left font-bold";
  const td = "py-2 pr-3";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="font-display text-sea-deep text-3xl font-extrabold">
            {t("title")}
          </h1>
          <p className="text-muted mt-1">{t("intro")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label={t("periodLabel")} className="flex gap-2">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/admin/metricas?dias=${p}`}
                aria-current={p === days ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold ${
                  p === days ? "bg-sea-deep text-white" : "border-border border"
                }`}
              >
                {t("period", { days: p })}
              </Link>
            ))}
          </nav>
          {empty ? null : (
            <a
              href={`/admin/metricas/csv?dias=${days}`}
              className="text-sea inline-flex min-h-11 items-center px-3 text-sm font-bold underline"
            >
              {t("csv")}
            </a>
          )}
        </div>
      </header>

      {empty ? (
        <p
          role="status"
          className="bg-sea-soft text-sea-deep rounded-2xl p-4 font-semibold"
        >
          {t("empty")}
        </p>
      ) : null}

      <section aria-labelledby="m-resumen">
        <h2 id="m-resumen" className={h2}>
          {t("summaryTitle")}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {kpis(report).map((k) => (
            <li key={k.key} className={card}>
              <p className="text-muted text-sm font-semibold">
                {t(`kpi.${k.key}`)}
              </p>
              <p className="font-display text-sea-deep mt-1 text-3xl font-extrabold">
                {num(k.n)}
              </p>
              <p className="text-muted mt-1 text-sm">
                {k.change === null
                  ? t("noPrevious")
                  : t("vsPrevious", {
                      sign: k.change > 0 ? "+" : k.change < 0 ? "−" : "",
                      pct: Math.abs(k.change),
                    })}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="m-dias" className={card}>
        <h2 id="m-dias" className={h2}>
          {t("dailyTitle")}
        </h2>
        <p className="text-muted mt-1 text-sm">{t("dailyHelp")}</p>
        <DailyBars
          series={series}
          label={t("dailyTitle")}
          unit={t("interactions")}
        />
      </section>

      <section aria-labelledby="m-lugares">
        <h2 id="m-lugares" className={h2}>
          {t("placesTitle")}
        </h2>
        {places.length === 0 ? (
          <p className="text-muted mt-2">{t("noData")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="border-border border-b">
                <tr>
                  <th className={th}>{t("place")}</th>
                  {PLACE_COLUMNS.map((c) => (
                    <th key={c} className={`${th} text-right`}>
                      {t(`col.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {places.map((p) => (
                  <tr key={p.slug} className="border-border border-b">
                    <td className={td}>
                      <a
                        href={publicPath("lugar", p.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sea font-semibold underline"
                      >
                        {placeName(p.slug)}
                      </a>
                    </td>
                    {PLACE_COLUMNS.map((c) => (
                      <td key={c} className={`${td} text-right tabular-nums`}>
                        {num(p.cols[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="m-rutas" className={card}>
          <h2 id="m-rutas" className={h2}>
            {t("routesTitle")}
          </h2>
          <ol className="mt-3 flex flex-col gap-2">
            {funnel.map((f, i) => (
              <li key={f.key} className="flex items-baseline gap-2">
                <span className="text-muted w-5 text-sm font-bold">
                  {i + 1}.
                </span>
                <span className="flex-1">{t(`funnel.${f.key}`)}</span>
                <span className="font-extrabold tabular-nums">{num(f.n)}</span>
              </li>
            ))}
          </ol>
          <h3 className="mt-4 font-bold">{t("topRoutes")}</h3>
          <RankList
            rows={routes.map((r) => ({
              key: r.subject,
              label: routeName(r.subject) ?? r.subject,
              n: r.n,
            }))}
            empty={t("noData")}
            num={num}
          />
        </section>

        <section aria-labelledby="m-eventos" className={card}>
          <h2 id="m-eventos" className={h2}>
            {t("eventsTitle")}
          </h2>
          <RankList
            rows={events.map((e) => ({
              key: e.subject,
              label: eventName(e.subject) ?? e.subject,
              n: e.n,
            }))}
            empty={t("noData")}
            num={num}
          />
        </section>

        <section aria-labelledby="m-qr" className={card}>
          <h2 id="m-qr" className={h2}>
            {t("qrTitle")}
          </h2>
          <p className="text-muted mt-1 text-sm">{t("qrHelp")}</p>
          <RankList
            rows={qr.map((q) => ({
              key: `${q.detail}|${q.subject}`,
              label: q.subject
                ? t("qrRow", { origin: q.detail, page: anyName(q.subject) })
                : q.detail,
              n: q.n,
            }))}
            empty={t("noData")}
            num={num}
          />
        </section>

        <section aria-labelledby="m-busquedas" className={card}>
          <h2 id="m-busquedas" className={h2}>
            {t("searchTitle")}
          </h2>
          <p className="text-muted mt-1 text-sm">{t("searchHelp")}</p>
          <RankList
            rows={searches.map((s) => ({
              key: s.subject,
              label: `«${s.subject}»`,
              n: s.n,
            }))}
            empty={t("noData")}
            num={num}
          />
        </section>

        <section aria-labelledby="m-idiomas" className={card}>
          <h2 id="m-idiomas" className={h2}>
            {t("localesTitle")}
          </h2>
          <RankList
            rows={locales.map((l) => ({
              key: l.locale,
              label: t("localeRow", {
                locale: t(`locale.${l.locale}`),
                pct: l.pct,
              }),
              n: l.n,
            }))}
            empty={t("noData")}
            num={num}
          />
        </section>
      </div>

      <p className="text-muted text-sm">{t("privacy")}</p>
    </div>
  );
}

function RankList({
  rows,
  empty,
  num,
}: {
  rows: { key: string; label: string; n: number }[];
  empty: string;
  num: (n: number) => string;
}) {
  if (rows.length === 0) return <p className="text-muted mt-2">{empty}</p>;
  return (
    <ol className="mt-2 flex flex-col">
      {rows.map((r) => (
        <li
          key={r.key}
          className="border-border flex items-baseline justify-between gap-3 border-b py-2 last:border-0"
        >
          <span className="min-w-0 break-words">{r.label}</span>
          <span className="font-extrabold tabular-nums">{num(r.n)}</span>
        </li>
      ))}
    </ol>
  );
}
