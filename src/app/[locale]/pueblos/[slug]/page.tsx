import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { getLocality, listLocalitySlugs, listPlaces } from "@/lib/data";
import { buildPageMetadata, truncate } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { PlaceCard } from "@/components/place/place-card";
import { EmptyState } from "@/components/ui/empty-state";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listLocalitySlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const village = getLocality(slug, locale);
  if (!village) return {};
  return buildPageMetadata({
    locale,
    href: { pathname: "/pueblos/[slug]", params: { slug } },
    title: village.name,
    description: village.summary ? truncate(village.summary) : undefined,
  });
}

export default async function VillagePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  setRequestLocale(locale);
  const village = getLocality(slug, locale);
  if (!village) notFound();
  const t = await getTranslations("village");
  const places = listPlaces(locale, { locality: slug });

  return (
    <main className="flex flex-col">
      <PageHero
        title={village.name}
        subtitle={village.summary ?? undefined}
        image={village.picture ?? undefined}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-10">
        {village.source ? (
          <p className="text-muted text-sm">
            {t("source")}:{" "}
            <a
              className="text-sea underline"
              href={village.source.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {village.source.label}
            </a>
          </p>
        ) : null}

        <h2 className="font-display text-2xl font-extrabold">{t("places")}</h2>
        {places.length === 0 ? (
          <EmptyState title={t("noPlaces")} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {places.map((p, i) => (
              <li key={p.slug}>
                <PlaceCard place={p} index={i} />
              </li>
            ))}
          </ul>
        )}
        <Link href="/informacion" className="text-sea font-bold">
          ← {t("back")}
        </Link>
      </div>
    </main>
  );
}
