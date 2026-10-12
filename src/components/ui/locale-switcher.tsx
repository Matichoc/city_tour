"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/** Selector "ES | EN": conserva la página actual al cambiar de idioma. */
export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const current = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function change(locale: Locale) {
    router.replace(
      // @ts-expect-error -- pathname y params siempre coinciden en runtime
      { pathname, params },
      { locale },
    );
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="border-border flex overflow-hidden rounded-full border text-sm font-semibold"
    >
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => change(locale)}
          aria-pressed={locale === current}
          className={`min-h-9 min-w-11 px-3 uppercase ${
            locale === current
              ? "bg-sea text-sea-foreground"
              : "text-muted hover:bg-sea-soft"
          }`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
