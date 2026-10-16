"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LABEL: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

/**
 * Selector de idioma como lista desplegable. Conserva la página actual al
 * cambiar de idioma. Es un <select> nativo: accesible y cómodo en el celular.
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
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
    <label
      className={`border-border bg-surface hover:border-sea relative inline-flex min-h-11 items-center gap-2 rounded-full border-2 pr-9 pl-3 text-sm font-extrabold transition ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="text-sea size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.8 2.6 4 5.6 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.6-4-9s1.2-6.4 4-9z" />
      </svg>
      <span className="sr-only">{t("language")}</span>
      <select
        value={current}
        onChange={(e) => change(e.target.value as Locale)}
        className="text-foreground min-h-11 cursor-pointer appearance-none bg-transparent pr-1 outline-none"
      >
        {routing.locales.map((locale) => (
          <option key={locale} value={locale}>
            {LABEL[locale]}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="text-sea pointer-events-none absolute right-3 size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
