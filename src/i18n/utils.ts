import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

/** Valida el `locale` de la ruta dinámica y lo angosta a `Locale`, o 404. */
export function resolveLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return locale;
}
