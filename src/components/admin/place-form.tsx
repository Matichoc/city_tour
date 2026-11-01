import { getTranslations } from "next-intl/server";
import { CATEGORY_DEFS } from "@/content/catalog";
import { CTA_KINDS } from "@/lib/admin/api";
import {
  localityLabel,
  type LocalityOption,
  type PlaceForEdit,
} from "@/lib/admin/places";

export const field =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base";
const label = "block text-sm font-semibold";

/** Formulario de una ficha de comercio (crear o editar). */
export async function PlaceForm({
  place,
  localities,
  action,
  isAdmin,
}: {
  place?: PlaceForEdit;
  localities: LocalityOption[];
  action: (formData: FormData) => Promise<void>;
  isAdmin: boolean;
}) {
  const t = await getTranslations({ locale: "es", namespace: "admin.places" });
  const tc = await getTranslations({ locale: "es", namespace: "place.cta" });
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {place && <input type="hidden" name="id" value={place.id} />}
      <label className={`${label} sm:col-span-2`}>
        {t("form.name")}
        <input
          name="nombre"
          required
          minLength={3}
          maxLength={80}
          defaultValue={place?.name}
          className={field}
        />
      </label>
      <label className={label}>
        {t("form.category")}
        <select
          name="categoria"
          required
          defaultValue={place?.categorySlug ?? ""}
          className={field}
        >
          <option value="" disabled>
            —
          </option>
          {CATEGORY_DEFS.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.es}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        {t("form.locality")}
        <select
          name="localidad"
          defaultValue={place?.localitySlug ?? ""}
          className={field}
        >
          <option value="">{t("form.localityNone")}</option>
          {localities.map((l) => (
            <option key={l.slug} value={l.slug}>
              {localityLabel(l)}
            </option>
          ))}
        </select>
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("form.address")}
        <input
          name="direccion"
          maxLength={200}
          defaultValue={place?.address ?? ""}
          className={field}
        />
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("form.short")}
        <input
          name="frase"
          maxLength={200}
          defaultValue={place?.short ?? ""}
          className={field}
        />
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("form.description")}
        <textarea
          name="descripcion"
          rows={3}
          maxLength={1500}
          defaultValue={place?.description ?? ""}
          className={field}
        />
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("form.hours")}
        <textarea
          name="horario"
          rows={3}
          maxLength={600}
          defaultValue={place?.hoursText ?? ""}
          className={field}
        />
        <span className="text-muted text-xs font-normal">
          {t("form.hoursHelp")}
        </span>
      </label>
      <label className={label}>
        {t("form.button")}
        <select
          name="boton_tipo"
          defaultValue={place?.ctaKind ?? ""}
          className={field}
        >
          <option value="">{t("form.buttonNone")}</option>
          {CTA_KINDS.map((k) => (
            <option key={k} value={k}>
              {tc(k)}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        {t("form.buttonValue")}
        <input
          name="boton_valor"
          defaultValue={place?.ctaValue ?? ""}
          placeholder="+56 9 1234 5678 / https://…"
          className={field}
        />
      </label>
      <label className={label}>
        {t("form.instagram")}
        <input
          name="instagram"
          defaultValue={place?.instagram ?? ""}
          placeholder="@usuario"
          className={field}
        />
      </label>
      <label className={label}>
        {t("form.web")}
        <input
          name="web"
          defaultValue={place?.website ?? ""}
          placeholder="https://"
          className={field}
        />
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("form.maps")}
        <input
          name="maps"
          defaultValue={place?.mapsUrl ?? ""}
          placeholder="https://maps.app.goo.gl/…"
          className={field}
        />
      </label>
      <label className={label}>
        {t("form.sernaturNumber")}
        <input
          name="sernatur_numero"
          inputMode="numeric"
          pattern="[0-9]{1,10}"
          defaultValue={place?.sernaturNumber ?? ""}
          className={field}
        />
      </label>
      <label className={label}>
        {t("form.sernaturDate")}
        <input
          name="sernatur_vigencia"
          type="date"
          defaultValue={place?.sernaturValidUntil ?? ""}
          className={field}
        />
      </label>

      <fieldset className="border-border rounded-xl border p-3 sm:col-span-2">
        <legend className="px-1 text-sm font-bold">
          {t("form.contactTitle")}
        </legend>
        <p className="text-muted text-xs">{t("form.contactHelp")}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className={label}>
            {t("form.contactName")}
            <input
              name="contacto_nombre"
              maxLength={120}
              defaultValue={place?.contactName ?? ""}
              className={field}
            />
          </label>
          <label className={label}>
            {t("form.contactEmail")}
            <input
              name="contacto_correo"
              type="email"
              maxLength={200}
              defaultValue={place?.contactEmail ?? ""}
              className={field}
            />
          </label>
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="validada"
            defaultChecked={place?.ownerValidated ?? false}
            className="size-5"
          />
          {t("form.ownerValidated")}
        </label>
        <p className="text-muted mt-1 text-xs">
          {t("form.ownerValidatedHelp")}
        </p>
      </div>
      {!place && (
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="publicar"
              disabled={!isAdmin}
              className="size-5"
            />
            {t("form.publish")}
          </label>
          <p className="text-muted mt-1 text-xs">{t("form.draftNote")}</p>
        </div>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="bg-sea-deep rounded-full px-5 py-2 font-bold text-white"
        >
          {place ? t("form.save") : t("form.create")}
        </button>
      </div>
    </form>
  );
}
