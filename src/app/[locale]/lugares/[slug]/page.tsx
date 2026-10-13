import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { getPlace, listPlaceSlugs } from "@/lib/data";
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

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listPlaceSlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const place = getPlace(slug, locale);
  if (!place) return {};
  return buildPageMetadata({
    locale,
    href: { pathname: "/lugares/[slug]", params: { slug } },
    title: place.name,
    description: truncate(place.shortDescription),
  });
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  setRequestLocale(locale);
  const place = getPlace(slug, locale);
  if (!place) notFound();
  const t = await getTranslations("place");

  return (
    <main className="flex flex-col gap-5 pb-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type":
            place.categorySlug === "playas" ? "Beach" : "TouristAttraction",
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge verification={place.verification} />
            {place.fallbackToSpanish ? (
              <span className="text-muted text-xs">{t("onlySpanish")}</span>
            ) : null}
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {place.hasLocation ? <AddToTripButton slug={place.slug} /> : null}
          <TrackedAnchor
            event="navigate_click"
            eventProps={{ slug: place.slug }}
            href={
              place.latitude !== null && place.longitude !== null
                ? directionsUrl(place.latitude, place.longitude)
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
          <ShareButton title={place.name} />
        </div>

        <p className="text-base leading-relaxed">{place.description}</p>

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
            <p className="text-muted -mt-3 text-xs">{t("approxLocation")}</p>
          </>
        ) : (
          <p className="bg-sea-soft rounded-xl p-3 text-sm">
            {t("noLocation")}
          </p>
        )}

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
          <div className="flex justify-between gap-4 p-4">
            <dt className="font-bold">{t("hours")}</dt>
            <dd className="text-muted">{t("hoursPending")}</dd>
          </div>
          <div className="flex justify-between gap-4 p-4">
            <dt className="font-bold">{t("lastVerified")}</dt>
            <dd className="text-muted">{t("never")}</dd>
          </div>
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
      </div>
    </main>
  );
}
