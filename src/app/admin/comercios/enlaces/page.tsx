import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { canModerate, getSession, listBusinessPlaces } from "@/lib/admin/api";
import { getOwnerKeyStatus } from "@/lib/admin/owner";
import {
  BulkOwnerLinks,
  type BulkRow,
} from "@/components/admin/bulk-owner-links";

/** Enlaces de locatarios en lote (por ejemplo, después de la carga masiva). */
export default async function BulkLinksPage() {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({
    locale: "es",
    namespace: "admin.bulkLinks",
  });
  const places = canModerate(session)
    ? await listBusinessPlaces(session.token).catch(() => [])
    : [];
  const status = await Promise.all(
    places.map((p) => getOwnerKeyStatus(session, p.id)),
  );
  const rows: BulkRow[] = places.map((p, i) => ({
    id: p.id,
    name: p.name,
    whatsapp: p.ctaKind === "whatsapp" ? p.ctaValue : null,
    active: Boolean(status[i]),
    lastUsedAt: status[i]?.lastUsedAt ?? null,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/comercios"
        className="text-sea-deep text-sm font-semibold"
      >
        {t("back")}
      </Link>
      <div>
        <h1 className="font-display text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1 text-sm">{t("intro")}</p>
      </div>
      {!canModerate(session) ? (
        <p className="text-muted text-sm">{t("denied")}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted text-sm">{t("empty")}</p>
      ) : (
        <BulkOwnerLinks rows={rows} />
      )}
    </div>
  );
}
