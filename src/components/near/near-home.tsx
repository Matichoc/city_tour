"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NearPicker } from "@/components/near/near-picker";
import { useNear } from "@/lib/near-store";
import {
  FAR_FROM_COMMUNE_KM,
  formatKm,
  nearestLocality,
  rankByNearness,
  type NearCandidate,
  type NearLocality,
} from "@/lib/near";
import type { CategorySlug } from "@/content/types";

export type NearHomePlace = NearCandidate & {
  name: string;
  localityName: string | null;
  categorySlug: CategorySlug;
  image: string;
  /** Clase del marco de color de su puerta. */
  frame: string;
  /** La imagen es un logo (se muestra entera). */
  logo: boolean;
  /** La imagen es una ilustración hecha con IA (se rotula). */
  ai: boolean;
};

const GROUPS = [
  {
    key: "eat",
    categories: ["gastronomia"],
    query: { categoria: "gastronomia" },
  },
  {
    key: "sleep",
    categories: ["alojamiento"],
    query: { categoria: "alojamiento" },
  },
  {
    key: "visit",
    categories: [
      "balneario",
      "ruralidad",
      "patrimonio",
      "recreacion",
      "deportes",
    ],
    query: {},
  },
] as const satisfies readonly {
  key: string;
  categories: readonly CategorySlug[];
  query: Record<string, string>;
}[];

const PER_GROUP = 3;

/**
 * «Cerca de ti» en el inicio: para comer, para dormir y qué visitar, lo más
 * cercano a tu ubicación o al pueblo que elijas. Sin punto de partida, invita
 * a elegirlo. La ubicación se usa en el teléfono; no se envía.
 */
export function NearHome({
  places,
  localities,
}: {
  places: NearHomePlace[];
  localities: NearLocality[];
}) {
  const t = useTranslations("near");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { origin } = useNear();
  const [changing, setChanging] = useState(false);

  const groups = useMemo(
    () =>
      origin
        ? GROUPS.map((g) => ({
            ...g,
            top: rankByNearness(
              places.filter((p) =>
                (g.categories as readonly string[]).includes(p.categorySlug),
              ),
              origin,
              localities,
            ).slice(0, PER_GROUP),
          }))
        : [],
    [origin, places, localities],
  );
  const where = origin ? nearestLocality(origin, localities) : null;
  const town =
    origin?.kind === "pueblo"
      ? localities.find((l) => l.slug === origin.slug)?.name
      : null;

  return (
    <section
      aria-labelledby="cerca-de-ti"
      className="bg-sea-soft/40 border-border mt-10 rounded-3xl border p-4 sm:p-6"
      data-testid="near-home"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="cerca-de-ti"
          className="font-display text-2xl font-extrabold sm:text-3xl"
        >
          {t("homeTitle")}
        </h2>
        {origin ? (
          <p className="text-sm font-semibold">
            {origin.kind === "gps"
              ? where && where.km > FAR_FROM_COMMUNE_KM
                ? t("fromFar", { km: formatKm(where.km, locale) })
                : t("fromYou")
              : t("fromTown", { town: town ?? "" })}{" "}
            <button
              type="button"
              onClick={() => setChanging((v) => !v)}
              aria-expanded={changing}
              className="text-sea min-h-11 font-bold underline"
            >
              {t("change")}
            </button>
          </p>
        ) : null}
      </div>
      {!origin || changing ? (
        <div className="mt-2">
          {!origin ? <p className="text-muted mb-3">{t("homeIntro")}</p> : null}
          <NearPicker
            localities={localities}
            onPicked={() => setChanging(false)}
          />
        </div>
      ) : null}
      {origin ? (
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {groups.map((g) => (
            <div key={g.key} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-extrabold">
                  {t(`group.${g.key}`)}
                </h3>
                <Link
                  href={{ pathname: "/explorar", query: g.query }}
                  className="text-sea shrink-0 text-sm font-bold"
                >
                  {t("seeMore")}
                </Link>
              </div>
              {g.top.length === 0 ? (
                <p className="text-muted text-sm">{t("noneYet")}</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {g.top.map(({ item, km, approx }) => (
                    <li key={item.slug}>
                      <Link
                        href={{
                          pathname: "/lugares/[slug]",
                          params: { slug: item.slug },
                        }}
                        className="bg-surface hover:border-foreground border-border flex items-center gap-3 rounded-2xl border p-2 transition"
                      >
                        <span
                          className={`relative size-12 shrink-0 rounded-xl p-[2px] ${item.frame}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            className={`size-full rounded-[0.6rem] border-2 border-white bg-white ${
                              item.ai
                                ? "object-cover mix-blend-multiply saturate-[.3]"
                                : item.logo
                                  ? "object-contain"
                                  : "object-cover"
                            }`}
                          />
                          {/* Ilustración con IA: rótulo visible y completo para lectores. */}
                          {item.ai ? (
                            <span className="absolute right-1 bottom-1 rounded bg-black/55 px-0.5 text-[8px] leading-tight font-bold text-white">
                              <span aria-hidden="true">IA</span>
                              <span className="sr-only">
                                {tc("aiIllustration")}
                              </span>
                            </span>
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 font-bold">
                            {item.name}
                          </span>
                          <span className="text-muted block text-xs font-semibold">
                            {approx
                              ? item.localityName
                                ? t("inTown", { town: item.localityName })
                                : t("noLocation")
                              : km !== null
                                ? t("away", { distance: formatKm(km, locale) })
                                : t("noLocation")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-muted mt-3 text-xs">{t("straightLine")}</p>
    </section>
  );
}
