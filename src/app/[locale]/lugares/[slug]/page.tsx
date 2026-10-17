import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { getData } from "@/lib/data";
import { directionsUrl, searchUrl } from "@/lib/map-config";
import { TrackedAnchor } from "@/components/analytics/tracked-link";
import {
  buildPageMetadata,
  getSiteUrl,
  localizedUrl,
  truncate,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { formatDuration } from "@/lib/itinerary-format";
import { IllustratedImage } from "@/components/ui/illustrated-image";
import { StatusBadge } from "@/components/place/status-badge";
import { ShareButton } from "@/components/place/share-button";
import { AddToTripButton } from "@/components/trip/add-to-trip-button";
import { PlacesMap } from "@/components/map/places-map";
import { QrVisit } from "@/components/analytics/qr-visit";
import { DEMO_REVIEWS } from "@/content/demo-content";
import { DemoReviews, RatingSummary } from "@/components/place/demo-reviews";
import { SaveButton } from "@/components/place/save-button";
import { ReviewsPanel } from "@/components/place/reviews-panel";
import { Stars } from "@/components/ui/stars";
import { PlaceCta } from "@/components/business/place-cta";
import { NoticeList } from "@/components/business/notice-list";
import { BusinessInvite } from "@/components/business/business-invite";
import { listReviews, reviewStats } from "@/lib/reviews";
import { listNotices } from "@/lib/business";
import { freshness } from "@/lib/freshness";
import { formatHours } from "@/lib/hours";

export async function generateStaticParams() {
  const data = await getData();
  return routing.locales.flatMap((locale) =>
    data.listPlaceSlugs().map((slug) => ({ locale, slug })),
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
  const place = data.getPlace(slug, locale);
  if (!place) return {};
  const meta = buildPageMetadata({
    locale,
    href: { pathname: "/lugares/[slug]", params: { slug } },
    title: place.name,
    description: truncate(place.shortDescription),
  });
  // Las fichas de ejemplo (ficticias) no se indexan.
  return place.demo
    ? { ...meta, robots: { index: false, follow: false } }
    : meta;
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  setRequestLocale(locale);
  const data = await getData();
  const place = data.getPlace(slug, locale);
  if (!place) notFound();
  const t = await getTranslations("place");
  const tr = await getTranslations("reviews");
  const [reviews, notices] = place.demo
    ? [[], []]
    : await Promise.all([
        listReviews("place", place.slug),
        listNotices(place.slug),
      ]);
  const rating = reviewStats(reviews.map((r) => r.rating));
  const seeded = place.demo
    ? (DEMO_REVIEWS[place.slug] ?? []).map((r) => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        text: r.text[locale],
        ownerReply: r.ownerReply ? r.ownerReply[locale] : null,
      }))
    : [];
  const day = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "America/Santiago",
      dateStyle: "long",
    }).format(new Date(iso));
  const hoursWords = {
    everyDay: t("hoursEveryDay"),
    holidays: t("hoursHolidays"),
    and: t("hoursAnd"),
    allYear: t("hoursAllYear"),
    monthRange: (from: string, to: string) => t("hoursMonths", { from, to }),
  };
  const infoState =
    place.business && !place.demo ? freshness(place.infoUpdatedAt) : null;
  const sections = [
    ["resumen", t("tabOverview")],
    ["ubicacion", t("tabLocation")],
    ["opiniones", t("tabReviews")],
    ["datos", t("tabDetails")],
  ] as const;

  return (
    <main className="flex flex-col gap-5 pb-10">
      <QrVisit />
      {place.demo ? null : (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type":
              place.categorySlug === "balneario"
                ? "Beach"
                : "TouristAttraction",
            name: place.name,
            description: place.shortDescription,
            url: localizedUrl(locale, {
              pathname: "/lugares/[slug]",
              params: { slug: place.slug },
            }),
            image: `${getSiteUrl()}${place.picture.src}`,
            ...(place.hasLocation
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: place.latitude,
                    longitude: place.longitude,
                  },
                }
              : {}),
            address: {
              "@type": "PostalAddress",
              ...(place.address ? { streetAddress: place.address } : {}),
              addressLocality: place.localityName ?? "Papudo",
              addressRegion: "Valparaíso",
              addressCountry: "CL",
            },
          }}
        />
      )}
      <div className="relative">
        <IllustratedImage picture={place.picture} className="h-56" priority />
        <Link
          href="/explorar"
          className="text-sea-deep absolute top-3 left-3 rounded-full bg-white/90 px-4 py-2 text-sm font-bold shadow"
        >
          ← {t("back")}
        </Link>
      </div>

      <div className="flex flex-col gap-5 px-4">
        {place.demo ? (
          <p
            role="note"
            className="bg-sun/30 text-earth rounded-xl p-3 text-sm font-bold"
          >
            {t("demoBanner")}
          </p>
        ) : null}
        <header>
          <p className="text-field text-xs font-bold tracking-wide uppercase">
            {place.categoryName}
            {place.localitySlug ? (
              <>
                {" · "}
                <Link
                  href={{
                    pathname: "/pueblos/[slug]",
                    params: { slug: place.localitySlug },
                  }}
                  className="underline"
                >
                  {place.localityName}
                </Link>
              </>
            ) : null}
          </p>
          <h1 className="font-display mt-1 text-3xl leading-tight font-extrabold">
            {place.name}
          </h1>
          {place.demo ? (
            <RatingSummary
              slug={place.slug}
              seededRatings={seeded.map((r) => r.rating)}
            />
          ) : (
            <a
              href="#opiniones"
              className="text-muted mt-2 inline-flex items-center gap-2 text-sm hover:underline"
            >
              <Stars value={rating.average ?? 0} className="size-4" />
              {rating.average !== null ? (
                <span>
                  <b className="text-foreground">{rating.average.toFixed(1)}</b>{" "}
                  · {tr("count", { count: rating.count })}
                </span>
              ) : (
                tr("count", { count: 0 })
              )}
            </a>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {place.demo ? (
              <span className="bg-sun text-coral-ink inline-block rounded-full px-2.5 py-1 text-xs font-extrabold">
                {t("demoBadge")}
              </span>
            ) : (
              <StatusBadge verification={place.verification} />
            )}
            {place.fallbackToSpanish ? (
              <span className="text-muted text-xs">{t("onlySpanish")}</span>
            ) : null}
          </div>
        </header>

        <NoticeList notices={notices} />

        <div className="flex flex-wrap gap-2">
          {place.cta ? <PlaceCta slug={place.slug} cta={place.cta} /> : null}
          {place.hasLocation ? <AddToTripButton slug={place.slug} /> : null}
          {place.demo ? null : (
            <TrackedAnchor
              event="navigate_click"
              eventProps={{ slug: place.slug }}
              href={
                place.latitude !== null && place.longitude !== null
                  ? directionsUrl(place.latitude, place.longitude)
                  : place.mapsUrl
                    ? place.mapsUrl
                    : searchUrl(
                        `${place.name}, ${place.address ?? "Papudo"}, Chile`,
                      )
              }
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sea inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-white"
            >
              {t("navigate")}
            </TrackedAnchor>
          )}
          <SaveButton slug={place.slug} />
          <ShareButton title={place.name} />
        </div>

        <nav
          aria-label={t("sections")}
          className="bg-background/95 sticky top-[3.25rem] z-20 -mx-4 overflow-x-auto px-4 py-2 backdrop-blur"
        >
          <ul className="flex gap-2">
            {sections.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="border-border bg-surface hover:border-sea inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold whitespace-nowrap"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section id="resumen" className="scroll-mt-32">
          <h2 className="sr-only">{t("tabOverview")}</h2>
          <p className="text-base leading-relaxed">{place.description}</p>
        </section>

        <section id="ubicacion" className="flex scroll-mt-32 flex-col gap-3">
          <h2 className="font-display text-xl font-extrabold">
            {t("tabLocation")}
          </h2>
          {place.latitude !== null && place.longitude !== null ? (
            <>
              <PlacesMap
                className="h-60"
                markers={[
                  {
                    slug: place.slug,
                    name: place.name,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    category: place.categorySlug,
                  },
                ]}
              />
              <p className="text-muted text-xs">{t("approxLocation")}</p>
            </>
          ) : (
            <p className="bg-sea-soft rounded-xl p-3 text-sm">
              {place.demo ? t("demoLocation") : t("noLocation")}
            </p>
          )}
        </section>

        {place.demo ? (
          <DemoReviews
            slug={place.slug}
            seeded={seeded}
            entityName={place.name}
          />
        ) : (
          <ReviewsPanel
            business={place.business}
            entity="place"
            slug={place.slug}
            entityName={place.name}
          />
        )}

        {place.business && !place.demo ? <BusinessInvite /> : null}

        <section id="datos" className="flex scroll-mt-32 flex-col gap-3">
          <h2 className="font-display text-xl font-extrabold">
            {t("tabDetails")}
          </h2>
          <dl className="divide-border border-border bg-surface divide-y rounded-2xl border">
            {place.address ? (
              <div className="flex justify-between gap-4 p-4">
                <dt className="font-bold">{t("address")}</dt>
                <dd className="text-muted text-right">{place.address}</dd>
              </div>
            ) : null}
            {place.visitMinutes > 0 ? (
              <div className="flex justify-between gap-4 p-4">
                <dt className="font-bold">{t("visitTime")}</dt>
                <dd className="text-muted">
                  ≈ {formatDuration(place.visitMinutes)} · {t("estimated")}
                </dd>
              </div>
            ) : null}
            {place.demo ? (
              <div className="flex justify-between gap-4 p-4">
                <dt className="font-bold">{t("source")}</dt>
                <dd className="text-muted text-right">{t("demoSource")}</dd>
              </div>
            ) : (
              <>
                <div className="flex justify-between gap-4 p-4">
                  <dt className="font-bold">{t("hours")}</dt>
                  {place.hours.length > 0 ? (
                    <dd className="text-muted flex flex-col items-end gap-2 text-right">
                      {place.hours.map((h) => {
                        const f = formatHours(h, locale, hoursWords);
                        return (
                          <span key={`${h.fromMonth}-${h.opens}`}>
                            <b className="text-foreground">{f.season}</b>
                            <br />
                            {f.days} · {f.time}
                          </span>
                        );
                      })}
                      <span className="text-xs">{t("hoursSource")}</span>
                    </dd>
                  ) : (
                    <dd className="text-muted">{t("hoursPending")}</dd>
                  )}
                </div>
                {place.instagram ? (
                  <div className="flex justify-between gap-4 p-4">
                    <dt className="font-bold">{t("instagram")}</dt>
                    <dd>
                      <a
                        href={place.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sea underline"
                      >
                        @{place.instagram.replace(/\/+$/, "").split("/").at(-1)}
                      </a>
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 p-4">
                  <dt className="font-bold">{t("lastVerified")}</dt>
                  <dd className="text-muted">
                    {place.lastVerifiedAt
                      ? day(place.lastVerifiedAt)
                      : t("never")}
                  </dd>
                </div>
                {infoState ? (
                  <div className="flex justify-between gap-4 p-4">
                    <dt className="font-bold">{t("infoUpdated")}</dt>
                    <dd className="text-muted text-right">
                      {place.infoUpdatedAt
                        ? t("infoUpdatedOn", { date: day(place.infoUpdatedAt) })
                        : t("infoNever")}
                    </dd>
                  </div>
                ) : null}
              </>
            )}
            {place.sources.length > 0 ? (
              <div className="flex justify-between gap-4 p-4">
                <dt className="font-bold">{t("source")}</dt>
                <dd className="flex flex-col items-end gap-1 text-right">
                  {place.sources.map((s) => (
                    <a
                      key={s.url}
                      className="text-sea underline"
                      href={s.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {s.label}
                    </a>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
          {infoState === "overdue" ? (
            <p
              role="note"
              className="bg-sun/30 text-earth rounded-xl p-3 text-sm"
            >
              {t("infoStale")}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
