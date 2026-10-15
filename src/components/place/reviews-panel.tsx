import { getTranslations } from "next-intl/server";

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-5"
          fill={n <= value ? "#0b7285" : "none"}
          stroke="#0b7285"
          strokeWidth="1.8"
        >
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Opiniones con estrellas (estilo TripAdvisor). Aún no hay cuentas, así que se
 * muestra vacío: nunca se inventan reseñas ni puntajes. La nota promedio
 * aparecerá recién con un mínimo de opiniones reales.
 */
export async function ReviewsPanel({ business }: { business: boolean }) {
  const t = await getTranslations("reviews");
  return (
    <section
      id="opiniones"
      aria-labelledby="opiniones-title"
      className="border-border bg-surface scroll-mt-32 rounded-2xl border p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="opiniones-title"
          className="font-display text-xl font-extrabold"
        >
          {t("title")}
        </h2>
        <span className="text-muted text-sm">{t("count", { count: 0 })}</span>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-start gap-1">
          <p className="font-display text-muted text-4xl font-extrabold">—</p>
          <Stars value={0} label={t("noRating")} />
          <p className="text-muted text-xs">{t("noRating")}</p>
        </div>
        <ul className="flex flex-col gap-1" aria-label={t("distribution")}>
          {[5, 4, 3, 2, 1].map((n) => (
            <li key={n} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0">{t(`level.${n}`)}</span>
              <span className="bg-sea-soft h-2 flex-1 rounded-full" />
              <span className="text-muted w-4 text-right">0</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-sea-soft mt-4 rounded-xl p-4">
        <p className="font-bold">{t("beFirst")}</p>
        <p className="mt-1 text-sm">{t("comingSoon")}</p>
        {business ? (
          <p className="text-muted mt-2 text-xs">{t("ownerReply")}</p>
        ) : null}
      </div>
    </section>
  );
}
