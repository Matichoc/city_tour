import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  canModerate,
  CTA_KINDS,
  getSession,
  getSettingsAdmin,
  listBusinessPlaces,
  listEntities,
  listNoticesAdmin,
} from "@/lib/admin/api";
import { formatDate } from "@/components/admin/badges";
import {
  addNotice,
  changeNotice,
  markUpdated,
  saveCta,
  saveSettings,
} from "@/app/admin/actions";
import { ctaHref } from "@/lib/data";
import { byUrgency, freshness, infoDueDate } from "@/lib/freshness";
import { localizedUrl } from "@/lib/seo";

const field =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base";
const section = "border-border bg-surface rounded-2xl border p-4";
const primary = "bg-sea-deep rounded-full px-5 py-2 font-bold text-white";
const small =
  "border-border rounded-full border px-3 py-1 text-sm font-semibold";

const STATE_CLASS = {
  never: "bg-coral/10 text-coral-ink",
  overdue: "bg-coral/10 text-coral-ink",
  soon: "bg-sun/30 text-earth",
  ok: "bg-field-soft text-field-deep",
} as const;

/** Fecha mínima del formulario de avisos: mañana, en hora de Chile. */
const tomorrow = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(
    Date.now() + 24 * 3600 * 1000,
  );

export default async function BusinessAdmin({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({
    locale: "es",
    namespace: "admin.business",
  });
  const ta = await getTranslations({ locale: "es", namespace: "admin" });
  const tc = await getTranslations({ locale: "es", namespace: "place.cta" });
  const sp = await searchParams;

  let data;
  try {
    const [places, allPlaces, notices, settings] = await Promise.all([
      listBusinessPlaces(session.token),
      listEntities(session.token, "lugar"),
      listNoticesAdmin(session.token),
      getSettingsAdmin(session.token),
    ]);
    data = { places, allPlaces, notices, settings };
  } catch (error) {
    console.error("[admin] comercios: no se pudo leer", error);
    return <p className="text-coral-ink">{ta("loadError")}</p>;
  }
  const editable = canModerate(session);
  const updates = data.places
    .map((p) => ({ ...p, state: freshness(p.infoUpdatedAt) }))
    .sort((a, b) => byUrgency(a.state, b.state));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1 text-sm">{t("intro")}</p>
      </div>

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
          {t("error")}
        </p>
      )}

      <section id="actualizacion" className={section}>
        <h2 className="font-display text-lg font-extrabold">
          {t("updates.title")}
        </h2>
        <p className="text-muted mt-1 text-sm">{t("updates.help")}</p>
        {updates.length === 0 ? (
          <p className="text-muted mt-3 text-sm">{t("cta.none")}</p>
        ) : (
          <ul className="divide-border mt-3 divide-y">
            {updates.map((p) => {
              const message = t("updates.template", {
                name: p.name,
                url: localizedUrl("es", {
                  pathname: "/lugares/[slug]",
                  params: { slug: p.slug },
                }),
              });
              const wa =
                p.ctaKind === "whatsapp" && p.ctaValue
                  ? ctaHref({ kind: "whatsapp", value: p.ctaValue })
                  : null;
              return (
                <li key={p.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <b>{p.name}</b>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATE_CLASS[p.state]}`}
                    >
                      {t(`updates.state.${p.state}`)}
                    </span>
                    {p.infoUpdatedAt && (
                      <span className="text-muted text-xs">
                        {t("updates.last", {
                          date: formatDate(p.infoUpdatedAt) ?? "",
                        })}{" "}
                        ·{" "}
                        {t("updates.due", {
                          date:
                            formatDate(
                              infoDueDate(p.infoUpdatedAt).toISOString(),
                            ) ?? "",
                        })}
                      </span>
                    )}
                  </div>
                  {p.state !== "ok" && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-semibold">
                        {t("updates.message")}
                      </summary>
                      <textarea
                        readOnly
                        rows={4}
                        defaultValue={message}
                        aria-label={t("updates.message")}
                        className={field}
                      />
                      {wa ? (
                        <a
                          href={`${wa}?text=${encodeURIComponent(message)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${small} mt-2 inline-block`}
                        >
                          {t("updates.whatsapp")}
                        </a>
                      ) : (
                        <p className="text-muted mt-1 text-xs">
                          {t("updates.copyHint")}
                        </p>
                      )}
                    </details>
                  )}
                  {editable && (
                    <form action={markUpdated} className="mt-2">
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className={small}>
                        {t("updates.mark")}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="botones" className={section}>
        <h2 className="font-display text-lg font-extrabold">
          {t("cta.title")}
        </h2>
        <p className="text-muted mt-1 text-sm">{t("cta.help")}</p>
        {data.places.length === 0 ? (
          <p className="text-muted mt-3 text-sm">{t("cta.none")}</p>
        ) : (
          <ul className="divide-border mt-3 divide-y">
            {data.places.map((p) => (
              <li key={p.id} className="py-3">
                <p className="font-semibold">{p.name}</p>
                <form
                  action={saveCta}
                  className="mt-2 flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <label className="text-sm font-semibold">
                    {t("cta.kind")}
                    <select
                      name="tipo"
                      defaultValue={p.ctaKind ?? ""}
                      className={field}
                      disabled={!editable}
                    >
                      <option value="">{t("cta.noButton")}</option>
                      {CTA_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {tc(k)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="min-w-56 flex-1 text-sm font-semibold">
                    {t("cta.value")}
                    <input
                      name="valor"
                      defaultValue={p.ctaValue ?? ""}
                      placeholder={t("cta.placeholder")}
                      className={field}
                      disabled={!editable}
                    />
                  </label>
                  {editable && (
                    <button type="submit" className={primary}>
                      {t("save")}
                    </button>
                  )}
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="avisos" className={section}>
        <h2 className="font-display text-lg font-extrabold">
          {t("notices.title")}
        </h2>
        <p className="text-muted mt-1 text-sm">{t("notices.help")}</p>
        {editable && (
          <form action={addNotice} className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              {t("notices.place")}
              <select name="lugar" defaultValue="" className={field}>
                <option value="">{t("notices.general")}</option>
                {data.allPlaces
                  .filter((p) => !p.demo)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              {t("notices.until")}
              <input
                name="hasta"
                type="date"
                required
                min={tomorrow()}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              {t("notices.titleField")}
              <input
                name="titulo"
                required
                minLength={3}
                maxLength={80}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              {t("notices.text")}
              <textarea
                name="texto"
                rows={2}
                maxLength={280}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              {t("notices.link")}
              <input
                name="enlace"
                type="url"
                placeholder="https://"
                className={field}
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className={primary}>
                {t("notices.add")}
              </button>
            </div>
          </form>
        )}
        {data.notices.length === 0 ? (
          <p className="text-muted mt-4 text-sm">{t("notices.none")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.notices.map((n) => {
              const expired = n.expired;
              const state = expired
                ? "expired"
                : n.active
                  ? "active"
                  : "paused";
              return (
                <li key={n.id} className="border-border rounded-xl border p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <b>{n.title}</b>
                    <span className="bg-sea-soft text-sea-deep rounded-full px-2 py-0.5 text-xs font-bold">
                      {t(`notices.state.${state}`)}
                    </span>
                    <span className="text-muted text-xs">
                      {n.placeName ?? t("notices.general")} ·{" "}
                      {t("notices.ends", { date: formatDate(n.endsAt) ?? "" })}
                    </span>
                  </div>
                  {n.body && <p className="mt-1 text-sm">{n.body}</p>}
                  {editable && (
                    <form
                      action={changeNotice}
                      className="mt-2 flex flex-wrap gap-2"
                    >
                      <input type="hidden" name="id" value={n.id} />
                      {!n.expired &&
                        (n.active ? (
                          <button
                            name="accion"
                            value="pausar"
                            className={small}
                          >
                            {t("notices.pause")}
                          </button>
                        ) : (
                          <button
                            name="accion"
                            value="activar"
                            className={small}
                          >
                            {t("notices.activate")}
                          </button>
                        ))}
                      <button
                        name="accion"
                        value="borrar"
                        className={`${small} text-coral-ink`}
                      >
                        {t("notices.delete")}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="invitacion" className={section}>
        <h2 className="font-display text-lg font-extrabold">
          {t("invite.title")}
        </h2>
        <p className="text-muted mt-1 text-sm">{t("invite.help")}</p>
        <form action={saveSettings} className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="invitacion"
              defaultChecked={data.settings.businessInvite}
              disabled={session.role !== "admin"}
              className="size-5"
            />
            {t("invite.show")}
          </label>
          <label className="block text-sm font-semibold">
            {t("invite.form")}
            <input
              name="formulario"
              type="url"
              placeholder="https://forms.gle/…"
              defaultValue={data.settings.businessFormUrl ?? ""}
              disabled={session.role !== "admin"}
              className={field}
            />
          </label>
          {session.role === "admin" ? (
            <button type="submit" className={primary}>
              {t("save")}
            </button>
          ) : (
            <p className="text-muted text-sm">{t("invite.adminOnly")}</p>
          )}
        </form>
      </section>
    </div>
  );
}
