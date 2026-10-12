import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CATEGORIES, PLACES, localize } from "@/lib/demo-data";
import { PlaceCard } from "@/components/place/place-card";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");
  const current = useLocale() as Locale;

  return (
    <main className="flex flex-col gap-8 px-4 pb-10">
      <section className="from-sea text-sea-foreground -mx-4 bg-gradient-to-b to-[#0a4f61] px-4 pt-8 pb-10">
        <h1 className="font-display text-4xl leading-tight font-bold">
          {t("title")}
        </h1>
        <p className="text-sea-foreground/90 mt-3 max-w-md text-base">
          {t("subtitle")}
        </p>
        <Link
          href="/explorar"
          className="bg-surface text-muted mt-6 flex min-h-12 items-center rounded-full px-5 text-sm font-medium shadow"
        >
          {t("search")}
        </Link>
      </section>

      <section aria-labelledby="que-hacer">
        <h2 id="que-hacer" className="font-display text-xl font-bold">
          {t("whatToDo")}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={{ pathname: "/explorar", query: { categoria: c.slug } }}
                className="border-border bg-surface hover:border-sea hover:text-sea flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold"
              >
                {localize(c.name, current)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="destacados">
        <div className="flex items-baseline justify-between">
          <h2 id="destacados" className="font-display text-xl font-bold">
            {t("featured")}
          </h2>
          <Link href="/explorar" className="text-sea text-sm font-semibold">
            {t("seeAll")}
          </Link>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {PLACES.slice(0, 4).map((p) => (
            <li key={p.slug}>
              <PlaceCard place={p} />
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/recorrido"
        className="bg-earth flex min-h-12 items-center justify-center rounded-full px-6 font-semibold text-white"
      >
        {t("buildTrip")}
      </Link>

      <p
        role="note"
        className="bg-earth-soft text-earth rounded-xl p-3 text-sm"
      >
        {t("demoNotice")}
      </p>
    </main>
  );
}
