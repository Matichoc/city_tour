import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link, redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { canonicalCategory, listCategories, listEvents } from "@/lib/data";
import { eventWhen, monthName } from "@/lib/event-format";
import { buildPageMetadata } from "@/lib/seo";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { EventTicket } from "@/components/events/event-ticket";
import {
  FeaturedCarousel,
  type FeaturedSlide,
} from "@/components/events/featured-carousel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "events" });
  return buildPageMetadata({
    locale,
    href: "/eventos",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("events");

  const category = canonicalCategory(sp.categoria) ?? undefined;
  if (sp.categoria && category && sp.categoria !== category) {
    redirect({
      href: { pathname: "/eventos", query: { categoria: category } },
      locale,
    });
  }

  const all = listEvents(locale);
  const events = listEvents(locale, { category });
  const withEvents = new Set(all.map((e) => e.categorySlug));
  const categories = listCategories(locale).filter((c) =>
    withEvents.has(c.slug),
  );

  const slides: FeaturedSlide[] = all
    .filter((e) => e.featured)
    .map((e) => ({
      slug: e.slug,
      name: e.name,
      shortDescription: e.shortDescription,
      categoryName: e.categoryName,
      localityName: e.localityName,
      whenLabel: eventWhen(t, locale, e),
      monthShort: e.month ? monthName(locale, e.month, "short") : null,
      day: e.day,
      demo: e.demo,
      ratingAverage: e.ratingAverage,
      ratingCount: e.ratingCount,
      picture: e.picture,
    }));

  const chip = (on: boolean) =>
    `flex min-h-11 items-center rounded-full border px-4 text-sm font-bold transition ${on ? "border-sea bg-sea text-white" : "border-border bg-surface hover:border-sea"}`;

  return (
    <main className="flex flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-10">
        <FeaturedCarousel slides={slides} />

        <p
          role="note"
          className="bg-earth-soft text-earth rounded-xl p-3 text-sm"
        >
          {t("confirmNote")}
        </p>

        <nav aria-label={t("categories")}>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/eventos"
                aria-current={!category ? "true" : undefined}
                className={chip(!category)}
              >
                {t("all")}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={{ pathname: "/eventos", query: { categoria: c.slug } }}
                  aria-current={category === c.slug ? "true" : undefined}
                  className={chip(category === c.slug)}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {events.length === 0 ? (
          <EmptyState title={t("empty")}>
            <Link
              href="/eventos"
              className="text-sea inline-flex min-h-11 items-center font-bold"
            >
              {t("clear")}
            </Link>
          </EmptyState>
        ) : (
          <ul aria-label={t("list")} className="flex flex-col gap-4">
            {events.map((e, i) => (
              <li key={e.slug} id={e.slug}>
                <EventTicket
                  event={e}
                  index={i}
                  whenLabel={eventWhen(t, locale, e)}
                  monthShort={
                    e.month ? monthName(locale, e.month, "short") : null
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
