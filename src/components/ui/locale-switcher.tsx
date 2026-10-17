"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { useDismiss } from "@/lib/use-dismiss";

const NAME: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

/**
 * Selector de idioma: un botón redondo con el globo y el código ("ES") que abre
 * un menú pequeño con los tres idiomas. Conserva la página actual al cambiar.
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("nav");
  const current = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), root, trigger);

  function change(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    router.replace(
      // @ts-expect-error -- pathname y params siempre coinciden en runtime
      { pathname, params },
      { locale },
    );
  }

  function onMenuKey(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
    );
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "ArrowDown"
        ? (i + 1) % items.length
        : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t("language")}: ${NAME[current]}`}
        className="text-sea-deep hover:bg-sea-soft inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-extrabold transition"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
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
        <span className="uppercase" aria-hidden="true">
          {current}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul
          onKeyDown={onMenuKey}
          className="border-border bg-surface absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border p-1.5 shadow-xl"
        >
          {routing.locales.map((locale) => (
            <li key={locale}>
              <button
                type="button"
                autoFocus={locale === current}
                onClick={() => change(locale)}
                aria-current={locale === current ? "true" : undefined}
                lang={locale}
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-bold transition ${
                  locale === current
                    ? "bg-sea-soft text-sea-deep"
                    : "hover:bg-sea-soft/60"
                }`}
              >
                <span>{NAME[locale]}</span>
                {locale === current ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                ) : (
                  <span
                    className="text-muted text-xs uppercase"
                    aria-hidden="true"
                  >
                    {locale}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
