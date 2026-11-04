import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { EventItem } from "@/lib/data";
import { styleOf } from "@/lib/doors";
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
  const tone = styleOf(event.categorySlug);
  return (
    <Link
      href={{ pathname: "/eventos/[slug]", params: { slug: event.slug } }}
      style={{ "--i": index } as React.CSSProperties}
      className="rise-in border-border hover:border-foreground bg-surface group flex overflow-hidden rounded-[1.4rem] border-2 transition"
    >
      <span
        className={`relative flex w-24 shrink-0 flex-col items-center justify-center p-2 text-center ${tone.frame} ${tone.on}`}
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
          <span className={`text-sm font-semibold ${tone.ink}`}>
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
