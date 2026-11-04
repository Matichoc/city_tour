import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link, redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import {
  getData,
  canonicalCategory,
  illustrationFor,
  isLocated,
} from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { directionsUrl } from "@/lib/map-config";
import { EmptyState } from "@/components/ui/empty-state";
import { BusinessInvite } from "@/components/business/business-invite";
import { PlaceRow } from "@/components/place/place-row";
import { PlacesMap } from "@/components/map/places-map";
import { FilterMenu, type FilterItem } from "@/components/ui/filter-menu";
import {
  DOORS,
  DOOR_STYLE,
  SERVICE_CATEGORIES,
  doorOf,
  findDoor,
  styleOf,
} from "@/lib/doors";

type SearchParams = {
  categoria?: string;
  /** Una de las cuatro puertas de la portada (`lib/doors.ts`). */
  puerta?: string;
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

/**
 * Explorar: la lista de lugares y el mapa de la comuna. En computador van lado
 * a lado (el mapa queda fijo mientras se recorre la lista); en el celular se
 * elige Lista o Mapa. Se filtra por puerta (los cuadros del logo), por comer y
 * dormir, por pueblo y por búsqueda.
 */
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
  const td = await getTranslations("doors");

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
  const data = await getData();
  const localities = data.listLocalities(locale);
  const locality = localities.some((l) => l.slug === sp.pueblo)
    ? sp.pueblo
    : undefined;
  const query = sp.q?.trim() || undefined;
  const view = sp.vista === "mapa" ? "map" : "list";
  // Una puerta junta varias categorías; si viene, manda sobre la categoría.
  const door = findDoor(sp.puerta);

  const places = door
    ? data
        .listPlaces(locale, { locality, query })
        .filter((p) =>
          (door.categories as readonly string[]).includes(p.categorySlug),
        )
    : data.listPlaces(locale, { category, locality, query });
  const categories = data.listCategories(locale);
  const services = categories.filter((c) =>
    (SERVICE_CATEGORIES as readonly string[]).includes(c.slug),
  );

  const base = {
    categoria: door ? undefined : category,
    puerta: door?.key,
    pueblo: locality,
    q: query,
  };
  const q = (extra: Partial<SearchParams>) =>
    Object.fromEntries(
      Object.entries({
        ...base,
        vista: view === "map" ? "mapa" : undefined,
        ...extra,
      }).filter(([, v]) => v),
    );

  const all = data.listPlaces(locale);
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
  const localityLabel = localities.find((l) => l.slug === locality)?.name;
  const removable = [
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

  // Nombre de la puerta de cada lugar (o el de su categoría, si es servicio).
  const doorName = (slug: (typeof places)[number]["categorySlug"]) => {
    const d = doorOf(slug);
    return d
      ? td(`${d.key}.name`)
      : (categories.find((c) => c.slug === slug)?.name ?? "");
  };

  // Filtros de arriba: Todo, las cuatro puertas y comer y dormir.
  const chips = [
    {
      key: "todo",
      label: t("all"),
      frame: null,
      href: q({ puerta: undefined, categoria: undefined }),
      active: !door && !category,
    },
    ...DOORS.map((d) => ({
      key: d.key,
      label: td(`${d.key}.name`),
      frame: DOOR_STYLE[d.key].frame,
      href: q({ puerta: d.key, categoria: undefined }),
      active: door?.key === d.key,
    })),
    ...services.map((c) => ({
      key: c.slug,
      label: c.name,
      frame: DOOR_STYLE.servicio.frame,
      href: q({ categoria: c.slug, puerta: undefined }),
      active: !door && category === c.slug,
    })),
  ];
  // Explorar recibe un filtro de categoría que no es puerta ni servicio
  // (enlaces antiguos, p. ej. ?categoria=balneario): se muestra como chip.
  const looseCategory =
    !door && category && !chips.some((c) => c.active)
      ? categories.find((c) => c.slug === category)
      : undefined;

  const markers = places.filter(isLocated).map((p) => ({
    slug: p.slug,
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    category: p.categorySlug,
    detail: {
      kicker: doorName(p.categorySlug),
      text: p.shortDescription,
      image: p.logo?.src ?? p.picture.src,
      frame: styleOf(p.categorySlug).frame,
      directions: directionsUrl(p.latitude, p.longitude),
    },
  }));

  const segment = (on: boolean) =>
    `flex min-h-11 items-center gap-1.5 px-4 text-sm font-bold transition ${on ? "bg-foreground text-white" : "text-muted hover:text-foreground"}`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-6 pb-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl leading-none font-extrabold sm:text-5xl">
            {t("title")}
          </h1>
          <p
            className={`text-muted mt-2 ${view === "map" ? "hidden lg:block" : ""}`}
          >
            {t("subtitle")}
          </p>
        </div>
        <div
          role="group"
          aria-label={t("view")}
          className="border-foreground flex overflow-hidden rounded-full border-2 lg:hidden"
        >
          <Link
            href={{ pathname: "/explorar", query: q({ vista: undefined }) }}
            aria-current={view === "list" ? "true" : undefined}
            className={segment(view === "list")}
          >
            {t("list")}
          </Link>
          <Link
            href={{ pathname: "/explorar", query: q({ vista: "mapa" }) }}
            aria-current={view === "map" ? "true" : undefined}
            className={segment(view === "map")}
          >
            {t("map")}
          </Link>
        </div>
      </div>

      <nav aria-label={t("categories")}>
        <ul className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          {chips.map((c) => (
            <li key={c.key} className="shrink-0">
              <Link
                href={{ pathname: "/explorar", query: c.href }}
                aria-current={c.active ? "true" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold transition ${
                  c.active
                    ? "border-foreground bg-foreground text-white"
                    : "border-border hover:border-foreground"
                }`}
              >
                {c.frame ? (
                  <span
                    aria-hidden="true"
                    className={`size-4 rounded-[5px] ${c.frame} ${c.active ? "ring-2 ring-white" : ""}`}
                  />
                ) : null}
                {c.label}
              </Link>
            </li>
          ))}
          {looseCategory ? (
            <li className="shrink-0">
              <Link
                href={{
                  pathname: "/explorar",
                  query: q({ categoria: undefined }),
                }}
                aria-label={t("removeFilter", { name: looseCategory.name })}
                className="border-foreground bg-foreground inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold text-white"
              >
                {looseCategory.name}
                <span aria-hidden="true">×</span>
              </Link>
            </li>
          ) : null}
        </ul>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-auto sm:min-w-72">
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
        <p aria-live="polite" className="text-muted text-sm font-semibold">
          {t("results", { count: places.length })}
        </p>
      </div>

      {removable.length > 0 ? (
        <ul aria-label={t("activeFilters")} className="flex flex-wrap gap-2">
          {removable.map((r) => (
            <li key={r.key}>
              <Link
                href={r.href}
                aria-label={t("removeFilter", { name: r.label })}
                className="bg-soft hover:bg-foreground inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition hover:text-white"
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
            {(category || door) && !query && !locality
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
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <ul
            aria-label={t("placesList")}
            className={view === "map" ? "hidden lg:block" : ""}
          >
            {places.map((p) => (
              <li key={p.slug}>
                <PlaceRow place={p} doorName={doorName(p.categorySlug)} />
              </li>
            ))}
          </ul>
          {/* En computador el mapa acompaña a la lista; en el celular solo se
              muestra al elegir «Mapa». */}
          <div
            className={`lg:sticky lg:top-20 ${view === "map" ? "" : "hidden lg:block"}`}
          >
            <PlacesMap
              className="h-[70dvh] lg:h-[calc(100dvh-7rem)]"
              markers={markers}
            />
          </div>
        </div>
      )}
      <BusinessInvite />
    </main>
  );
}
