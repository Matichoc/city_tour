"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  locateMe,
  setNearOrigin,
  useNear,
  type GpsResult,
} from "@/lib/near-store";
import type { NearLocality } from "@/lib/near";

/**
 * Elige desde dónde buscar lo cercano: la ubicación del teléfono o un pueblo
 * de la comuna (sirve también a quien todavía va en camino).
 */
export function NearPicker({
  localities,
  compact = false,
  onPicked,
}: {
  localities: NearLocality[];
  compact?: boolean;
  /** Se llama cuando ya hay punto de partida (para cerrar el selector). */
  onPicked?: () => void;
}) {
  const t = useTranslations("near");
  const { origin } = useNear();
  const [busy, setBusy] = useState(false);
  const [gps, setGps] = useState<GpsResult | null>(null);

  const askGps = async () => {
    setBusy(true);
    setGps(null);
    const r = await locateMe();
    setGps(r);
    setBusy(false);
    if (r === "ok") onPicked?.();
  };

  const chip = (on: boolean) =>
    `inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition ${
      on
        ? "border-foreground bg-foreground text-white"
        : "border-border hover:border-foreground"
    }`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={askGps}
          disabled={busy}
          aria-pressed={origin?.kind === "gps"}
          className={`${chip(origin?.kind === "gps")} ${busy ? "opacity-70" : ""}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="7.5" />
          </svg>
          {busy ? t("locating") : t("useLocation")}
        </button>
        {!compact ? (
          <span className="text-muted text-sm font-semibold">
            {t("orFrom")}
          </span>
        ) : null}
        {localities.map((l) => {
          const on = origin?.kind === "pueblo" && origin.slug === l.slug;
          return (
            <button
              key={l.slug}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setNearOrigin({
                  kind: "pueblo",
                  slug: l.slug,
                  latitude: l.latitude,
                  longitude: l.longitude,
                });
                onPicked?.();
              }}
              className={chip(on)}
            >
              {l.name}
            </button>
          );
        })}
      </div>
      <p role="status" className="text-muted text-xs">
        {gps === "denied"
          ? t("denied")
          : gps === "unavailable"
            ? t("unavailable")
            : t("privacy")}
      </p>
    </div>
  );
}
