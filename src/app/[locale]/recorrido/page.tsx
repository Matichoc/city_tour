import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/utils";
import { isLocated, listPlaces, listRoutes } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { TripView } from "@/components/trip/trip-view";
import { SavedList } from "@/components/trip/saved-list";
import type { TripState } from "@/lib/trip-store";

type SearchParams = { l?: string; h?: string; v?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "trip" });
  return buildPageMetadata({
    locale,
    href: "/recorrido",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("trip");
  // Solo lugares con coordenada verificada pueden ordenarse en un recorrido.
  const all = listPlaces(locale);
  const places = all.filter(isLocated);
  const known = new Set(places.map((p) => p.slug));

  // Enlace compartido: ?l=a,b,c&h=10:00&v=1 (solo se aceptan lugares conocidos).
  const slugs = (sp.l ?? "").split(",").filter((s) => known.has(s));
  const initial: Partial<TripState> | null = slugs.length
    ? {
        slugs,
        orderMode: "manual",
        returnToStart: sp.v === "1",
        startTime: sp.h && /^\d{2}:\d{2}$/.test(sp.h) ? sp.h : "10:00",
      }
    : null;

  const routes = listRoutes(locale).map((r) => ({
    slug: r.slug,
    name: r.name,
    stopSlugs: r.stops.map((s) => s.place.slug),
  }));

  return (
    <main className="flex flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto w-full max-w-3xl">
        <TripView places={places} routes={routes} initial={initial} />
        <div className="pb-10">
          <SavedList
            places={all.map((p) => ({
              slug: p.slug,
              name: p.name,
              located: p.hasLocation,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
