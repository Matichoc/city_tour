"use client";

import { useTranslations } from "next-intl";
import { addToTrip, removeFromTrip, useTrip } from "@/lib/trip-store";
import { track } from "@/lib/analytics";

export function AddToTripButton({
  slug,
  className = "",
  variant = "pill",
}: {
  slug: string;
  className?: string;
  /** "tile": ícono con el texto debajo (fila de acciones de la ficha). */
  variant?: "pill" | "tile";
}) {
  const t = useTranslations("trip");
  const trip = useTrip();
  const inTrip = trip.slugs.includes(slug);
  if (variant === "tile")
    return (
      <button
        type="button"
        aria-pressed={inTrip}
        onClick={() => {
          if (inTrip) removeFromTrip(slug);
          else {
            addToTrip(slug);
            track("add_to_trip", { slug });
          }
        }}
        className={`bg-soft hover:bg-border flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs font-semibold transition active:scale-95 ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={inTrip ? "m5 12 5 5 9-10" : "M12 5v14M5 12h14"} />
        </svg>
        {inTrip ? t("addedShort") : t("addShort")}
      </button>
    );
  return (
    <button
      type="button"
      aria-pressed={inTrip}
      onClick={() => {
        if (inTrip) removeFromTrip(slug);
        else {
          addToTrip(slug);
          track("add_to_trip", { slug });
        }
      }}
      className={`min-h-11 rounded-full px-5 text-sm font-bold transition active:scale-95 ${
        inTrip
          ? "border-sea bg-sea-soft text-sea-deep border-2"
          : "bg-coral text-white shadow-sm hover:brightness-105"
      } ${className}`}
    >
      {inTrip ? `✓ ${t("added")}` : `+ ${t("add")}`}
    </button>
  );
}
