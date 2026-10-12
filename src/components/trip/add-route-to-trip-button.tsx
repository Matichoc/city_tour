"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { addManyToTrip } from "@/lib/trip-store";

export function AddRouteToTripButton({ slugs }: { slugs: string[] }) {
  const t = useTranslations("trip");
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        addManyToTrip(slugs);
        router.push("/recorrido");
      }}
      className="bg-coral text-coral-ink min-h-12 rounded-full px-6 font-bold shadow-sm transition hover:brightness-105 active:scale-95"
    >
      {t("addRoute")}
    </button>
  );
}
