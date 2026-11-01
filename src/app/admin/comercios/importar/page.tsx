import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { canModerate, getSession } from "@/lib/admin/api";
import { CATEGORY_OPTIONS, getImportSheetUrl } from "@/lib/admin/places";
import { ImportPanel } from "@/components/admin/import-panel";

export default async function ImportPlaces() {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({ locale: "es", namespace: "admin.places" });
  const url = (await getImportSheetUrl(session.token)) ?? "";
  return (
    <div className="space-y-4">
      <Link
        href="/admin/comercios"
        className="text-sea-deep text-sm font-semibold"
      >
        {t("back")}
      </Link>
      <h1 className="font-display text-2xl font-extrabold">
        {t("import.title")}
      </h1>
      <p className="text-muted text-sm">{t("import.help")}</p>
      {canModerate(session) ? (
        <ImportPanel
          initialUrl={url}
          categories={CATEGORY_OPTIONS}
          isAdmin={session.role === "admin"}
        />
      ) : (
        <p className="text-muted text-sm">{t("import.errors.denied")}</p>
      )}
    </div>
  );
}
