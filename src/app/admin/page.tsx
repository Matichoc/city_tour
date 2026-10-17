import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ENTITIES,
  getSession,
  isEntityKind,
  listBusinessPlaces,
  listEntities,
  listLocalities,
  publicPath,
  type EntityKind,
  type EntitySummary,
  type LocalitySummary,
} from "@/lib/admin/api";
import {
  formatDate,
  PublicationBadge,
  VerificationBadge,
} from "@/components/admin/badges";
import { freshness } from "@/lib/freshness";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  const { tipo } = await searchParams;
  const kind: EntityKind | "localidad" =
    tipo === "localidad"
      ? "localidad"
      : tipo && isEntityKind(tipo)
        ? tipo
        : "lugar";

  let rows: EntitySummary[] = [];
  let localities: LocalitySummary[] = [];
  let staleBusinesses = 0;
  try {
    const [entities, businesses] = await Promise.all([
      kind === "localidad"
        ? listLocalities(session.token).then((l) => {
            localities = l;
            return [];
          })
        : listEntities(session.token, kind),
      // El aviso es secundario: si falla, la lista de fichas igual se muestra.
      listBusinessPlaces(session.token).catch(() => []),
    ]);
    rows = entities;
    staleBusinesses = businesses.filter(
      (b) => freshness(b.infoUpdatedAt) !== "ok",
    ).length;
  } catch (error) {
    console.error("[admin] no se pudo listar", error);
    return <p className="text-coral-ink">{t("loadError")}</p>;
  }
  const count = (v: EntitySummary["verification"]) =>
    rows.filter((r) => r.verification === v).length;

  return (
    <>
      {staleBusinesses > 0 && (
        <p
          role="status"
          className="bg-sun/30 text-earth mb-4 flex flex-wrap items-center gap-2 rounded-xl p-3 text-sm"
        >
          {t("business.updates.pendingCount", { count: staleBusinesses })}
          <Link
            href="/admin/comercios#actualizacion"
            className="font-bold underline"
          >
            {t("business.updates.review")}
          </Link>
        </p>
      )}
      <nav className="flex flex-wrap gap-2" aria-label={t("title")}>
        {[...ENTITIES, "localidad" as const].map((k) => (
          <Link
            key={k}
            href={`/admin?tipo=${k}`}
            aria-current={k === kind ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              k === kind
                ? "bg-sea-deep text-white"
                : "bg-sea-soft text-sea-deep"
            }`}
          >
            {t(`tabs.${k}`)}
          </Link>
        ))}
      </nav>

      {kind === "localidad" ? (
        <LocalityTable rows={localities} t={t} />
      ) : (
        <>
          <p className="text-muted mt-4 text-sm">
            {t("summary", {
              total: rows.length,
              verified: count("verified"),
              pending: count("pending"),
              outdated: count("outdated"),
            })}
          </p>

          <div className="border-border bg-surface mt-4 overflow-x-auto rounded-2xl border">
            <table className="w-full text-left text-sm">
              <thead className="text-muted border-border border-b text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">{t("columns.name")}</th>
                  <th className="px-4 py-3">{t("columns.publication")}</th>
                  <th className="px-4 py-3">{t("columns.verification")}</th>
                  <th className="px-4 py-3">{t("columns.lastVerified")}</th>
                  <th className="px-4 py-3">{t("columns.site")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-border border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/${kind}/${r.id}`}
                        className="text-sea-deep font-semibold underline-offset-2 hover:underline"
                      >
                        {r.name}
                      </Link>
                      {r.demo && (
                        <span className="text-muted ml-2 text-xs">
                          ({t("demo")})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PublicationBadge status={r.publication} />
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge status={r.verification} />
                    </td>
                    <td className="text-muted px-4 py-3">
                      {formatDate(r.lastVerifiedAt) ?? t("never")}
                    </td>
                    <td className="px-4 py-3">
                      {r.publication === "published" ? (
                        <a
                          href={publicPath(kind, r.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sea-deep font-semibold whitespace-nowrap underline"
                        >
                          {t("viewOnSite")} ↗
                        </a>
                      ) : (
                        <span className="text-muted">{t("none")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function LocalityTable({
  rows,
  t,
}: {
  rows: LocalitySummary[];
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
}) {
  return (
    <>
      <p className="text-muted mt-4 text-sm">{t("localitiesHelp")}</p>
      <div className="border-border bg-surface mt-4 overflow-x-auto rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead className="text-muted border-border border-b text-xs uppercase">
            <tr>
              <th className="px-4 py-3">{t("columns.name")}</th>
              <th className="px-4 py-3">{t("columns.places")}</th>
              <th className="px-4 py-3">{t("columns.location")}</th>
              <th className="px-4 py-3">{t("columns.source")}</th>
              <th className="px-4 py-3">{t("columns.site")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-border border-b last:border-0">
                <td className="px-4 py-3 font-semibold">{r.name}</td>
                <td className="px-4 py-3">{r.placeCount}</td>
                <td className="text-muted px-4 py-3">
                  {r.hasLocation ? t("yes") : t("pending")}
                </td>
                <td className="px-4 py-3">
                  {r.source ? (
                    <a
                      href={r.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sea-deep underline"
                    >
                      {r.source.label}
                    </a>
                  ) : (
                    <span className="text-muted">{t("none")}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={publicPath("localidad", r.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sea-deep font-semibold whitespace-nowrap underline"
                  >
                    {t("viewOnSite")} ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
