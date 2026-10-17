import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ENTITIES,
  getSession,
  isEntityKind,
  listEntities,
  type EntityKind,
  type EntitySummary,
} from "@/lib/admin/api";
import {
  formatDate,
  PublicationBadge,
  VerificationBadge,
} from "@/components/admin/badges";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  const { tipo } = await searchParams;
  const kind: EntityKind = tipo && isEntityKind(tipo) ? tipo : "lugar";

  let rows: EntitySummary[];
  try {
    rows = await listEntities(session.token, kind);
  } catch (error) {
    console.error("[admin] no se pudo listar", error);
    return <p className="text-coral-ink">{t("loadError")}</p>;
  }
  const count = (v: EntitySummary["verification"]) =>
    rows.filter((r) => r.verification === v).length;

  return (
    <>
      <nav className="flex gap-2" aria-label={t("title")}>
        {ENTITIES.map((k) => (
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
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-border border-b last:border-0">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
