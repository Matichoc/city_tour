import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link, getPathname } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { listCategories, listPlaces, listRoutes } from "@/lib/data";
import { buildPageMetadata, getSiteUrl, localizedUrl } from "@/lib/seo";
import { HeroScene } from "@/components/ui/hero-scene";
import { CategoryIcon } from "@/components/ui/category-icon";
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
  const categories = listCategories(locale);
  const places = listPlaces(locale).slice(0, 4);
  const routes = listRoutes(locale);

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
        <p className="text-sm font-bold tracking-widest text-[#ffe3a8] uppercase">
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

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-9 px-4 pt-2 pb-10">
        <section aria-labelledby="que-hacer">
          <h2 id="que-hacer" className="font-display text-2xl font-extrabold">
            {t("whatToDo")}
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((c, i) => (
              <li
                key={c.slug}
                className="rise-in"
                style={{ "--i": i } as React.CSSProperties}
              >
                <Link
                  href={
                    c.count > 0
                      ? { pathname: "/explorar", query: { categoria: c.slug } }
                      : "/negocios"
                  }
                  className="card-lift border-border bg-surface flex min-h-20 items-center gap-3 rounded-2xl border p-3 shadow-sm"
                >
                  <span className="bg-sea-soft text-sea-deep grid size-11 shrink-0 place-items-center rounded-xl">
                    <CategoryIcon category={c.slug} className="size-6" />
                  </span>
                  <span>
                    <span className="block text-sm leading-tight font-extrabold">
                      {c.name}
                    </span>
                    <span className="text-muted text-xs">
                      {t("placesCount", { count: c.count })}
                    </span>
                  </span>
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

        <Link
          href="/negocios"
          className="card-lift border-sea bg-sea-soft flex items-center justify-between gap-4 rounded-2xl border-2 p-5"
        >
          <span>
            <span className="font-display text-sea-deep block text-lg font-extrabold">
              {t("businessTitle")}
            </span>
            <span className="text-sm">{t("businessBody")}</span>
          </span>
          <span className="bg-coral text-coral-ink shrink-0 rounded-full px-4 py-2 text-sm font-bold">
            {t("businessCta")}
          </span>
        </Link>

        <p
          role="note"
          className="bg-earth-soft text-earth rounded-xl p-3 text-sm"
        >
          {t("demoNotice")}
        </p>
      </div>
    </main>
  );
}
