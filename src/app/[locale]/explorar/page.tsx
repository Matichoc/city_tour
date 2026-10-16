import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link, redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import {
  canonicalCategory,
  illustrationFor,
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
import { CategoryIcon } from "@/components/ui/category-icon";
import { FilterMenu, type FilterItem } from "@/components/ui/filter-menu";

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

  const category = canonicalCategory(sp.categoria) ?? undefined;
  // Enlaces anteriores (?categoria=playas) pasan a la categoría actual.
  if (sp.categoria && category && sp.categoria !== category) {
    redirect({
      href: {
        pathname: "/explorar",
        query: Object.fromEntries(
          Object.entries({ ...sp, categoria: category }).filter(([, v]) => v),
        ),
      },
      locale,
    });
  }
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

  const all = listPlaces(locale);
  const catItems: FilterItem[] = [
    {
      key: "all",
      label: t("all"),
      href: { pathname: "/explorar", query: q({ categoria: undefined }) },
      active: !category,
      count: all.length,
    },
    ...categories.map((c) => ({
      key: c.slug,
      label: c.name,
      href: { pathname: "/explorar" as const, query: q({ categoria: c.slug }) },
      active: category === c.slug,
      count: c.count,
    })),
  ];
  const locItems: FilterItem[] = [
    {
      key: "all",
      label: t("allLocalities"),
      href: { pathname: "/explorar", query: q({ pueblo: undefined }) },
      active: !locality,
      count: all.length,
    },
    ...localities.map((l) => ({
      key: l.slug,
      label: l.name,
      href: { pathname: "/explorar" as const, query: q({ pueblo: l.slug }) },
      active: locality === l.slug,
      count: all.filter((p) => p.localitySlug === l.slug).length,
    })),
  ];
  const categoryLabel = categories.find((c) => c.slug === category)?.name;
  const localityLabel = localities.find((l) => l.slug === locality)?.name;
  const removable = [
    category && categoryLabel
      ? {
          key: "categoria",
          label: categoryLabel,
          href: {
            pathname: "/explorar" as const,
            query: q({ categoria: undefined }),
          },
        }
      : null,
    locality && localityLabel
      ? {
          key: "pueblo",
          label: localityLabel,
          href: {
            pathname: "/explorar" as const,
            query: q({ pueblo: undefined }),
          },
        }
      : null,
    query
      ? {
          key: "q",
          label: `“${query}”`,
          href: { pathname: "/explorar" as const, query: q({ q: undefined }) },
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  const segment = (on: boolean) =>
    `flex min-h-11 items-center gap-1.5 px-4 text-sm font-extrabold transition ${on ? "bg-sea text-white" : "bg-surface text-muted hover:text-foreground"}`;

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
          <div className="relative min-w-0 flex-1">
            <svg
              viewBox="0 0 24 24"
              className="text-sea pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={t("search")}
              className="border-border bg-surface min-h-12 w-full min-w-0 rounded-full border-2 pr-4 pl-11 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-sea min-h-12 shrink-0 rounded-full px-5 font-bold text-white active:scale-95"
          >
            {t("searchGo")}
          </button>
        </form>

        <div className="flex flex-col gap-3 sm:flex-row">
          <FilterMenu
            label={t("categories")}
            valueLabel={categoryLabel ?? t("all")}
            items={catItems}
            active={Boolean(category)}
            icon={
              category ? (
                <CategoryIcon category={category} className="size-5" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
                </svg>
              )
            }
          />
          <FilterMenu
            label={t("localities")}
            valueLabel={localityLabel ?? t("allLocalities")}
            items={locItems}
            active={Boolean(locality)}
            icon={
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              </svg>
            }
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-muted text-sm font-semibold">
            {t("results", { count: places.length })}
          </p>
          <div
            role="group"
            aria-label={t("view")}
            className="border-border flex overflow-hidden rounded-full border-2"
          >
            <Link
              href={{
                pathname: "/explorar",
                query: { ...base, vista: undefined },
              }}
              aria-current={view === "list" ? "true" : undefined}
              className={segment(view === "list")}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
              </svg>
              {t("list")}
            </Link>
            <Link
              href={{
                pathname: "/explorar",
                query: { ...base, vista: "mapa" },
              }}
              aria-current={view === "map" ? "true" : undefined}
              className={segment(view === "map")}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {t("map")}
            </Link>
          </div>
        </div>

        {removable.length > 0 ? (
          <ul aria-label={t("activeFilters")} className="flex flex-wrap gap-2">
            {removable.map((r) => (
              <li key={r.key}>
                <Link
                  href={r.href}
                  aria-label={t("removeFilter", { name: r.label })}
                  className="bg-sea-soft text-sea-deep hover:bg-sea inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition hover:text-white"
                >
                  {r.label}
                  <span aria-hidden="true" className="text-base leading-none">
                    ×
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/explorar"
                className="text-sea inline-flex min-h-11 items-center px-2 text-sm font-bold underline"
              >
                {t("clear")}
              </Link>
            </li>
          </ul>
        ) : null}

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
              {category && !query && !locality
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
