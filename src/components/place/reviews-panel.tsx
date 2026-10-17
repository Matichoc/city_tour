import { getLocale, getTranslations } from "next-intl/server";
import { supabaseConfig } from "@/lib/db/content-source";
import { listReviews, reviewStats, type ReviewEntity } from "@/lib/reviews";
import { Stars } from "@/components/ui/stars";
import { ReviewForm } from "@/components/place/review-form";

/**
 * Opiniones reales con estrellas (estilo TripAdvisor). Con base de datos, se
 * publican al enviarlas y el personal modera desde /admin. Sin base, se
 * muestra vacío: nunca se inventan reseñas ni puntajes.
 */
export async function ReviewsPanel({
  business,
  entity,
  slug,
  entityName,
}: {
  business: boolean;
  entity: ReviewEntity;
  slug: string;
  entityName: string;
}) {
  const t = await getTranslations("reviews");
  const enabled = supabaseConfig() !== null;
  const reviews = enabled ? await listReviews(entity, slug) : [];
  const { count, average, dist } = reviewStats(reviews.map((r) => r.rating));
  const date = new Intl.DateTimeFormat(await getLocale(), {
    timeZone: "America/Santiago",
    dateStyle: "medium",
  });

  return (
    <section
      id="opiniones"
      aria-labelledby="opiniones-title"
      className="border-border bg-surface scroll-mt-32 rounded-2xl border p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="opiniones-title"
          className="font-display text-2xl font-extrabold"
        >
          {t("title")}
        </h2>
        <span className="text-muted text-sm">{t("count", { count })}</span>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-start gap-1">
          <p className="font-display text-5xl leading-none font-extrabold">
            {average !== null ? average.toFixed(1) : "—"}
          </p>
          <Stars value={average ?? 0} />
          <p className="text-muted text-xs">
            {average !== null ? t("outOf5", { count }) : t("noRating")}
          </p>
        </div>
        <ul className="flex flex-col gap-1" aria-label={t("distribution")}>
          {dist.map(({ n, count: c }) => (
            <li key={n} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0">{t(`level.${n}`)}</span>
              <span className="bg-sea-soft h-2 flex-1 overflow-hidden rounded-full">
                <span
                  className="block h-full rounded-full bg-[#f59e0b]"
                  style={{ width: count ? `${(c / count) * 100}%` : "0%" }}
                />
              </span>
              <span className="text-muted w-4 text-right">{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {enabled ? (
        <>
          <p className="text-muted mt-4 text-xs">{t("realNote")}</p>
          <ReviewForm entity={entity} slug={slug} entityName={entityName} />
          {reviews.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-3" aria-label={t("list")}>
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="border-border rounded-2xl border bg-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} className="size-4" />
                    <b>{r.author}</b>
                    <span className="text-muted text-xs">
                      {date.format(new Date(r.createdAt))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-line">{r.text}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <div className="bg-sea-soft mt-4 rounded-xl p-4">
          <p className="font-bold">{t("beFirst")}</p>
          <p className="mt-1 text-sm">{t("comingSoon")}</p>
          {business ? (
            <p className="text-muted mt-2 text-xs">{t("ownerReply")}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
