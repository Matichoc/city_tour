"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocale, useTranslations } from "next-intl";
import type { CategorySlug } from "@/content/types";
import { CATEGORY_PIN_COLOR, getMapStyleUrl } from "@/lib/map-config";
import {
  demoStepMeters,
  distanceMeters,
  formatMeters,
  isArrived,
  isShortWalk,
  moveToward,
  offsetPoint,
  walkMinutes,
} from "@/lib/live-nav";
import { track } from "@/lib/analytics";
import { WalkCamera, type LivePosition } from "@/components/trip/walk-camera";

export type LiveStop = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  category: CategorySlug;
};

type GeoStatus = "waiting" | "ok" | "denied" | "unavailable";

function walkingUrl(from: LivePosition | null, to: LiveStop): string {
  const origin = from ? `&origin=${from.latitude},${from.longitude}` : "";
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${to.latitude},${to.longitude}&travelmode=walking`;
}

/**
 * Recorrido en vivo: sigue tu ubicación (GPS del teléfono, nunca se envía a
 * ningún servidor), indica la próxima parada con distancia y minutos a pie, y
 * marca la llegada. Las distancias son en línea recta.
 */
export function LiveTrip({
  stops,
  demo = false,
  onClose,
}: {
  stops: LiveStop[];
  /** Ubicación simulada: sirve para probar sin estar en Papudo. */
  demo?: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("live");
  const locale = useLocale();
  const mapRef = useRef<MapRef>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("waiting");
  const [index, setIndex] = useState(0);
  const [follow, setFollow] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const mapLoaded = useRef(false);

  const next = index < stops.length ? stops[index]! : null;
  const distance = position && next ? distanceMeters(position, next) : null;
  const arrived =
    distance !== null && isArrived(distance, position?.accuracy ?? 0);

  // Si hay otra parada pendiente mucho más cerca que la próxima (el recorrido
  // parte por la primera de la lista, no por la más cercana), se ofrece
  // empezar por ahí.
  const nearest = (() => {
    if (!position || !next || arrived) return null;
    let best: { i: number; meters: number } | null = null;
    for (let i = index + 1; i < stops.length; i++) {
      const meters = distanceMeters(position, stops[i]!);
      if (!best || meters < best.meters) best = { i, meters };
    }
    return best &&
      distance !== null &&
      isShortWalk(best.meters) &&
      best.meters < distance
      ? best
      : null;
  })();

  // Modo demostración: parte a ~500 m de la primera parada y "camina" hacia la
  // próxima. Nunca se pide ni se usa el GPS real.
  const target = next;
  useEffect(() => {
    if (!demo) return;
    const first = stops[0];
    if (first) {
      const p = offsetPoint(first, 200, 500);
      queueMicrotask(() => {
        setStatus("ok");
        setPosition((prev) => prev ?? { ...p, accuracy: 8, course: null });
      });
    }
    if (!target) return;
    const id = window.setInterval(() => {
      setPosition((prev) => {
        if (!prev) return prev;
        const step = demoStepMeters(distanceMeters(prev, target));
        const moved = moveToward(prev, target, step);
        return { ...prev, ...moved };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [demo, stops, target]);

  // GPS del teléfono.
  useEffect(() => {
    if (demo) return;
    if (!("geolocation" in navigator)) {
      queueMicrotask(() => setStatus("unavailable"));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setStatus("ok");
        setPosition({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
          course:
            typeof p.coords.heading === "number" &&
            !Number.isNaN(p.coords.heading) &&
            (p.coords.speed ?? 0) > 0.5
              ? p.coords.heading
              : null,
        });
      },
      (err) =>
        setStatus(
          err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        ),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [demo]);

  // Pantalla encendida mientras dura el recorrido (si el navegador lo permite).
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => {
        lock = l;
      })
      .catch(() => undefined);
    return () => {
      void lock?.release().catch(() => undefined);
    };
  }, []);

  // Vibración al llegar a una parada.
  const wasArrived = useRef(false);
  useEffect(() => {
    if (arrived && !wasArrived.current) navigator.vibrate?.([120, 60, 120]);
    wasArrived.current = arrived;
  }, [arrived]);

  // La cámara sigue al usuario hasta que mueve el mapa.
  useEffect(() => {
    if (!follow || !position) return;
    mapRef.current?.easeTo({
      center: [position.longitude, position.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 15),
      duration: 800,
    });
  }, [follow, position]);

  // Foco, Escape y sin scroll del fondo.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !cameraOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, cameraOpen]);

  const route = useMemo(
    () => ({
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: stops.map((s) => [s.longitude, s.latitude]),
      },
    }),
    [stops],
  );
  const toNext = useMemo(
    () =>
      position && next
        ? {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: [
                [position.longitude, position.latitude],
                [next.longitude, next.latitude],
              ],
            },
          }
        : null,
    [position, next],
  );

  const closeCamera = useCallback(() => setCameraOpen(false), []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-title"
      className="bg-background fixed inset-0 z-[60] flex flex-col"
    >
      <header className="border-border bg-surface flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2
            id="live-title"
            className="font-display text-xl leading-tight font-extrabold"
          >
            {t("title")}
          </h2>
          <p className="text-muted text-xs">
            {t("progress", {
              done: Math.min(index, stops.length),
              total: stops.length,
            })}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="border-border min-h-11 shrink-0 rounded-full border-2 px-4 text-sm font-extrabold"
        >
          {t("end")}
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        {mapFailed ? (
          <p
            role="status"
            className="text-muted grid h-full place-items-center p-6 text-center text-sm"
          >
            {t("mapUnavailable")}
          </p>
        ) : (
          <Map
            ref={mapRef}
            mapStyle={getMapStyleUrl()}
            initialViewState={{
              latitude: stops[0]?.latitude ?? 0,
              longitude: stops[0]?.longitude ?? 0,
              zoom: 14,
            }}
            onDragStart={() => setFollow(false)}
            onLoad={() => {
              mapLoaded.current = true;
            }}
            // Solo si el estilo nunca cargó se oculta el mapa; un tile suelto no.
            onError={() => {
              if (!mapLoaded.current) setMapFailed(true);
            }}
            attributionControl={{ compact: true }}
            style={{ width: "100%", height: "100%" }}
          >
            {stops.length > 1 ? (
              <Source id="live-route" type="geojson" data={route}>
                <Layer
                  id="live-route-line"
                  type="line"
                  paint={{
                    "line-color": "#0b7285",
                    "line-width": 3,
                    "line-opacity": 0.45,
                    "line-dasharray": [1.5, 1.5],
                  }}
                  layout={{ "line-cap": "round" }}
                />
              </Source>
            ) : null}
            {toNext ? (
              <Source id="live-next" type="geojson" data={toNext}>
                <Layer
                  id="live-next-line"
                  type="line"
                  paint={{ "line-color": "#ff7a59", "line-width": 4 }}
                  layout={{ "line-cap": "round" }}
                />
              </Source>
            ) : null}
            {stops.map((s, i) => (
              <Marker
                key={s.slug}
                latitude={s.latitude}
                longitude={s.longitude}
                anchor="bottom"
              >
                <span
                  title={s.name}
                  style={{
                    background:
                      i < index ? "#7c8b8f" : CATEGORY_PIN_COLOR[s.category],
                  }}
                  className={`grid size-9 [transform:rotate(-45deg)] place-items-center rounded-full rounded-bl-none border-2 border-white text-sm font-extrabold text-white shadow-lg ${
                    i === index ? "ring-coral ring-4" : ""
                  }`}
                >
                  <span className="[transform:rotate(45deg)]">
                    {i < index ? "✓" : i + 1}
                  </span>
                </span>
              </Marker>
            ))}
            {position ? (
              <Marker
                latitude={position.latitude}
                longitude={position.longitude}
                anchor="center"
              >
                <span className="relative grid size-6 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#2b7fff]/40 motion-reduce:animate-none" />
                  <span className="relative size-4 rounded-full border-[3px] border-white bg-[#2b7fff] shadow" />
                </span>
              </Marker>
            ) : null}
          </Map>
        )}
        {!follow && position ? (
          <button
            type="button"
            onClick={() => setFollow(true)}
            className="text-sea-deep absolute top-3 right-3 min-h-11 rounded-full bg-white px-4 text-sm font-extrabold shadow-lg"
          >
            {t("recenter")}
          </button>
        ) : null}
      </div>

      <section
        aria-live="polite"
        className="border-border bg-surface flex flex-col gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {demo ? (
          <p className="bg-sea-soft text-sea-deep rounded-xl p-3 text-sm font-bold">
            {t("demoBanner")}
          </p>
        ) : null}
        {status === "denied" || status === "unavailable" ? (
          <p className="bg-earth-soft text-earth rounded-xl p-3 text-sm">
            {status === "denied" ? t("gpsDenied") : t("gpsUnavailable")}
          </p>
        ) : status === "waiting" ? (
          <p className="text-muted text-sm">{t("waitingGps")}</p>
        ) : null}

        {nearest ? (
          <div className="bg-sea-soft flex flex-col gap-2 rounded-xl p-3">
            <p className="text-sm font-bold">
              {t("nearestHint", {
                name: stops[nearest.i]!.name,
                distance: formatMeters(nearest.meters, locale),
              })}
            </p>
            <button
              type="button"
              onClick={() => setIndex(nearest.i)}
              className="bg-sea min-h-11 self-start rounded-full px-5 text-sm font-extrabold text-white"
            >
              {t("nearestGo", { name: stops[nearest.i]!.name })}
            </button>
          </div>
        ) : null}

        {next ? (
          <>
            <div>
              <p className="text-field text-xs font-bold tracking-wide uppercase">
                {arrived ? t("arrivedKicker") : t("nextStop", { n: index + 1 })}
              </p>
              <p className="font-display text-2xl leading-tight font-extrabold">
                {next.name}
              </p>
              {distance !== null ? (
                <p className="text-muted text-sm">
                  {arrived
                    ? t("arrived", { name: next.name })
                    : t("distance", {
                        distance: formatMeters(distance, locale),
                        minutes: walkMinutes(distance),
                      })}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {arrived ? (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  className="bg-sea min-h-12 rounded-full px-6 font-extrabold text-white"
                >
                  {index + 1 < stops.length ? t("goNext") : t("finish")}
                </button>
              ) : (
                <>
                  {distance !== null ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCameraOpen(true);
                        track("camera_start", { slug: next.slug });
                      }}
                      className={
                        isShortWalk(distance)
                          ? "bg-coral text-coral-ink min-h-12 rounded-full px-5 font-extrabold shadow-sm"
                          : "border-coral text-coral-ink min-h-12 rounded-full border-2 px-5 font-bold"
                      }
                    >
                      📷{" "}
                      {isShortWalk(distance) ? t("cameraOpen") : t("cameraFar")}
                    </button>
                  ) : null}
                  <a
                    href={walkingUrl(position, next)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("navigate_click", { slug: next.slug })}
                    className="bg-sea inline-flex min-h-12 items-center rounded-full px-5 font-bold text-white"
                  >
                    {t("openMaps")}
                  </a>
                  <button
                    type="button"
                    onClick={() => setIndex((i) => i + 1)}
                    className="border-border min-h-12 rounded-full border-2 px-4 text-sm font-bold"
                  >
                    {index + 1 < stops.length ? t("skip") : t("finish")}
                  </button>
                </>
              )}
            </div>
            <p className="text-muted text-xs">{t("straightLineNote")}</p>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-display text-2xl font-extrabold">
              🎉 {t("done")}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="bg-sea min-h-12 self-start rounded-full px-6 font-extrabold text-white"
            >
              {t("backToTrip")}
            </button>
          </div>
        )}
      </section>

      {cameraOpen && next ? (
        <WalkCamera target={next} position={position} onClose={closeCamera} />
      ) : null}
    </div>
  );
}
