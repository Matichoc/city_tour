import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { CATEGORIES, PLACES, getPlace, localize } from "@/lib/demo-data";
import { StatusBadge } from "@/components/place/status-badge";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    PLACES.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const place = getPlace(slug);
  return place ? { title: localize(place.name, locale as Locale) } : {};
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const place = getPlace(slug);
  if (!place) notFound();
  const t = await getTranslations("place");
  const category = CATEGORIES.find((c) => c.slug === place.category);

  return (
    <main className="flex flex-col gap-5 px-4 py-6">
      <Link href="/explorar" className="text-sea text-sm font-semibold">
        ← {t("back")}
      </Link>
      <header>
        <p className="text-hill text-xs font-semibold tracking-wide uppercase">
          {category ? localize(category.name, locale as Locale) : null}
        </p>
        <h1 className="font-display mt-1 text-3xl leading-tight font-bold">
          {localize(place.name, locale as Locale)}
        </h1>
        <div className="mt-3">
          <StatusBadge place={place} />
        </div>
      </header>
      <p>{localize(place.shortDescription, locale as Locale)}</p>

      <dl className="divide-border border-border bg-surface divide-y rounded-2xl border">
        <div className="flex justify-between gap-4 p-4">
          <dt className="font-semibold">{t("hours")}</dt>
          <dd className="text-muted">{t("hoursPending")}</dd>
        </div>
        <div className="flex justify-between gap-4 p-4">
          <dt className="font-semibold">{t("lastVerified")}</dt>
          <dd className="text-muted">{t("never")}</dd>
        </div>
        {place.source ? (
          <div className="flex justify-between gap-4 p-4">
            <dt className="font-semibold">{t("source")}</dt>
            <dd>
              <a
                className="text-sea underline"
                href={place.source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {place.source.title}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <button
        type="button"
        disabled
        className="bg-sea text-sea-foreground min-h-12 rounded-full px-6 font-semibold opacity-50"
      >
        {t("navigate")}
      </button>
      <p className="text-muted text-sm">{t("navigateSoon")}</p>
    </main>
  );
}
