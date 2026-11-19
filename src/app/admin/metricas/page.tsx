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
import { RankBars } from "@/components/admin/rank-bars";
import { PngButton } from "@/components/admin/png-button";

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
  /** Nombre base de las imágenes descargadas. */
  const file = `metricas-papudo-${report.today}-${days}d`;

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
            <>
              <a
                href={`/admin/metricas/excel?dias=${days}`}
                className="bg-sea-deep inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-white"
              >
                {t("excel")}
              </a>
              <a
                href={`/admin/metricas/csv?dias=${days}`}
                className="text-sea inline-flex min-h-11 items-center px-3 text-sm font-bold underline"
              >
                {t("csv")}
              </a>
            </>
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

      <section id="g-dias" aria-labelledby="m-dias" className={card}>
        <ChartHead
          id="m-dias"
          title={t("dailyTitle")}
          target="g-dias"
          file={`${file}-por-dia.png`}
          png={t("png")}
          className={h2}
        />
        <p className="text-muted mt-1 text-sm">{t("dailyHelp")}</p>
        <DailyBars
          series={series}
          label={t("dailyTitle")}
          unit={t("interactions")}
        />
      </section>

      <section id="g-lugares" aria-labelledby="m-lugares">
        <ChartHead
          id="m-lugares"
          title={t("placesTitle")}
          target="g-lugares"
          file={`${file}-lugares.png`}
          png={t("png")}
          className={h2}
          hidePng={places.length === 0}
        />
        {places.length === 0 ? (
          <p className="text-muted mt-2">{t("noData")}</p>
        ) : (
          <RankBars
            rows={places.map((p) => ({
              key: p.slug,
              label: placeName(p.slug) ?? p.slug,
              n: p.total,
            }))}
            label={t("placesTitle")}
            empty={t("noData")}
          />
        )}
        {places.length === 0 ? null : (
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
        <section id="g-rutas" aria-labelledby="m-rutas" className={card}>
          <ChartHead
            id="m-rutas"
            title={t("routesTitle")}
            target="g-rutas"
            file={`${file}-rutas.png`}
            png={t("png")}
            className={h2}
          />
          <RankBars
            rows={funnel.map((f) => ({
              key: f.key,
              label: t(`funnel.${f.key}`),
              n: f.n,
            }))}
            label={t("routesTitle")}
            empty={t("noData")}
            compact
          />
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

        <ChartCard
          id="eventos"
          title={t("eventsTitle")}
          file={`${file}-eventos.png`}
          png={t("png")}
          h2={h2}
          card={card}
          empty={t("noData")}
          rows={events.map((e) => ({
            key: e.subject,
            label: eventName(e.subject) ?? e.subject,
            n: e.n,
          }))}
        />

        <ChartCard
          id="qr"
          title={t("qrTitle")}
          help={t("qrHelp")}
          file={`${file}-qr.png`}
          png={t("png")}
          h2={h2}
          card={card}
          empty={t("noData")}
          rows={qr.map((q) => ({
            key: `${q.detail}|${q.subject}`,
            label: q.subject
              ? t("qrRow", { origin: q.detail, page: anyName(q.subject) })
              : q.detail,
            n: q.n,
          }))}
        />

        <ChartCard
          id="busquedas"
          title={t("searchTitle")}
          help={t("searchHelp")}
          file={`${file}-busquedas.png`}
          png={t("png")}
          h2={h2}
          card={card}
          empty={t("noData")}
          rows={searches.map((s) => ({
            key: s.subject,
            label: `«${s.subject}»`,
            n: s.n,
          }))}
        />

        <ChartCard
          id="idiomas"
          title={t("localesTitle")}
          file={`${file}-idiomas.png`}
          png={t("png")}
          h2={h2}
          card={card}
          empty={t("noData")}
          rows={locales.map((l) => ({
            key: l.locale,
            label: t("localeRow", {
              locale: t(`locale.${l.locale}`),
              pct: l.pct,
            }),
            n: l.n,
          }))}
        />
      </div>

      <p className="text-muted text-sm">{t("privacy")}</p>
    </div>
  );
}

/** Título de un gráfico con su botón «Descargar imagen». */
function ChartHead({
  id,
  title,
  target,
  file,
  png,
  className,
  hidePng = false,
}: {
  id: string;
  title: string;
  target: string;
  file: string;
  png: string;
  className: string;
  hidePng?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
      <h2 id={id} className={className}>
        {title}
      </h2>
      {hidePng ? null : (
        <PngButton target={target} title={title} filename={file} label={png} />
      )}
    </div>
  );
}

/** Tarjeta con un ranking en barras y su descarga como imagen. */
function ChartCard({
  id,
  title,
  help,
  file,
  png,
  h2,
  card,
  empty,
  rows,
}: {
  id: string;
  title: string;
  help?: string;
  file: string;
  png: string;
  h2: string;
  card: string;
  empty: string;
  rows: { key: string; label: string; n: number }[];
}) {
  return (
    <section id={`g-${id}`} aria-labelledby={`m-${id}`} className={card}>
      <ChartHead
        id={`m-${id}`}
        title={title}
        target={`g-${id}`}
        file={file}
        png={png}
        className={h2}
        hidePng={rows.length === 0}
      />
      {help ? <p className="text-muted mt-1 text-sm">{help}</p> : null}
      <RankBars rows={rows} label={title} empty={empty} compact />
    </section>
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
