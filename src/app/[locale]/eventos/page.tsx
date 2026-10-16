import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link, redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { canonicalCategory, listCategories, listEvents } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { StatusBadge } from "@/components/place/status-badge";

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

const monthName = (locale: string, month: number, style: "long" | "short") =>
  new Intl.DateTimeFormat(locale, {
    month: style,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, month - 1, 1)));

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
  const tp = await getTranslations("place");

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

  const chip = (on: boolean) =>
    `flex min-h-11 items-center rounded-full border px-4 text-sm font-bold transition ${on ? "border-sea bg-sea text-white" : "border-border bg-surface hover:border-sea"}`;

  return (
    <main className="flex flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-10">
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
          <ul aria-label={t("list")} className="flex flex-col gap-3">
            {events.map((e, i) => {
              const when =
                e.month && e.day
                  ? t("onDate", {
                      day: e.day,
                      month: monthName(locale, e.month, "long"),
                    })
                  : e.month
                    ? t("inMonth", {
                        month: monthName(locale, e.month, "long"),
                      })
                    : e.season === "summer"
                      ? t("summer")
                      : t("toConfirm");
              return (
                <li
                  key={e.slug}
                  id={e.slug}
                  style={{ "--i": i } as React.CSSProperties}
                  className="rise-in border-border bg-surface flex gap-4 rounded-2xl border p-4 shadow-sm"
                >
                  <div
                    className="bg-sea-soft text-sea-deep flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl text-center"
                    aria-hidden="true"
                  >
                    {e.month ? (
                      <>
                        <span className="font-display text-xl leading-none font-extrabold">
                          {e.day ?? "·"}
                        </span>
                        <span className="text-xs font-bold uppercase">
                          {monthName(locale, e.month, "short").replace(".", "")}
                        </span>
                      </>
                    ) : (
                      <CategoryIcon
                        category={e.categorySlug}
                        className="size-7"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-field text-xs font-bold tracking-wide uppercase">
                      {e.categoryName}
                      {e.localityName ? ` · ${e.localityName}` : ""}
                    </p>
                    <h2 className="font-display text-lg leading-snug font-extrabold">
                      {e.name}
                    </h2>
                    <p className="text-sea-deep mt-0.5 text-sm font-bold">
                      {when}
                    </p>
                    <p className="mt-1 text-sm">{e.shortDescription}</p>
                    {e.fallbackToSpanish ? (
                      <p className="text-muted mt-1 text-xs">
                        {tp("onlySpanish")}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge verification={e.verification} />
                    </div>
                    <p className="text-muted mt-2 text-xs">
                      {t("source")}:{" "}
                      {e.sources.map((s, k) => (
                        <span key={s.url + k}>
                          {k > 0 ? " · " : null}
                          <a
                            className="text-sea underline"
                            href={s.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {s.label}
                          </a>
                        </span>
                      ))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
