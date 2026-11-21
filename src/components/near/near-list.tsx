"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { NearPicker } from "@/components/near/near-picker";
import { setSortNear, useNear } from "@/lib/near-store";
import {
  FAR_FROM_COMMUNE_KM,
  formatKm,
  nearestLocality,
  rankByNearness,
  type NearCandidate,
  type NearLocality,
} from "@/lib/near";

export type NearListItem = NearCandidate & {
  localityName: string | null;
  /** La fila ya armada en el servidor (`PlaceRow`). */
  node: ReactNode;
};

/**
 * Lista de Explorar con «Sugeridos» (el orden de la guía) o «Más cerca» (desde
 * tu ubicación o un pueblo). Cada fila dice a cuánto está, en línea recta; las
 * fichas sin coordenadas dicen en qué pueblo están, sin inventar distancia.
 */
export function NearList({
  items,
  localities,
  label,
  hidden,
}: {
  items: NearListItem[];
  localities: NearLocality[];
  label: string;
  /** En el celular, la lista se oculta cuando se mira el mapa. */
  hidden?: boolean;
}) {
  const t = useTranslations("near");
  const locale = useLocale();
  const { origin, sortNear } = useNear();
  const near = sortNear && origin !== null;
  // El selector se abre al pedir «Más cerca» sin punto de partida, o al «Cambiar».
  const [ask, setAsk] = useState(false);
  const askOpen = ask || (sortNear && !origin);

  const ranked = useMemo(
    () =>
      near
        ? rankByNearness(items, origin, localities)
        : items.map((item) => ({ item, km: null, approx: false })),
    [near, items, origin, localities],
  );
  const where = origin ? nearestLocality(origin, localities) : null;
  const originName =
    origin?.kind === "pueblo"
      ? localities.find((l) => l.slug === origin.slug)?.name
      : null;

  const seg = (on: boolean) =>
    `flex min-h-11 items-center px-4 text-sm font-bold transition ${
      on ? "bg-foreground text-white" : "text-muted hover:text-foreground"
    }`;

  return (
    <div className={hidden ? "hidden lg:block" : ""}>
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold" id="orden-lista">
            {t("sortLabel")}
          </span>
          <div
            role="group"
            aria-labelledby="orden-lista"
            className="border-foreground flex overflow-hidden rounded-full border-2"
          >
            <button
              type="button"
              aria-pressed={!near}
              onClick={() => setSortNear(false)}
              className={seg(!near)}
            >
              {t("suggested")}
            </button>
            <button
              type="button"
              aria-pressed={near}
              aria-expanded={origin ? undefined : askOpen}
              aria-controls={origin ? undefined : "elegir-cerca"}
              onClick={() => (origin ? setSortNear(true) : setAsk(true))}
              className={seg(near)}
              data-testid="sort-near"
            >
              {t("nearest")}
            </button>
          </div>
          {near ? (
            <p className="text-sm font-semibold" data-testid="near-from">
              {origin.kind === "gps"
                ? where && where.km > FAR_FROM_COMMUNE_KM
                  ? t("fromFar", {
                      km: formatKm(where.km, locale),
                    })
                  : t("fromYou")
                : t("fromTown", { town: originName ?? "" })}
            </p>
          ) : null}
        </div>
        {near && !askOpen ? (
          <button
            type="button"
            onClick={() => setAsk(true)}
            className="text-sea min-h-11 self-start text-sm font-bold underline"
          >
            {t("change")}
          </button>
        ) : null}
        {askOpen ? (
          <div id="elegir-cerca" className="bg-soft rounded-2xl p-3">
            <p className="mb-2 text-sm font-bold">{t("pickTitle")}</p>
            <NearPicker
              localities={localities}
              onPicked={() => setAsk(false)}
            />
          </div>
        ) : null}
      </div>
      <ul aria-label={label} aria-describedby={near ? "nota-cerca" : undefined}>
        {ranked.map(({ item, km, approx }) => (
          <li
            key={item.slug}
            className={`relative ${near ? "[&_h2]:pr-32" : ""}`}
          >
            {item.node}
            {near ? (
              <span
                data-testid="near-distance"
                className="bg-soft text-foreground pointer-events-none absolute top-3 right-1 rounded-full px-2.5 py-1 text-xs leading-tight font-extrabold whitespace-nowrap"
              >
                {approx
                  ? item.localityName
                    ? t("inTown", { town: item.localityName })
                    : t("noLocation")
                  : km !== null
                    ? formatKm(km, locale)
                    : t("noLocation")}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {near ? (
        <p id="nota-cerca" className="text-muted mt-3 text-xs">
          {t("straightLine")}
        </p>
      ) : null}
    </div>
  );
}
