"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { addManyToTrip } from "@/lib/trip-store";
import { track } from "@/lib/analytics";

export function AddRouteToTripButton({
  route,
  slugs,
}: {
  /** Ruta que se agrega (para las métricas). */
  route?: string;
  slugs: string[];
}) {
  const t = useTranslations("trip");
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        addManyToTrip(slugs);
        track("add_route", {
          ...(route ? { slug: route } : {}),
          stops: slugs.length,
        });
        router.push("/recorrido");
      }}
      className="bg-coral min-h-12 rounded-full px-6 font-bold text-white shadow-sm transition hover:brightness-105 active:scale-95"
    >
      {t("addRoute")}
    </button>
  );
}
