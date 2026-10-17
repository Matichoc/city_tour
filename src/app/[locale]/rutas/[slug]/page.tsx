import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { getData, isLocated } from "@/lib/data";
import { buildPageMetadata, localizedUrl, truncate } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { formatDuration } from "@/lib/itinerary-format";
import { PageHero } from "@/components/ui/page-hero";
import { PlacesMap } from "@/components/map/places-map";
import { AddRouteToTripButton } from "@/components/trip/add-route-to-trip-button";
import { ShareButton } from "@/components/place/share-button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PrintButton } from "@/components/ui/print-button";
import { QrVisit } from "@/components/analytics/qr-visit";

export async function generateStaticParams() {
  const data = await getData();
  return routing.locales.flatMap((locale) =>
    data.listRouteSlugs().map((slug) => ({ locale, slug })),
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
  const route = data.getRoute(slug, locale);
  if (!route) return {};
  return buildPageMetadata({
    locale,
    href: { pathname: "/rutas/[slug]", params: { slug } },
    title: route.name,
    description: truncate(route.description),
  });
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  setRequestLocale(locale);
  const data = await getData();
  const route = data.getRoute(slug, locale);
  if (!route) notFound();
  const t = await getTranslations("routes");
  const routeUrl = localizedUrl(locale, {
    pathname: "/rutas/[slug]",
    params: { slug: route.slug },
  });
  const qrSvg = await QRCode.toString(
    `${routeUrl}?origen=ruta-${route.slug.slice(0, 40)}`,
    {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#07495a", light: "#ffffff" },
    },
  );

  return (
    <main className="flex flex-col">
      <QrVisit />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: route.name,
          description: route.description,
          url: localizedUrl(locale, {
            pathname: "/rutas/[slug]",
            params: { slug: route.slug },
          }),
          itinerary: {
            "@type": "ItemList",
            itemListElement: route.stops.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "TouristAttraction",
                name: s.place.name,
                url: localizedUrl(locale, {
                  pathname: "/lugares/[slug]",
                  params: { slug: s.place.slug },
                }),
              },
            })),
          },
        }}
      />
      <PageHero
        title={route.name}
        subtitle={route.description}
        image={route.cover ?? undefined}
      >
        <p className="mt-3 text-sm font-bold text-[#ffe3a8]">
          {t("stops", { count: route.stops.length })}
          {route.durationMinutes
            ? ` · ${formatDuration(route.durationMinutes)}`
            : ""}
        </p>
      </PageHero>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-10">
        <div className="flex flex-wrap gap-2 print:hidden">
          <AddRouteToTripButton slugs={route.stops.map((s) => s.place.slug)} />
          <ShareButton title={route.name} />
        </div>

        <PlacesMap
          connect
          className="h-72 print:hidden"
          markers={route.stops
            .map((s) => s.place)
            .filter(isLocated)
            .map((place, i) => ({
              slug: place.slug,
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude,
              category: place.categorySlug,
              order: i + 1,
            }))}
        />

        <ol className="flex flex-col gap-3">
          {route.stops.map((s, i) => (
            <li
              key={s.place.slug}
              className="rise-in"
              style={{ "--i": i } as React.CSSProperties}
            >
              <Link
                href={{
                  pathname: "/lugares/[slug]",
                  params: { slug: s.place.slug },
                }}
                className="card-lift border-border bg-surface flex gap-3 rounded-2xl border p-4 shadow-sm"
              >
                <span className="bg-sea grid size-10 shrink-0 place-items-center rounded-full font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="font-display flex items-center gap-2 text-lg font-extrabold">
                    {s.place.name}
                    <CategoryIcon
                      category={s.place.categorySlug}
                      className="text-field size-4"
                    />
                  </span>
                  <span className="text-muted mt-1 block text-sm">
                    {s.place.shortDescription}
                  </span>
                  {s.notes ? (
                    <span className="text-earth mt-1 block text-sm font-semibold">
                      {s.notes}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {route.source ? (
          <p className="text-muted text-sm">
            {t("source")}:{" "}
            <a
              className="text-sea underline"
              href={route.source.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {route.source.label}
            </a>
          </p>
        ) : null}
        <p className="bg-earth-soft text-earth rounded-xl p-3 text-sm">
          {t("pendingNote")}
        </p>

        <section
          aria-labelledby="llevatela"
          className="border-border bg-surface flex flex-wrap items-center gap-5 rounded-2xl border p-4"
        >
          <div
            className="w-36 shrink-0"
            role="img"
            aria-label={t("qrAlt")}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="min-w-0 flex-1">
            <h2 id="llevatela" className="font-display text-xl font-extrabold">
              {t("takeTitle")}
            </h2>
            <p className="text-muted mt-1 text-sm">{t("takeBody")}</p>
            <div className="mt-3 print:hidden">
              <PrintButton label={t("print")} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
