import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  canDeleteReviews,
  canModerate,
  countReviewNotices,
  getSession,
  listAbandonedUploads,
  listReviewsAdmin,
  REVIEW_FILTERS,
  type AdminReview,
  type ReviewFilter,
} from "@/lib/admin/api";
import { formatDate } from "@/components/admin/badges";
import { Stars } from "@/components/ui/stars";
import {
  cleanupAbandonedUploads,
  markAllReviewed,
  moderateMedia,
  moderateReview,
} from "@/app/admin/actions";

const PUBLIC_PATH = { lugar: "lugares", evento: "eventos" } as const;

export default async function ReviewsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; guardado?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  const sp = await searchParams;
  const filter: ReviewFilter = REVIEW_FILTERS.includes(
    sp.filtro as ReviewFilter,
  )
    ? (sp.filtro as ReviewFilter)
    : "todos";

  let reviews: AdminReview[];
  try {
    reviews = await listReviewsAdmin(session.token, filter);
  } catch (error) {
    console.error("[admin] no se pudieron listar comentarios", error);
    return <p className="text-coral-ink">{t("loadError")}</p>;
  }
  const [notices, abandoned] = await Promise.all([
    countReviewNotices(session.token),
    // El aviso de subidas es secundario: si falla, la lista igual se muestra.
    listAbandonedUploads(session.token).catch(() => []),
  ]);
  const button =
    "border-border rounded-full border px-3 py-1 text-sm font-semibold";

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">
        {t("reviews.title")}
      </h1>
      <p className="text-muted mt-1 text-sm">{t("reviews.intro")}</p>

      {notices > 0 && filter !== "nuevos" && (
        <p
          role="status"
          className="bg-sun/30 text-earth mt-4 flex flex-wrap items-center gap-2 rounded-xl p-3 text-sm"
        >
          {t("reviews.newCount", { count: notices })}
          <Link
            href="/admin/comentarios?filtro=nuevos"
            className="font-bold underline"
          >
            {t("reviews.reviewNow")}
          </Link>
        </p>
      )}

      <nav
        className="mt-4 flex flex-wrap gap-2"
        aria-label={t("reviews.title")}
      >
        {REVIEW_FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/comentarios?filtro=${f}`}
            aria-current={f === filter ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              f === filter
                ? "bg-sea-deep text-white"
                : "bg-sea-soft text-sea-deep"
            }`}
          >
            {t(`reviews.filter.${f}`)}
          </Link>
        ))}
      </nav>

      {canModerate(session) && filter === "nuevos" && reviews.length > 0 && (
        <form action={markAllReviewed} className="mt-3">
          <input type="hidden" name="filtro" value={filter} />
          <button className={button}>{t("reviews.markAll")}</button>
        </form>
      )}

      {sp.guardado && (
        <p
          role="status"
          className="bg-field-soft text-field-deep mt-4 rounded-xl p-3 text-sm"
        >
          {t("reviews.saved")}
        </p>
      )}
      {sp.error && (
        <p
          role="alert"
          className="bg-coral/10 text-coral-ink mt-4 rounded-xl p-3 text-sm"
        >
          {t("reviews.error")}
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted mt-6">{t("reviews.empty")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className={`border-border bg-surface rounded-2xl border p-4 ${
                r.status === "hidden" ? "opacity-70" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Stars value={r.rating} className="size-4" />
                <b>{r.author}</b>
                <span className="text-muted">{formatDate(r.createdAt)}</span>
                {r.reviewedAt === null && (
                  <span className="bg-coral text-coral-ink rounded-full px-2 py-0.5 text-xs font-extrabold">
                    {t("reviews.newBadge")}
                  </span>
                )}
                {r.status === "hidden" && (
                  <span className="bg-border text-muted rounded-full px-2 py-0.5 text-xs font-bold">
                    {t("reviews.hiddenBadge")}
                  </span>
                )}
              </div>
              {r.target && (
                <p className="text-muted mt-1 text-xs">
                  {t("reviews.on")}{" "}
                  <a
                    href={`/es/${PUBLIC_PATH[r.target.kind]}/${r.target.slug}#opiniones`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sea-deep underline"
                  >
                    {r.target.name}
                  </a>
                </p>
              )}
              <p className="mt-2 text-sm whitespace-pre-line">{r.text}</p>
              {r.media.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-3">
                  {r.media.map((m) => (
                    <li
                      key={m.id}
                      className="border-border w-40 overflow-hidden rounded-xl border"
                    >
                      <div className="bg-sea-soft aspect-square">
                        {m.url && m.kind === "video" ? (
                          <video
                            src={m.url}
                            controls
                            preload="metadata"
                            className="size-full object-cover"
                          />
                        ) : m.url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- enlace firmado de Storage, de corta duración
                          <img
                            src={m.url}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 p-2 text-xs">
                        <span className="font-bold">
                          {t(`reviews.media.${m.status}`)}
                        </span>
                        {m.status === "pending" && m.attention && (
                          <span className="bg-coral/10 text-coral-ink rounded-full px-2 py-0.5 font-bold">
                            {t("reviews.media.attention")}
                          </span>
                        )}
                      </div>
                      {canModerate(session) && m.status !== "rejected" && (
                        <form
                          action={moderateMedia}
                          className="flex gap-1 px-2 pb-2"
                        >
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="filtro" value={filter} />
                          {m.status === "pending" && (
                            <button
                              name="accion"
                              value="aprobar"
                              className={button}
                            >
                              {t("reviews.media.approve")}
                            </button>
                          )}
                          <button
                            name="accion"
                            value="rechazar"
                            className={`${button} text-coral-ink`}
                          >
                            {t("reviews.media.reject")}
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canModerate(session) && (
                <form
                  action={moderateReview}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="filtro" value={filter} />
                  {r.reviewedAt === null && (
                    <button name="accion" value="revisar" className={button}>
                      {t("reviews.markReviewed")}
                    </button>
                  )}
                  {r.status === "visible" ? (
                    <button name="accion" value="ocultar" className={button}>
                      {t("reviews.hide")}
                    </button>
                  ) : (
                    <button name="accion" value="mostrar" className={button}>
                      {t("reviews.show")}
                    </button>
                  )}
                  {canDeleteReviews(session) && (
                    <button
                      name="accion"
                      value="borrar"
                      className={`${button} text-coral-ink`}
                    >
                      {t("reviews.delete")}
                    </button>
                  )}
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {canModerate(session) && abandoned.length > 0 && (
        <section className="border-border bg-surface mt-8 rounded-2xl border p-4">
          <h2 className="font-display text-lg font-extrabold">
            {t("reviews.abandoned.title")}
          </h2>
          <p className="text-muted mt-1 text-sm">
            {t("reviews.abandoned.help")}
          </p>
          <form
            action={cleanupAbandonedUploads}
            className="mt-3 flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="filtro" value={filter} />
            <span className="text-sm font-bold">
              {t("reviews.abandoned.count", { count: abandoned.length })}
            </span>
            <button className={button}>{t("reviews.abandoned.clean")}</button>
          </form>
        </section>
      )}
    </>
  );
}
