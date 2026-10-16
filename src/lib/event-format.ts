import type { EventItem } from "@/lib/data";

/** Nombre del mes en el idioma del visitante (UTC para que no dependa de la zona horaria). */
export function monthName(
  locale: string,
  month: number,
  style: "long" | "short",
): string {
  return new Intl.DateTimeFormat(locale, {
    month: style,
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(2000, month - 1, 1)))
    .replace(".", "");
}

type T = (key: string, values?: Record<string, string | number>) => string;

/** «Cada año el 26 de noviembre», «Cada año en julio», «En verano», «Fecha por confirmar». */
export function eventWhen(t: T, locale: string, e: EventItem): string {
  if (e.month && e.day)
    return t("onDate", {
      day: e.day,
      month: monthName(locale, e.month, "long"),
    });
  if (e.month)
    return t("inMonth", { month: monthName(locale, e.month, "long") });
  return e.season === "summer" ? t("summer") : t("toConfirm");
}
