import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { canModerate, getSession } from "@/lib/admin/api";
import { listLocalityOptions } from "@/lib/admin/places";
import { createPlaceAction } from "@/app/admin/places-actions";
import { PlaceForm } from "@/components/admin/place-form";

export default async function NewPlace({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({ locale: "es", namespace: "admin.places" });
  const { error } = await searchParams;
  const localities = await listLocalityOptions(session.token).catch(() => []);
  return (
    <div className="space-y-4">
      <Link
        href="/admin/comercios"
        className="text-sea-deep text-sm font-semibold"
      >
        {t("back")}
      </Link>
      <h1 className="font-display text-2xl font-extrabold">{t("newTitle")}</h1>
      <p className="text-muted text-sm">{t("newHelp")}</p>
      {error && (
        <p
          role="alert"
          className="bg-coral/10 text-coral-ink rounded-xl p-3 text-sm"
        >
          {t(`errors.${error}` as "errors.save")}
        </p>
      )}
      {canModerate(session) ? (
        <PlaceForm
          localities={localities}
          action={createPlaceAction}
          isAdmin={session.role === "admin"}
        />
      ) : (
        <p className="text-muted text-sm">{t("errors.save")}</p>
      )}
    </div>
  );
}
