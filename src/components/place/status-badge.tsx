import { useTranslations } from "next-intl";
import type { Place } from "@/lib/demo-data";

const STYLE = {
  pending: "bg-earth-soft text-earth",
  verified: "bg-hill-soft text-hill",
  outdated: "bg-border text-muted",
} as const;

export function StatusBadge({ place }: { place: Place }) {
  const t = useTranslations("place");
  return (
    <span className="flex flex-wrap gap-2">
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[place.verification]}`}
      >
        {t(place.verification)}
      </span>
      {place.fictitious ? (
        <span className="bg-sea-soft text-sea rounded-full px-2.5 py-1 text-xs font-semibold">
          {t("fictitious")}
        </span>
      ) : null}
    </span>
  );
}
