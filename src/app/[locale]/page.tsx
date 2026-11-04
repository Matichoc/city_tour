import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link, getPathname } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { getData, illustrationFor, isLocated } from "@/lib/data";
import { listNotices } from "@/lib/business";
import { NoticeList } from "@/components/business/notice-list";
import { CommuneMap3D } from "@/components/map/commune-map-3d";
import { buildPageMetadata, getSiteUrl, localizedUrl } from "@/lib/seo";
import { SearchSuggestions } from "@/components/ui/search-suggestions";
import { DoorTiles } from "@/components/home/door-tiles";
import {
  UpcomingEvents,
  type UpcomingItem,
} from "@/components/home/upcoming-events";
import { RouteSpotlight } from "@/components/home/route-spotlight";
import {
  FeaturedCard,
  type FeaturedItem,
} from "@/components/home/featured-card";
import { eventWhen } from "@/lib/event-format";
import { daysUntil, eventsInWindow, todayInChile } from "@/lib/featured";
import { DOORS, SERVICE_CATEGORIES } from "@/lib/doors";
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

/** Cuántas fiestas muestra «Se viene» (la primera, destacada). */
const UPCOMING_COUNT = 3;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const td = await getTranslations("doors");
  const te = await getTranslations("events");
  const ts = await getTranslations("search");
  const tp = await getTranslations("place");
  const [data, notices] = await Promise.all([getData(), listNotices()]);
  const categories = data.listCategories(locale);
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
  const allEvents = data.listEvents(locale);
  const today = todayInChile();

  // Las cuatro puertas: cuántos lugares junta cada una.
  const countOf = (slugs: readonly string[]) =>
    categories
      .filter((c) => slugs.includes(c.slug))
      .reduce((n, c) => n + c.count, 0);
  const doors = DOORS.map((d) => ({
    key: d.key,
    name: td(`${d.key}.name`),
    countLabel: t("doorCount", { count: countOf(d.categories) }),
    picture: illustrationFor(d.illustration, locale),
  }));
  const services = categories.filter((c) =>
    (SERVICE_CATEGORIES as readonly string[]).includes(c.slug),
  );

  // «Se viene»: las próximas fiestas con fecha, hasta un año hacia adelante.
  const shortMonth = (m: number) =>
    new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
      .format(new Date(Date.UTC(2026, m - 1, 1)))
      .replace(".", "");
  const upcoming: UpcomingItem[] = eventsInWindow(allEvents, today, 365)
    .slice(0, UPCOMING_COUNT)
    .map((e) => {
      const days = daysUntil(e, today);
      return {
        slug: e.slug,
        name: e.name,
        day: e.day,
        month: e.month ? shortMonth(e.month) : "",
        when:
          days === null
            ? eventWhen(te, locale, e)
            : t("inDays", { count: days }),
        demoLabel: e.demo ? te("demoBadge") : null,
      };
    });

  // «Destacados del mes»: las fiestas de hoy a 30 días más y, para completar
  // hasta 5, los primeros lugares (primero los reales, luego los de ejemplo).
  const FEATURED_COUNT = 5;
  const featured: FeaturedItem[] = eventsInWindow(allEvents, today)
    .slice(0, FEATURED_COUNT)
    .map((e) => ({
      kind: "event" as const,
      slug: e.slug,
      kicker: [e.categoryName, e.localityName].filter(Boolean).join(" · "),
      name: e.name,
      detail: eventWhen(te, locale, e),
      picture: e.picture,
      demoLabel: e.demo ? te("demoBadge") : null,
    }));
  const candidates = data.listPlaces(locale);
  for (const p of [
    ...candidates.filter((x) => !x.demo),
    ...candidates.filter((x) => x.demo),
  ]) {
    if (featured.length >= FEATURED_COUNT) break;
    featured.push({
      kind: "place",
      slug: p.slug,
      kicker: [p.categoryName, p.localityName].filter(Boolean).join(" · "),
      name: p.name,
      detail: p.shortDescription,
      picture: p.picture,
      demoLabel: p.demo ? tp("demoBadge") : null,
    });
  }
  const examples = [1, 2, 3, 4].map((n) => ts(`example${n}`));
  const route = routes[0];

  const heading = "font-display text-2xl font-extrabold sm:text-3xl";
  const more = "text-sea shrink-0 text-sm font-bold";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-10 sm:px-6">
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

      {/* Portada: a la izquierda el saludo y el buscador; a la derecha (o
          debajo, en celular) los cuatro cuadros del logo como puertas. */}
      <section className="grid items-center gap-8 pt-6 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pt-12">
        <div>
          <p className="font-script text-sea text-lg">{t("kicker")}</p>
          <h1 className="font-display mt-2 text-5xl leading-[0.95] font-extrabold sm:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
          <p className="text-muted mt-4 max-w-md text-lg">{t("subtitle")}</p>
          <form
            action={getPathname({ locale, href: "/explorar" })}
            className="border-foreground mt-6 flex max-w-lg items-center gap-2 rounded-full border-2 p-1.5 pl-5"
          >
            <label className="sr-only" htmlFor="home-q">
              {t("search")}
            </label>
            <input
              id="home-q"
              name="q"
              type="search"
              placeholder={t("search")}
              aria-describedby="search-hint"
              className="placeholder:text-muted min-h-11 min-w-0 flex-1 bg-transparent outline-none"
            />
            <button
              type="submit"
              className="bg-coral min-h-11 shrink-0 rounded-full px-5 font-bold text-white active:scale-95"
            >
              {t("searchGo")}
            </button>
          </form>
          <div className="mt-3 max-w-lg">
            <SearchSuggestions
              hint={ts("hint")}
              tryLabel={ts("tryLabel")}
              examples={examples}
            />
          </div>
        </div>

        <nav aria-labelledby="puertas">
          <h2 id="puertas" className="sr-only">
            {t("doorsTitle")}
          </h2>
          <DoorTiles doors={doors} />
          {services.length > 0 ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted font-semibold">{t("services")}</span>
              {services.map((c) => (
                <Link
                  key={c.slug}
                  href={{ pathname: "/explorar", query: { categoria: c.slug } }}
                  className="border-border hover:border-foreground inline-flex min-h-11 items-center rounded-full border-2 px-4 font-bold"
                >
                  {c.name}
                </Link>
              ))}
            </p>
          ) : null}
        </nav>
      </section>

      {notices.length > 0 ? (
        <div className="pt-6">
          <NoticeList notices={notices} />
        </div>
      ) : null}

      <div className="grid gap-10 pt-12 lg:grid-cols-[1fr_1.5fr]">
        {upcoming.length > 0 ? (
          <section aria-labelledby="se-viene" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="se-viene" className={heading}>
                {t("upcoming")}
              </h2>
              <Link href="/eventos" className={more}>
                {t("agenda")}
              </Link>
            </div>
            <UpcomingEvents items={upcoming} />
          </section>
        ) : null}

        {route ? (
          <section aria-labelledby="ruta-hoy" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="ruta-hoy" className={heading}>
                {t("routeToday")}
              </h2>
              <Link href="/rutas" className={more}>
                {t("allRoutes", { count: routes.length })}
              </Link>
            </div>
            <RouteSpotlight
              route={route}
              meta={t("routeMeta", { count: route.stops.length })}
            />
          </section>
        ) : null}
      </div>

      <section aria-labelledby="destacados" className="pt-12">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="destacados" className={heading}>
            {t("featured")}
          </h2>
          <Link href="/explorar" className={more}>
            {t("seeAll")}
          </Link>
        </div>
        <p className="text-muted text-sm">{t("featuredHint")}</p>
        <ul className="-mx-4 mt-3 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {featured.map((item, i) => (
            <li
              key={`${item.kind}-${item.slug}`}
              className="w-64 shrink-0 snap-start sm:w-72"
            >
              <FeaturedCard item={item} index={i} />
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="mapa-comuna"
        className="flex flex-col gap-3 pt-12"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="mapa-comuna" className={heading}>
            {t("mapTitle")}
          </h2>
          <Link
            href={{ pathname: "/explorar", query: { vista: "mapa" } }}
            className={more}
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
                className="border-foreground hover:bg-soft inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-bold"
              >
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p
        role="note"
        className="bg-earth-soft text-earth mt-12 rounded-xl p-3 text-sm"
      >
        {t("demoNotice")}
      </p>
      <Link
        href="/quiosco"
        className="text-sea mt-4 self-start text-sm font-bold underline"
      >
        {t("kioskLink")}
      </Link>
    </main>
  );
}
