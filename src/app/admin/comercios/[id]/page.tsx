import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { canModerate, getSession } from "@/lib/admin/api";
import { getPlaceForEdit, listLocalityOptions } from "@/lib/admin/places";
import {
  publishPlaceAction,
  updatePlaceAction,
} from "@/app/admin/places-actions";
import { PlaceForm } from "@/components/admin/place-form";
import { PhotoManager } from "@/components/admin/photo-manager";
import { HoursEditor } from "@/components/admin/hours-editor";
import { PublicationBadge } from "@/components/admin/badges";

export default async function EditPlace({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string; creado?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const t = await getTranslations({ locale: "es", namespace: "admin.places" });
  const sp = await searchParams;
  const [place, localities] = await Promise.all([
    getPlaceForEdit(session.token, id).catch(() => null),
    listLocalityOptions(session.token).catch(() => []),
  ]);
  if (!place) notFound();
  const editable = canModerate(session);
  const isAdmin = session.role === "admin";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/comercios"
        className="text-sea-deep text-sm font-semibold"
      >
        {t("back")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold">{place.name}</h1>
        <PublicationBadge status={place.publication} />
        {place.publication === "published" && (
          <a
            href={`/es/lugares/${place.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sea-deep text-sm font-semibold underline"
          >
            {t("publication.viewOnSite")} ↗
          </a>
        )}
        <Link
          href={`/admin/lugar/${place.id}`}
          className="text-sea-deep text-sm font-semibold underline"
        >
          Verificación
        </Link>
      </div>

      <nav
        aria-label={t("sections")}
        className="flex flex-wrap gap-2 text-sm font-semibold"
      >
        {(
          [
            ["datos", t("sectionData")],
            ["horarios", t("hours.title")],
            ["fotos", t("photos.title")],
          ] as const
        ).map(([anchor, label]) => (
          <a
            key={anchor}
            href={`#${anchor}`}
            className="bg-sea-soft text-sea-deep rounded-full px-4 py-1.5"
          >
            {label}
          </a>
        ))}
      </nav>

      {sp.creado && (
        <p
          role="status"
          className="bg-field-soft text-field-deep rounded-xl p-3 text-sm"
        >
          {t("created")}
        </p>
      )}
      {sp.guardado && (
        <p
          role="status"
          className="bg-field-soft text-field-deep rounded-xl p-3 text-sm"
        >
          {t("saved")}
        </p>
      )}
      {sp.error && (
        <p
          role="alert"
          className="bg-coral/10 text-coral-ink rounded-xl p-3 text-sm"
        >
          {t(`errors.${sp.error}` as "errors.save")}
        </p>
      )}

      <section className="border-border bg-surface rounded-2xl border p-4">
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <form action={publishPlaceAction}>
              <input type="hidden" name="id" value={place.id} />
              {place.publication === "published" ? (
                <button
                  name="accion"
                  value="borrador"
                  className="border-border rounded-full border px-4 py-1.5 text-sm font-semibold"
                >
                  {t("publication.unpublish")}
                </button>
              ) : (
                <button
                  name="accion"
                  value="publicar"
                  className="bg-sea-deep rounded-full px-4 py-1.5 text-sm font-bold text-white"
                >
                  {t("publication.publishNow")}
                </button>
              )}
            </form>
          ) : (
            <p className="text-muted text-sm">{t("publication.adminOnly")}</p>
          )}
        </div>
      </section>

      {editable && (
        <section
          id="datos"
          className="border-border bg-surface scroll-mt-4 rounded-2xl border p-4"
        >
          <h2 className="font-display mb-3 text-lg font-extrabold">
            {t("editTitle")}
          </h2>
          <PlaceForm
            place={place}
            localities={localities}
            action={updatePlaceAction}
            isAdmin={isAdmin}
          />
        </section>
      )}

      {editable && (
        <section
          id="horarios"
          className="border-border bg-surface scroll-mt-4 rounded-2xl border p-4"
        >
          <h2 className="font-display mb-3 text-lg font-extrabold">
            {t("hours.title")}
          </h2>
          <HoursEditor placeId={place.id} seasons={place.hours} />
        </section>
      )}

      <section
        id="fotos"
        className="border-border bg-surface scroll-mt-4 rounded-2xl border p-4"
      >
        <h2 className="font-display mb-3 text-lg font-extrabold">
          {t("photos.title")}
        </h2>
        {editable ? (
          <PhotoManager placeId={place.id} images={place.images} />
        ) : (
          <p className="text-muted text-sm">{t("photos.errors.denied")}</p>
        )}
      </section>
    </div>
  );
}
