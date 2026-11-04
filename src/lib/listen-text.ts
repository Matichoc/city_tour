import { getTranslations } from "next-intl/server";
import type { Place, Route } from "@/lib/data";
import type { Locale } from "@/i18n/routing";
import { formatHours } from "@/lib/hours";
import { formatDuration } from "@/lib/itinerary-format";
import type { ListenSection } from "@/lib/speech";

/**
 * Lo que lee «Escuchar», en el orden en que se lee. Lo usan la página (para
 * las etiquetas y la parte en curso) y el servidor que genera el audio con
 * voz natural: así el audio dice exactamente lo que muestra la ficha.
 */
export async function placeListen(
  place: Place,
  locale: Locale,
): Promise<ListenSection[]> {
  const t = await getTranslations({ locale, namespace: "place" });
  const tl = await getTranslations({ locale, namespace: "listen" });
  const hoursWords = {
    everyDay: t("hoursEveryDay"),
    holidays: t("hoursHolidays"),
    and: t("hoursAnd"),
    allYear: t("hoursAllYear"),
    monthRange: (from: string, to: string) => t("hoursMonths", { from, to }),
  };
  const hoursSpoken = place.demo
    ? null
    : place.hours.length > 0
      ? place.hours
          .map((h) => {
            const f = formatHours(h, locale, hoursWords);
            return `${f.season}: ${f.days}, ${f.time}`;
          })
          .join("; ")
      : place.hoursText;
  const segments = [
    `${place.name}.`,
    place.localityName
      ? tl("categoryIn", {
          category: place.categoryName,
          locality: place.localityName,
        })
      : `${place.categoryName}.`,
    place.demo ? tl("demo") : null,
    place.description,
    hoursSpoken ? tl("hours", { text: hoursSpoken }) : null,
    place.address ? tl("address", { address: place.address }) : null,
    !place.demo && place.verification !== "verified"
      ? tl(place.verification)
      : null,
  ].filter((s): s is string => Boolean(s));
  return [{ segments }];
}

/** Audioguía de una ruta: la presentación y después cada parada, en orden. */
export async function routeListen(
  route: Route,
  locale: Locale,
): Promise<ListenSection[]> {
  const t = await getTranslations({ locale, namespace: "routes" });
  const tl = await getTranslations({ locale, namespace: "listen" });
  const total = route.stops.length;
  return [
    {
      label: tl("routeIntro"),
      segments: [
        `${route.name}.`,
        `${t("stops", { count: total })}${
          route.durationMinutes
            ? `, ${formatDuration(route.durationMinutes)}`
            : ""
        }.`,
        route.description,
        t("pendingNote"),
      ],
    },
    ...route.stops.map((s, i) => {
      const label = tl("stopLabel", { n: i + 1, total, name: s.place.name });
      return {
        label,
        targetId: `parada-${i + 1}`,
        segments: [
          `${label}.`,
          s.place.demo ? tl("demo") : null,
          s.place.description,
          s.notes,
        ].filter((x): x is string => Boolean(x)),
      };
    }),
  ];
}
