"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ItineraryEngine } from "@/lib/itinerary-engine";
import {
  addMinutesToClock,
  formatDuration,
  formatKm,
} from "@/lib/itinerary-format";
import { directionsUrl } from "@/lib/map-config";
import { track } from "@/lib/analytics";
import {
  EMPTY_TRIP,
  readTrip,
  removeFromTrip,
  setTrip,
  useTrip,
  type TripState,
} from "@/lib/trip-store";
import type { Place } from "@/lib/data";
import { EmptyState } from "@/components/ui/empty-state";
import { PlacesMap } from "@/components/map/places-map";
import { AddRouteToTripButton } from "@/components/trip/add-route-to-trip-button";

export type TripRouteOption = {
  slug: string;
  name: string;
  stopSlugs: string[];
};

export function TripView({
  places,
  routes,
  initial,
}: {
  places: Place[];
  routes: TripRouteOption[];
  /** Recorrido recibido por enlace compartido. */
  initial: Partial<TripState> | null;
}) {
  const t = useTranslations("trip");
  const trip = useTrip();
  const [copied, setCopied] = useState(false);
  const bySlug = useMemo(
    () => new Map(places.map((p) => [p.slug, p])),
    [places],
  );

  // Enlace compartido: si no hay recorrido guardado, se carga solo; si hay
  // uno distinto, se ofrece cargarlo (nunca se pisa en silencio).
  const shared = useMemo<TripState | null>(
    () =>
      initial?.slugs?.length
        ? {
            ...EMPTY_TRIP,
            ...initial,
            slugs: initial.slugs.filter((s) => bySlug.has(s)),
          }
        : null,
    [initial, bySlug],
  );
  const [offerDismissed, setOfferDismissed] = useState(false);
  useEffect(() => {
    if (shared && readTrip().slugs.length === 0) setTrip(shared);
    // Solo al abrir la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sharedOffer =
    shared &&
    !offerDismissed &&
    trip.slugs.length > 0 &&
    trip.slugs.join(",") !== shared.slugs.join(",")
      ? shared
      : null;

  const offerBanner = sharedOffer ? (
    <div
      role="status"
      className="border-sea bg-sea-soft flex flex-col gap-3 rounded-2xl border-2 p-4"
    >
      <p className="font-bold">
        {t("sharedTitle", { count: sharedOffer.slugs.length })}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setTrip(sharedOffer);
            setOfferDismissed(true);
          }}
          className="bg-sea min-h-11 rounded-full px-5 font-bold text-white"
        >
          {t("sharedLoad")}
        </button>
        <button
          type="button"
          onClick={() => setOfferDismissed(true)}
          className="border-sea text-sea-deep min-h-11 rounded-full border-2 px-5 font-bold"
        >
          {t("sharedKeep")}
        </button>
      </div>
    </div>
  ) : null;

  const selected = trip.slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is Place => Boolean(p));

  const itinerary = useMemo(() => {
    if (selected.length === 0) return null;
    const input = selected.map((p) => ({
      id: p.slug,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      visitDurationMinutes: p.visitMinutes > 0 ? p.visitMinutes : 30,
    }));
    if (trip.orderMode === "manual") {
      return ItineraryEngine.buildInOrder(input, undefined, trip.returnToStart);
    }
    const startIndex = Math.max(
      0,
      input.findIndex((p) => p.id === trip.start),
    );
    return ItineraryEngine.build({
      places: input,
      startIndex,
      returnToStart: trip.returnToStart,
    });
  }, [selected, trip.orderMode, trip.start, trip.returnToStart]);

  function update(patch: Partial<TripState>) {
    setTrip({ ...trip, ...patch });
  }

  function move(slug: string, dir: -1 | 1) {
    const order = itinerary
      ? itinerary.stops.map((s) => s.placeId)
      : [...trip.slugs];
    const i = order.indexOf(slug);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j]!, order[i]!];
    setTrip({ ...trip, slugs: order, orderMode: "manual" });
  }

  async function copyLink() {
    const order = itinerary
      ? itinerary.stops.map((s) => s.placeId)
      : trip.slugs;
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("l", order.join(","));
    url.searchParams.set("h", trip.startTime);
    if (trip.returnToStart) url.searchParams.set("v", "1");
    try {
      if (navigator.share)
        await navigator.share({ title: t("shareTitle"), url: url.toString() });
      else {
        await navigator.clipboard.writeText(url.toString());
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelado */
    }
  }

  if (!itinerary || selected.length === 0) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6">
        <EmptyState title={t("emptyTitle")}>
          <p>{t("emptyBody")}</p>
          <Link
            href="/explorar"
            className="bg-sea mt-3 inline-flex min-h-11 items-center rounded-full px-5 font-bold text-white"
          >
            {t("goExplore")}
          </Link>
        </EmptyState>
        {routes.length > 0 ? (
          <section aria-labelledby="sugeridas">
            <h2 id="sugeridas" className="font-display text-xl font-extrabold">
              {t("suggested")}
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {routes.map((r) => (
                <li
                  key={r.slug}
                  className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
                >
                  <span className="font-bold">{r.name}</span>
                  <AddRouteToTripButton slugs={r.stopSlugs} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  const ordered = itinerary.stops.map((s) => ({
    stop: s,
    place: bySlug.get(s.placeId)!,
  }));
  const markers = ordered.map(({ place }, i) => ({
    slug: place.slug,
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    category: place.categorySlug,
    order: i + 1,
  }));

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      {offerBanner}
      <section
        aria-label={t("options")}
        className="border-border bg-surface grid gap-3 rounded-2xl border p-4 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1 text-sm font-bold">
          {t("startTime")}
          <input
            type="time"
            value={trip.startTime}
            onChange={(e) => update({ startTime: e.target.value || "10:00" })}
            className="border-border bg-background min-h-11 rounded-xl border px-3 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          {t("startPlace")}
          <select
            value={trip.start ?? ""}
            disabled={trip.orderMode === "manual"}
            onChange={(e) => update({ start: e.target.value || null })}
            className="border-border bg-background min-h-11 rounded-xl border px-3 font-normal disabled:opacity-50"
          >
            <option value="">{t("startAuto")}</option>
            {selected.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={trip.returnToStart}
            onChange={(e) => update({ returnToStart: e.target.checked })}
            className="size-5 accent-[#0b7285]"
          />
          {t("returnToStart")}
        </label>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold">
            {trip.orderMode === "auto" ? t("orderAuto") : t("orderManual")}
          </span>
          {trip.orderMode === "manual" ? (
            <button
              type="button"
              onClick={() => update({ orderMode: "auto" })}
              className="border-sea text-sea-deep min-h-11 rounded-full border-2 px-4 font-bold"
            >
              {t("optimize")}
            </button>
          ) : null}
        </div>
      </section>

      <section
        aria-label={t("summary")}
        className="grid grid-cols-3 gap-2 text-center"
      >
        {[
          [t("totalTime"), formatDuration(itinerary.totalDurationMinutes)],
          [t("totalDistance"), formatKm(itinerary.totalDistanceKm)],
          [t("stops"), String(ordered.length)],
        ].map(([label, value]) => (
          <div key={label} className="bg-sea-soft rounded-2xl p-3">
            <p className="font-display text-sea-deep text-xl font-extrabold">
              {value}
            </p>
            <p className="text-muted text-xs font-semibold">{label}</p>
          </div>
        ))}
      </section>

      <PlacesMap markers={markers} connect className="h-72" />

      <ol className="flex flex-col gap-3">
        {ordered.map(({ stop, place }, i) => {
          const arrive = addMinutesToClock(
            trip.startTime,
            stop.arrivalOffsetMinutes,
          );
          const leave = addMinutesToClock(
            trip.startTime,
            stop.departureOffsetMinutes,
          );
          return (
            <li
              key={place.slug}
              className="rise-in border-border bg-surface rounded-2xl border p-4 shadow-sm"
              style={{ "--i": i } as React.CSSProperties}
            >
              {i > 0 ? (
                <p className="text-muted mb-2 text-xs font-semibold">
                  ↓{" "}
                  {t("travel", {
                    time: formatDuration(stop.travelFromPreviousMinutes),
                    distance: formatKm(stop.distanceFromPreviousKm),
                  })}
                </p>
              ) : null}
              <div className="flex items-start gap-3">
                <span className="bg-sea grid size-9 shrink-0 place-items-center rounded-full font-extrabold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={{
                      pathname: "/lugares/[slug]",
                      params: { slug: place.slug },
                    }}
                    className="font-display text-lg leading-snug font-extrabold hover:underline"
                  >
                    {place.name}
                  </Link>
                  <p className="text-muted text-sm">
                    {arrive}–{leave} ·{" "}
                    {formatDuration(stop.visitDurationMinutes)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={directionsUrl(place.latitude, place.longitude)}
                      onClick={() =>
                        track("navigate_click", { slug: place.slug })
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-coral text-coral-ink inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold"
                    >
                      {t("directions")}
                    </a>
                    <button
                      type="button"
                      onClick={() => move(place.slug, -1)}
                      disabled={i === 0}
                      aria-label={t("moveUp", { name: place.name })}
                      className="border-border grid size-11 place-items-center rounded-full border disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(place.slug, 1)}
                      disabled={i === ordered.length - 1}
                      aria-label={t("moveDown", { name: place.name })}
                      className="border-border grid size-11 place-items-center rounded-full border disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromTrip(place.slug)}
                      className="border-border text-muted hover:text-foreground min-h-11 rounded-full border px-4 text-sm font-bold"
                    >
                      {t("remove")}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {itinerary.returnLegDurationMinutes ? (
        <p className="text-muted text-sm font-semibold">
          ↩{" "}
          {t("returnLeg", {
            time: formatDuration(itinerary.returnLegDurationMinutes),
            distance: formatKm(itinerary.returnLegDistanceKm ?? 0),
          })}
        </p>
      ) : null}

      <p className="bg-earth-soft text-earth rounded-xl p-3 text-sm">
        {t("estimateNote")}
      </p>

      <button
        type="button"
        onClick={copyLink}
        className="bg-sea min-h-12 rounded-full px-6 font-bold text-white transition hover:brightness-110 active:scale-95"
      >
        {copied ? t("copied") : t("shareTrip")}
      </button>
    </div>
  );
}
