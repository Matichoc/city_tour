import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import {
  illustrationFor,
  isCategorySlug,
  isLocated,
  listCategories,
  listLocalities,
  listPlaces,
} from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { PlaceCard } from "@/components/place/place-card";
import { PlacesMap } from "@/components/map/places-map";

type SearchParams = {
  categoria?: string;
  pueblo?: string;
  q?: string;
  vista?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "explore" });
  return buildPageMetadata({
    locale,
    href: "/explorar",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("explore");

  const category = isCategorySlug(sp.categoria) ? sp.categoria : undefined;
  const localities = listLocalities(locale);
  const locality = localities.some((l) => l.slug === sp.pueblo)
    ? sp.pueblo
    : undefined;
  const query = sp.q?.trim() || undefined;
  const view = sp.vista === "mapa" ? "map" : "list";

  const places = listPlaces(locale, { category, locality, query });
  const categories = listCategories(locale);

  const base = { categoria: category, pueblo: locality, q: query };
  const q = (extra: Partial<SearchParams>) =>
    Object.fromEntries(
      Object.entries({
        ...base,
        vista: view === "map" ? "mapa" : undefined,
        ...extra,
      }).filter(([, v]) => v),
    );

  const chip = (on: boolean) =>
    `flex min-h-11 items-center rounded-full border px-4 text-sm font-bold transition ${on ? "border-sea bg-sea text-white" : "border-border bg-surface hover:border-sea"}`;

  return (
    <main className="flex flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-10">
        <form role="search" className="flex gap-2">
          {category ? (
            <input type="hidden" name="categoria" value={category} />
          ) : null}
          {locality ? (
            <input type="hidden" name="pueblo" value={locality} />
          ) : null}
          {view === "map" ? (
            <input type="hidden" name="vista" value="mapa" />
          ) : null}
          <label className="sr-only" htmlFor="q">
            {t("search")}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t("search")}
            className="border-border bg-surface min-h-12 min-w-0 flex-1 rounded-full border px-5"
          />
          <button
            type="submit"
            className="bg-sea min-h-12 shrink-0 rounded-full px-5 font-bold text-white active:scale-95"
          >
            {t("searchGo")}
          </button>
        </form>

        <nav aria-label={t("categories")}>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={{
                  pathname: "/explorar",
                  query: q({ categoria: undefined }),
                }}
                aria-current={!category ? "true" : undefined}
                className={chip(!category)}
              >
                {t("all")}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={{
                    pathname: "/explorar",
                    query: q({ categoria: c.slug }),
                  }}
                  aria-current={category === c.slug ? "true" : undefined}
                  className={chip(category === c.slug)}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("localities")}>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={{
                  pathname: "/explorar",
                  query: q({ pueblo: undefined }),
                }}
                className={chip(!locality)}
              >
                {t("allLocalities")}
              </Link>
            </li>
            {localities.map((l) => (
              <li key={l.slug}>
                <Link
                  href={{ pathname: "/explorar", query: q({ pueblo: l.slug }) }}
                  aria-current={locality === l.slug ? "true" : undefined}
                  className={chip(locality === l.slug)}
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-muted text-sm font-semibold">
            {t("results", { count: places.length })}
          </p>
          <div
            role="group"
            aria-label={t("view")}
            className="border-border flex overflow-hidden rounded-full border text-sm font-bold"
          >
            <Link
              href={{
                pathname: "/explorar",
                query: { ...base, vista: undefined },
              }}
              aria-current={view === "list" ? "true" : undefined}
              className={`min-h-11 px-4 py-2.5 ${view === "list" ? "bg-sea text-white" : "bg-surface text-muted"}`}
            >
              {t("list")}
            </Link>
            <Link
              href={{
                pathname: "/explorar",
                query: { ...base, vista: "mapa" },
              }}
              aria-current={view === "map" ? "true" : undefined}
              className={`min-h-11 px-4 py-2.5 ${view === "map" ? "bg-sea text-white" : "bg-surface text-muted"}`}
            >
              {t("map")}
            </Link>
          </div>
        </div>

        {places.length === 0 ? (
          <EmptyState
            title={t("empty")}
            picture={
              category === "alojamiento" || category === "gastronomia"
                ? illustrationFor("hostales", locale)
                : undefined
            }
          >
            <p>
              {category === "alojamiento" ||
              category === "gastronomia" ||
              category === "actividades"
                ? t("emptyComing")
                : t("emptyHint")}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <Link
                href="/explorar"
                className="text-sea inline-flex min-h-11 items-center font-bold"
              >
                {t("clear")}
              </Link>
            </div>
          </EmptyState>
        ) : view === "map" ? (
          <PlacesMap
            className="h-[28rem]"
            markers={places.filter(isLocated).map((p) => ({
              slug: p.slug,
              name: p.name,
              latitude: p.latitude,
              longitude: p.longitude,
              category: p.categorySlug,
            }))}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {places.map((p, i) => (
              <li key={p.slug}>
                <PlaceCard place={p} index={i} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
