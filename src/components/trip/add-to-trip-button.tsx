"use client";

import { useTranslations } from "next-intl";
import { addToTrip, removeFromTrip, useTrip } from "@/lib/trip-store";

export function AddToTripButton({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  const t = useTranslations("trip");
  const trip = useTrip();
  const inTrip = trip.slugs.includes(slug);
  return (
    <button
      type="button"
      aria-pressed={inTrip}
      onClick={() => (inTrip ? removeFromTrip(slug) : addToTrip(slug))}
      className={`min-h-11 rounded-full px-5 text-sm font-bold transition active:scale-95 ${
        inTrip
          ? "border-sea bg-sea-soft text-sea-deep border-2"
          : "bg-coral text-coral-ink shadow-sm hover:brightness-105"
      } ${className}`}
    >
      {inTrip ? `✓ ${t("added")}` : `+ ${t("add")}`}
    </button>
  );
}
