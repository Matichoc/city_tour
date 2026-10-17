import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  canVerify,
  getEntity,
  getSession,
  isEntityKind,
  publicPath,
  VERIFICATION_STATES,
  type EntityDetail,
} from "@/lib/admin/api";
import {
  formatDate,
  PublicationBadge,
  VerificationBadge,
} from "@/components/admin/badges";
import { verify } from "@/app/admin/actions";

const field =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base";

export default async function EntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string; id: string }>;
  searchParams: Promise<{ guardado?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const { tipo, id } = await params;
  if (!isEntityKind(tipo) || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  const { guardado, error } = await searchParams;

  let entity: EntityDetail | null;
  try {
    entity = await getEntity(session.token, tipo, id);
  } catch (e) {
    console.error("[admin] no se pudo leer la ficha", e);
    return <p className="text-coral-ink">{t("loadError")}</p>;
  }
  if (!entity) notFound();

  return (
    <>
      <Link
        href={`/admin?tipo=${tipo}`}
        className="text-sea-deep text-sm font-semibold"
      >
        ← {t("back")}
      </Link>

      <h1 className="font-display mt-3 text-2xl font-extrabold">
        {entity.name}
        {entity.demo && (
          <span className="text-muted ml-2 text-base font-semibold">
            ({t("demo")})
          </span>
        )}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PublicationBadge status={entity.publication} />
        <VerificationBadge status={entity.verification} />
        <span className="text-muted text-sm">
          {t("columns.lastVerified")}:{" "}
          {formatDate(entity.lastVerifiedAt) ?? t("never")}
        </span>
      </div>

      {guardado && (
        <p
          role="status"
          className="bg-field-soft text-field-deep mt-4 rounded-xl p-3 text-sm"
        >
          {t("form.saved")}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="bg-coral/10 text-coral-ink mt-4 rounded-xl p-3 text-sm"
        >
          {t("form.error")}
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="border-border bg-surface rounded-2xl border p-4">
          <h2 className="font-display text-lg font-extrabold">
            {t("form.title")}
          </h2>
          {canVerify(session) ? (
            <form action={verify} className="mt-3 space-y-3">
              <input type="hidden" name="tipo" value={tipo} />
              <input type="hidden" name="id" value={entity.id} />
              <label className="block text-sm font-semibold">
                {t("form.status")}
                <select
                  name="estado"
                  defaultValue={entity.verification}
                  className={field}
                >
                  {VERIFICATION_STATES.map((s) => (
                    <option key={s} value={s}>
                      {t(`verification.${s}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                {t("form.notes")}
                <textarea
                  name="nota"
                  rows={3}
                  maxLength={2000}
                  className={field}
                />
              </label>
              <label className="block text-sm font-semibold">
                {t("form.evidence")}
                <input
                  name="evidencia"
                  type="url"
                  placeholder="https://"
                  className={field}
                />
              </label>
              <button
                type="submit"
                className="bg-sea-deep rounded-full px-5 py-2 font-bold text-white"
              >
                {t("form.submit")}
              </button>
            </form>
          ) : (
            <p className="text-muted mt-3 text-sm">{t("form.readOnly")}</p>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="font-display text-lg font-extrabold">
              {t("sources")}
            </h2>
            {entity.sources.length === 0 ? (
              <p className="text-muted mt-2 text-sm">{t("noSources")}</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {entity.sources.map((s, i) => (
                  <li key={i}>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sea-deep underline"
                      >
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold">
              {t("history")}
            </h2>
            {entity.logs.length === 0 ? (
              <p className="text-muted mt-2 text-sm">{t("noHistory")}</p>
            ) : (
              <ol className="mt-2 space-y-3 text-sm">
                {entity.logs.map((log, i) => (
                  <li key={i} className="border-border border-l-2 pl-3">
                    <p className="text-muted text-xs">
                      {formatDate(log.created_at)}
                    </p>
                    <p>
                      {log.previous_status
                        ? t(`verification.${log.previous_status}`)
                        : "—"}
                      {" → "}
                      <strong>{t(`verification.${log.new_status}`)}</strong>
                    </p>
                    {log.notes && <p className="mt-1">{log.notes}</p>}
                    {log.evidence_url && (
                      <a
                        href={log.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sea-deep break-all underline"
                      >
                        {log.evidence_url}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>

      <section className="border-border bg-surface mt-6 rounded-2xl border p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-extrabold">
            {t("preview.title")}
          </h2>
          {entity.publication === "published" && (
            <a
              href={publicPath(tipo, entity.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sea-deep text-sm font-semibold underline"
            >
              {t("preview.open")} ↗
            </a>
          )}
        </div>
        {entity.publication === "published" ? (
          <>
            <p className="text-muted mt-1 text-sm">{t("preview.help")}</p>
            <iframe
              src={publicPath(tipo, entity.slug)}
              title={t("preview.title")}
              loading="lazy"
              className="border-border mx-auto mt-3 block h-[44rem] w-full max-w-[24.5rem] rounded-[2rem] border-8 bg-white"
            />
          </>
        ) : (
          <p className="text-muted mt-2 text-sm">{t("preview.notPublished")}</p>
        )}
      </section>
    </>
  );
}
