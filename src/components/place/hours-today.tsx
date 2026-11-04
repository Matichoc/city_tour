"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { PlaceHours } from "@/content/types";
import { hoursStatus } from "@/lib/hours";

const noop = () => () => {};

/**
 * «Abierto ahora, hasta las 19:00» / «Cerrado ahora. Abre el sábado a las
 * 10:00». La ficha se genera de antemano, así que la hora se mira en el
 * navegador (en Chile): en el servidor no se muestra nada.
 */
export function HoursToday({ hours }: { hours: PlaceHours[] }) {
  const t = useTranslations("place");
  const locale = useLocale();
  const status = useSyncExternalStore(
    noop,
    () => JSON.stringify(hoursStatus(hours)),
    () => "null",
  );
  const s = JSON.parse(status) as ReturnType<typeof hoursStatus>;
  if (!s) return null;

  const weekday = (d: number) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, 7 + d)));
  const open = s.kind === "open";
  const text =
    s.kind === "open"
      ? t("todayOpen", { time: s.closes })
      : s.kind === "later"
        ? t("todayLater", { time: s.opens })
        : !s.next
          ? t("todayClosed")
          : s.next.inDays === 1
            ? t("todayTomorrow", { time: s.next.opens })
            : t("todayOn", {
                day: weekday(s.next.weekday),
                time: s.next.opens,
              });

  return (
    <p className="flex items-start gap-2 text-sm">
      <span
        aria-hidden="true"
        className={`mt-1.5 size-2.5 shrink-0 rounded-full ${open ? "bg-field" : "bg-earth"}`}
      />
      <span>
        <b className={open ? "text-field-deep" : "text-earth"}>{text}</b>
        <span className="text-muted block text-xs">{t("todayNote")}</span>
      </span>
    </p>
  );
}
