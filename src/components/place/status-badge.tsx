import { useTranslations } from "next-intl";
import type { Place } from "@/lib/data";

const STYLE = {
  pending: "bg-earth-soft text-earth",
  verified: "bg-field-soft text-field-deep",
  outdated: "bg-border text-muted",
} as const;

export function StatusBadge({
  verification,
}: {
  verification: Place["verification"];
}) {
  const t = useTranslations("place");
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STYLE[verification]}`}
    >
      {t(verification)}
    </span>
  );
}
