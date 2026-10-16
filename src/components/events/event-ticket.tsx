import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { EventItem } from "@/lib/data";
import { CATEGORY_BG } from "@/components/ui/category-card";
import { Stars } from "@/components/ui/stars";

/** Entrada de evento al estilo cartelera: talón de fecha, detalles y valoración. */
export async function EventTicket({
  event,
  whenLabel,
  monthShort,
  index = 0,
}: {
  event: EventItem;
  whenLabel: string;
  monthShort: string | null;
  index?: number;
}) {
  const t = await getTranslations("events");
  return (
    <Link
      href={{ pathname: "/eventos/[slug]", params: { slug: event.slug } }}
      style={{ "--i": index } as React.CSSProperties}
      className="card-lift rise-in border-border bg-surface group flex overflow-hidden rounded-2xl border shadow-sm"
    >
      <span
        className={`relative flex w-24 shrink-0 flex-col items-center justify-center bg-gradient-to-b p-2 text-center text-white ${CATEGORY_BG[event.categorySlug]}`}
        aria-hidden="true"
      >
        {monthShort ? (
          <>
            {event.day ? (
              <>
                <span className="text-xs font-extrabold uppercase">
                  {monthShort}
                </span>
                <span className="font-display text-4xl leading-none font-extrabold">
                  {event.day}
                </span>
              </>
            ) : (
              <span className="font-display text-3xl font-extrabold uppercase">
                {monthShort}
              </span>
            )}
          </>
        ) : (
          <span className="font-display text-lg leading-tight font-extrabold">
            {event.season === "summer" ? "☀" : "?"}
          </span>
        )}
        {/* Perforación del ticket */}
        <span className="bg-background absolute -top-2.5 -right-2.5 size-5 rounded-full" />
        <span className="bg-background absolute -right-2.5 -bottom-2.5 size-5 rounded-full" />
        <span className="absolute inset-y-3 right-0 border-r-2 border-dashed border-white/60" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-field text-xs font-bold tracking-wide uppercase">
            {event.categoryName}
            {event.localityName ? ` · ${event.localityName}` : ""}
          </span>
          {event.demo ? (
            <span className="bg-sun text-coral-ink rounded-full px-2 py-0.5 text-xs font-extrabold">
              {t("demoBadge")}
            </span>
          ) : null}
        </span>
        <span className="font-display text-xl leading-tight font-extrabold">
          {event.name}
        </span>
        <span className="text-sea-deep text-sm font-bold">{whenLabel}</span>
        <span className="text-muted line-clamp-2 text-sm">
          {event.shortDescription}
        </span>
        <span className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm">
            <Stars value={event.ratingAverage ?? 0} className="size-4" />
            {event.ratingAverage !== null ? (
              <span>
                <b>{event.ratingAverage.toFixed(1)}</b> ({event.ratingCount})
              </span>
            ) : (
              <span className="text-muted">{t("noRatings")}</span>
            )}
          </span>
          <span className="text-sea text-sm font-extrabold">
            {t("viewDetails")}{" "}
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}
