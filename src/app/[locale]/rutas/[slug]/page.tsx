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
import { WhatsAppButton } from "@/components/share/whatsapp-button";
import { PrintButton } from "@/components/ui/print-button";
import { QrVisit } from "@/components/analytics/qr-visit";
import { ListenButton } from "@/components/listen/listen-button";
import { routeListen } from "@/lib/listen-text";
import { styleOf } from "@/lib/doors";

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
  const tl = await getTranslations("listen");
  const th = await getTranslations("home");
  // Etiquetas de cada parte de la audioguía (el texto lo arma el servidor).
  const parts = (await routeListen(route, locale)).map(
    ({ label, targetId }) => ({ label, targetId }),
  );
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
      color: { dark: "#14164a", light: "#ffffff" },
    },
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col sm:px-2">
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
        <p className="mt-3 font-bold">
          {th("routeMeta", { count: route.stops.length })}
          {route.durationMinutes
            ? `, ${formatDuration(route.durationMinutes)}`
            : ""}
        </p>
      </PageHero>
      <div className="flex flex-col gap-6 px-4 pt-3 pb-10">
        <div className="flex flex-wrap gap-2 print:hidden">
          <AddRouteToTripButton slugs={route.stops.map((s) => s.place.slug)} />
          <ShareButton title={route.name} />
          <WhatsAppButton
            message={t("whatsappMessage", {
              name: route.name,
              count: route.stops.length,
              stops: route.stops
                .map((s, i) => `${i + 1}. ${s.place.name}`)
                .join(", "),
            })}
          />
        </div>

        {/* En computador: la audioguía y las paradas a la izquierda, el mapa
            fijo a la derecha. */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <div className="print:hidden">
              <ListenButton
                parts={parts}
                title={route.name}
                playLabel={tl("playRouteLabel", { name: route.name })}
                slug={route.slug}
                kind="route"
              />
            </div>

            <ol className="flex flex-col gap-2">
              {route.stops.map((s, i) => {
                const tone = styleOf(s.place.categorySlug);
                const thumb = s.place.logo?.src ?? s.place.picture.src;
                return (
                  <li
                    key={s.place.slug}
                    id={`parada-${i + 1}`}
                    // La parada que está sonando en la audioguía (aria-current="step").
                    className="aria-[current=step]:bg-sun/40 rounded-2xl transition"
                  >
                    <Link
                      href={{
                        pathname: "/lugares/[slug]",
                        params: { slug: s.place.slug },
                      }}
                      className="hover:bg-soft flex items-center gap-4 rounded-2xl p-2"
                    >
                      <span
                        className={`relative size-16 shrink-0 rounded-[1rem] p-[3px] ${tone.frame}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          className={`size-full rounded-[0.8rem] border-2 border-white/95 object-cover ${
                            s.place.picture.kind || s.place.logo
                              ? ""
                              : "mix-blend-multiply saturate-[.3]"
                          }`}
                        />
                        <span
                          className={`absolute -top-2 -left-2 grid size-7 place-items-center rounded-full border-2 border-white text-xs font-extrabold ${tone.frame} ${tone.on}`}
                        >
                          {i + 1}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold">{s.place.name}</span>
                        <span className="text-muted line-clamp-2 text-sm">
                          {s.place.shortDescription}
                        </span>
                        {s.notes ? (
                          <span className="text-earth mt-0.5 block text-sm font-semibold">
                            {s.notes}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="lg:sticky lg:top-20 print:hidden">
            <PlacesMap
              connect
              className="h-72 lg:h-[calc(100dvh-7rem)]"
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
          </div>
        </div>

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
          className="border-foreground flex flex-wrap items-center gap-5 rounded-[1.6rem] border-2 p-5"
        >
          <div
            className="w-36 shrink-0"
            role="img"
            aria-label={t("qrAlt")}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="min-w-0 flex-1">
            <h2 id="llevatela" className="font-display text-2xl font-extrabold">
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
