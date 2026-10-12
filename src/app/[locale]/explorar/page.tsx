import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  CATEGORIES,
  isCategorySlug,
  listPlaces,
  localize,
} from "@/lib/demo-data";
import { PlaceCard } from "@/components/place/place-card";

export default function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const { categoria } = use(searchParams);
  const active = isCategorySlug(categoria) ? categoria : undefined;
  const places = listPlaces(active);
  const t = useTranslations("explore");
  const current = useLocale() as Locale;

  const chip = (selected: boolean) =>
    `flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${
      selected
        ? "border-sea bg-sea text-sea-foreground"
        : "border-border bg-surface"
    }`;

  return (
    <main className="flex flex-col gap-4 px-4 py-6">
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/explorar"
            aria-current={!active ? "true" : undefined}
            className={chip(!active)}
          >
            {t("all")}
          </Link>
        </li>
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link
              href={{ pathname: "/explorar", query: { categoria: c.slug } }}
              aria-current={active === c.slug ? "true" : undefined}
              className={chip(active === c.slug)}
            >
              {localize(c.name, current)}
            </Link>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="text-muted text-sm">
        {t("results", { count: places.length })}
      </p>
      {places.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed p-6 text-center">
          <p>{t("empty")}</p>
          <Link
            href="/explorar"
            className="text-sea mt-2 inline-block font-semibold"
          >
            {t("clear")}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {places.map((p) => (
            <li key={p.slug}>
              <PlaceCard place={p} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
