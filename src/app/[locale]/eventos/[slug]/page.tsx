import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { getData } from "@/lib/data";
import { eventWhen, monthName } from "@/lib/event-format";
import { buildPageMetadata, truncate } from "@/lib/seo";
import { DEMO_REVIEWS } from "@/content/demo-content";
import { AiBadge } from "@/components/ui/ai-badge";
import { Stars } from "@/components/ui/stars";
import { StatusBadge } from "@/components/place/status-badge";
import { ShareButton } from "@/components/place/share-button";
import { ReviewsPanel } from "@/components/place/reviews-panel";
import { DemoReviews } from "@/components/place/demo-reviews";

export async function generateStaticParams() {
  const data = await getData();
  return routing.locales.flatMap((locale) =>
    data.listEventSlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const data = await getData();
  const event = data.getEvent(slug, locale);
  if (!event) return {};
  const meta = buildPageMetadata({
    locale,
    href: { pathname: "/eventos/[slug]", params: { slug } },
    title: event.name,
    description: truncate(event.shortDescription),
  });
  return event.demo
    ? { ...meta, robots: { index: false, follow: false } }
    : meta;
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  setRequestLocale(locale);
  const data = await getData();
  const event = data.getEvent(slug, locale);
  if (!event) notFound();
  const t = await getTranslations("events");
  const tp = await getTranslations("place");

  const when = eventWhen(t, locale, event);
  const monthShort = event.month
    ? monthName(locale, event.month, "short")
    : null;
  const seeded = event.demo
    ? (DEMO_REVIEWS[event.slug] ?? []).map((r) => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        text: r.text[locale],
        ownerReply: r.ownerReply ? r.ownerReply[locale] : null,
      }))
    : [];

  return (
    <main className="flex flex-col gap-5 pb-10">
      <div className="relative isolate h-72 overflow-hidden text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.picture.src}
          alt={event.picture.alt}
          width={event.picture.width}
          height={event.picture.height}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(7_43_54_/_0.3)_0%,rgb(7_43_54_/_0.5)_50%,rgb(7_30_40_/_0.92)_100%)]"
          aria-hidden="true"
        />
        <AiBadge className="absolute right-3 bottom-1.5" />
        <Link
          href="/eventos"
          className="text-sea-deep absolute top-3 left-3 rounded-full bg-white/90 px-4 py-2 text-sm font-bold shadow"
        >
          ← {t("back")}
        </Link>
        {monthShort ? (
          <span
            aria-hidden="true"
            className="absolute top-3 right-3 flex w-16 flex-col items-center rounded-2xl bg-white py-2 text-center text-[#07495a] shadow-lg"
          >
            {event.day ? (
              <>
                <span className="text-xs font-extrabold uppercase">
                  {monthShort}
                </span>
                <span className="font-display text-2xl leading-none font-extrabold">
                  {event.day}
                </span>
              </>
            ) : (
              <span className="font-display text-2xl font-extrabold uppercase">
                {monthShort}
              </span>
            )}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
          <p className="text-sm font-bold text-[#ffe3a8]">
            {event.categoryName}
            {event.localityName ? ` · ${event.localityName}` : ""}
          </p>
          <h1 className="font-display text-3xl leading-[1.05] font-extrabold drop-shadow sm:text-4xl">
            {event.name}
          </h1>
          <p className="flex items-center gap-2 text-sm">
            <Stars
              value={event.ratingAverage ?? 0}
              className="size-4"
              tone="light"
            />
            {event.ratingAverage !== null ? (
              <span>
                <b>{event.ratingAverage.toFixed(1)}</b> ({event.ratingCount})
              </span>
            ) : (
              <span className="text-white/85">{t("noRatings")}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4">
        {event.demo ? (
          <p
            role="note"
            className="bg-sun/30 text-earth rounded-xl p-3 text-sm font-bold"
          >
            {t("demoBanner")}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <ShareButton title={event.name} />
          <Link
            href="/eventos"
            className="border-sea text-sea-deep hover:bg-sea-soft inline-flex min-h-11 items-center rounded-full border-2 px-5 text-sm font-bold"
          >
            {t("moreEvents")}
          </Link>
        </div>

        <section aria-labelledby="sobre-evento">
          <h2
            id="sobre-evento"
            className="font-display text-2xl font-extrabold"
          >
            {t("about")}
          </h2>
          <p className="mt-2 text-base leading-relaxed">
            {event.shortDescription}
          </p>
          {event.fallbackToSpanish ? (
            <p className="text-muted mt-1 text-xs">{tp("onlySpanish")}</p>
          ) : null}
        </section>

        <dl className="divide-border border-border bg-surface divide-y overflow-hidden rounded-2xl border">
          <div className="flex justify-between gap-4 p-4">
            <dt className="font-bold">{t("when")}</dt>
            <dd className="text-right">{when}</dd>
          </div>
          <div className="flex justify-between gap-4 p-4">
            <dt className="font-bold">{t("where")}</dt>
            <dd className="text-right">
              {event.localityName ?? t("everywhere")}
            </dd>
          </div>
          <div className="flex justify-between gap-4 p-4">
            <dt className="font-bold">{t("product")}</dt>
            <dd className="text-right">{event.categoryName}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <dt className="font-bold">{t("status")}</dt>
            <dd>
              {event.demo ? (
                <span className="bg-sun text-coral-ink rounded-full px-2.5 py-1 text-xs font-extrabold">
                  {t("demoBadge")}
                </span>
              ) : (
                <StatusBadge verification={event.verification} />
              )}
            </dd>
          </div>
        </dl>
        <p className="bg-earth-soft text-earth rounded-xl p-3 text-sm">
          {t("confirmNote")}
        </p>

        {event.demo ? (
          <DemoReviews
            slug={event.slug}
            seeded={seeded}
            entityName={event.name}
          />
        ) : (
          <ReviewsPanel business={false} />
        )}

        {event.sources.length > 0 ? (
          <p className="text-muted text-xs">
            {t("sourcesTitle")}:{" "}
            {event.sources.map((s, k) => (
              <span key={s.url + k}>
                {k > 0 ? " · " : null}
                <a
                  className="text-sea underline"
                  href={s.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {s.label}
                </a>
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </main>
  );
}
