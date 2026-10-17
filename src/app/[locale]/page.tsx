import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link, getPathname } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { getData, isLocated } from "@/lib/data";
import { listNotices } from "@/lib/business";
import { NoticeList } from "@/components/business/notice-list";
import { CommuneMap3D } from "@/components/map/commune-map-3d";
import { buildPageMetadata, getSiteUrl, localizedUrl } from "@/lib/seo";
import { HeroScene } from "@/components/ui/hero-scene";
import {
  CategoryCardFace,
  categoryCardClass,
} from "@/components/ui/category-card";
import { PlaceCard } from "@/components/place/place-card";
import { RouteCard } from "@/components/route/route-card";
import { QrVisit } from "@/components/analytics/qr-visit";
import { JsonLd } from "@/components/seo/json-ld";
import { PAPUDO_CENTER } from "@/content/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "home" });
  return buildPageMetadata({
    locale,
    href: "/",
    title: t("metaTitle"),
    description: t("subtitle"),
    image: "/rutas/ruta-costera-papudo.webp",
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const te = await getTranslations("events");
  const [data, notices] = await Promise.all([getData(), listNotices()]);
  const categories = data.listCategories(locale);
  const places = data.listPlaces(locale).slice(0, 4);
  const routes = data.listRoutes(locale);
  const mapPlaces = data
    .listPlaces(locale)
    .filter(isLocated)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      category: p.categorySlug,
    }));
  const localities = data.listLocalities(locale);
  const eventCount = data.listEvents(locale).length;

  return (
    <main className="flex flex-col">
      <QrVisit />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          name: "Papudo",
          url: localizedUrl(locale, "/"),
          image: `${getSiteUrl()}/rutas/ruta-costera-papudo.webp`,
          geo: {
            "@type": "GeoCoordinates",
            latitude: PAPUDO_CENTER.latitude,
            longitude: PAPUDO_CENTER.longitude,
          },
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: "Región de Valparaíso, Chile",
          },
        }}
      />
      <HeroScene>
        <p className="font-script text-xl text-[#fbeab0] drop-shadow">
          {t("kicker")}
        </p>
        <h1 className="shimmer-title font-display mt-2 text-4xl leading-[1.08] font-extrabold sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-md text-base text-white/90">{t("subtitle")}</p>
        <form
          action={getPathname({ locale, href: "/explorar" })}
          className="mt-6 flex max-w-md gap-2"
        >
          <label className="sr-only" htmlFor="home-q">
            {t("search")}
          </label>
          <input
            id="home-q"
            name="q"
            type="search"
            placeholder={t("search")}
            className="text-foreground placeholder:text-muted min-h-12 min-w-0 flex-1 rounded-full border-0 bg-white px-5 shadow-lg"
          />
          <button
            type="submit"
            className="bg-coral text-coral-ink min-h-12 shrink-0 rounded-full px-5 font-bold shadow-lg active:scale-95"
          >
            {t("searchGo")}
          </button>
        </form>
      </HeroScene>
      {notices.length > 0 ? (
        <div className="mx-auto w-full max-w-3xl px-4 pt-5">
          <NoticeList notices={notices} />
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-9 px-4 pt-2 pb-10">
        <section aria-labelledby="que-hacer">
          <h2 id="que-hacer" className="font-display text-3xl font-extrabold">
            {t("whatToDo")}
          </h2>
          <p className="text-muted text-sm sm:hidden">{t("whatToDoHint")}</p>
          <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-1 pb-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
            {categories.map((c, i) => (
              <li
                key={c.slug}
                className="rise-in w-40 shrink-0 snap-start sm:w-auto"
                style={{ "--i": i } as React.CSSProperties}
              >
                <Link
                  href={{ pathname: "/explorar", query: { categoria: c.slug } }}
                  className={`${categoryCardClass} h-60 sm:h-48`}
                >
                  <CategoryCardFace
                    category={c.slug}
                    name={c.name}
                    index={i}
                    compactOnWide
                    countLabel={t("placesCount", { count: c.count })}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="mapa-comuna" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id="mapa-comuna"
              className="font-display text-2xl font-extrabold"
            >
              {t("mapTitle")}
            </h2>
            <Link
              href={{ pathname: "/explorar", query: { vista: "mapa" } }}
              className="text-sea shrink-0 text-sm font-bold"
            >
              {t("mapOpen")}
            </Link>
          </div>
          <p className="text-muted -mt-2 text-sm">{t("mapSubtitle")}</p>
          <CommuneMap3D
            places={mapPlaces}
            localities={localities.flatMap((l) =>
              l.latitude !== null && l.longitude !== null
                ? [
                    {
                      slug: l.slug,
                      name: l.name,
                      latitude: l.latitude,
                      longitude: l.longitude,
                    },
                  ]
                : [],
            )}
          />
          <ul className="flex flex-wrap gap-2" aria-label={t("mapVillages")}>
            {localities.map((l) => (
              <li key={l.slug}>
                <Link
                  href={{
                    pathname: "/pueblos/[slug]",
                    params: { slug: l.slug },
                  }}
                  className="border-sea text-sea-deep hover:bg-sea-soft inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-bold"
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="rutas-destacadas"
          className="flex flex-col gap-4"
        >
          <h2 id="rutas-destacadas" className="sr-only">
            {t("featuredRoute")}
          </h2>
          {routes.map((r, i) => (
            <RouteCard
              key={r.slug}
              route={r}
              index={i}
              kicker={i === 0 ? t("featuredRoute") : undefined}
            />
          ))}
        </section>

        <section aria-labelledby="eventos-home">
          <Link
            href="/eventos"
            className="card-lift border-border bg-surface flex items-center gap-4 rounded-2xl border p-4 shadow-sm"
          >
            <span
              aria-hidden="true"
              className="bg-sea-soft text-sea-deep grid size-14 shrink-0 place-items-center rounded-2xl"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <h2
                id="eventos-home"
                className="font-display text-xl font-extrabold"
              >
                {te("homeTitle")}
              </h2>
              <span className="text-muted block text-sm">
                {te("homeSubtitle")} {te("countLabel", { count: eventCount })}
              </span>
            </span>
            <span className="text-sea shrink-0 text-sm font-bold">
              {te("viewCalendar")}
            </span>
          </Link>
        </section>

        <section aria-labelledby="destacados">
          <div className="flex items-baseline justify-between">
            <h2
              id="destacados"
              className="font-display text-2xl font-extrabold"
            >
              {t("featured")}
            </h2>
            <Link href="/explorar" className="text-sea text-sm font-bold">
              {t("seeAll")}
            </Link>
          </div>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {places.map((p, i) => (
              <li key={p.slug}>
                <PlaceCard place={p} index={i} />
              </li>
            ))}
          </ul>
        </section>

        <p
          role="note"
          className="bg-earth-soft text-earth rounded-xl p-3 text-sm"
        >
          {t("demoNotice")}
        </p>
        <Link
          href="/quiosco"
          className="text-sea self-start text-sm font-bold underline"
        >
          {t("kioskLink")}
        </Link>
      </div>
    </main>
  );
}
