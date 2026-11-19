"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { labelMarker, useMapLocale } from "@/components/map/map-locale";
import { IllustratedImage } from "@/components/ui/illustrated-image";
import type { CategorySlug } from "@/content/types";
import type { Picture } from "@/lib/data";
import {
  CATEGORY_PIN_COLOR,
  MAP_CENTER,
  TERRAIN_ATTRIBUTION,
  getMapStyleUrl,
  getTerrainTilesUrl,
} from "@/lib/map-config";

export type CommunePlace = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  category: CategorySlug;
  /** Para la tarjeta del recorrido automático. */
  categoryName?: string;
  short?: string;
  picture?: Picture;
};

export type CommuneLocality = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
};

type Selected =
  | { kind: "place"; item: CommunePlace }
  | { kind: "locality"; item: CommuneLocality };

/** Límite de cámara: la comuna de Papudo con margen (no es el límite oficial). */
const COMMUNE_VIEW_BOUNDS: [number, number, number, number] = [
  -71.65, -32.62, -71.15, -32.3,
];
const PITCH_3D = 62;
const BEARING_3D = -28;
/** Recorrido automático: cuánto se queda en cada lugar y cómo lo mira. */
const TOUR_STEP_MS = 7000;
const TOUR_FLY_MS = 3200;
const TOUR_ZOOM = 14.6;
const TOUR_PITCH = 58;
/** Espera tras el vuelo de entrada antes de empezar a recorrer. */
const TOUR_START_DELAY_MS = 5200;

/**
 * Mapa de la comuna con relieve 3D, cámara inclinada y vuelo de entrada (se
 * omite si el usuario pidió reducir el movimiento). Los mismos lugares y
 * pueblos están en enlaces bajo el mapa, para quien no use el mapa.
 *
 * Recorrido automático: al quedar a la vista, la cámara vuela de un lugar a
 * otro y muestra una tarjeta con su imagen, nombre y «Ver ficha». Se pausa
 * con el botón o en cuanto la persona mueve el mapa o toca un punto. No
 * arranca solo si el usuario pidió reducir el movimiento.
 */
export function CommuneMap3D({
  places,
  localities,
  className = "h-[26rem]",
}: {
  places: CommunePlace[];
  localities: CommuneLocality[];
  className?: string;
}) {
  const t = useTranslations("map");
  const mapLocale = useMapLocale();
  const mapRef = useRef<MapRef>(null);
  const loaded = useRef(false);
  const [failed, setFailed] = useState(false);
  const [is3d, setIs3d] = useState(true);
  const [firstSymbolId, setFirstSymbolId] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [touring, setTouring] = useState(false);
  const [tourIdx, setTourIdx] = useState(0);
  const autoStarted = useRef(false);
  const tourStop = places[tourIdx % Math.max(places.length, 1)] ?? null;

  // Arranca solo la primera vez que el mapa queda a la vista (tras el vuelo
  // de entrada), salvo que se haya pedido reducir el movimiento.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !ready || places.length === 0 || autoStarted.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || autoStarted.current) return;
        autoStarted.current = true;
        io.disconnect();
        timer = setTimeout(() => setTouring(true), TOUR_START_DELAY_MS);
      },
      { threshold: 0.5 },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [ready, places.length]);

  // Cada paso: vuela al lugar y, al rato, pasa al siguiente.
  useEffect(() => {
    if (!touring || !ready || !tourStop) return;
    const map = mapRef.current;
    if (!map) return;
    setSelected(null);
    map.flyTo({
      center: [tourStop.longitude, tourStop.latitude],
      zoom: TOUR_ZOOM,
      pitch: TOUR_PITCH,
      bearing: ((tourIdx * 47) % 120) - 60,
      duration: TOUR_FLY_MS,
      essential: true,
    });
    const next = setTimeout(
      () => setTourIdx((i) => (i + 1) % places.length),
      TOUR_STEP_MS,
    );
    return () => clearTimeout(next);
  }, [touring, ready, tourIdx, tourStop, places.length]);

  /** La persona toma el control: el recorrido se detiene. */
  const stopTour = useCallback(() => setTouring(false), []);

  const camera = useCallback(
    (threeD: boolean, animate: boolean) => {
      const map = mapRef.current;
      if (!map) return;
      const points = [...places, ...localities];
      const lats = points.map((p) => p.latitude);
      const lngs = points.map((p) => p.longitude);
      const cam = map.cameraForBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 56 },
      );
      if (!cam) return;
      const target = {
        center: cam.center,
        zoom: (cam.zoom ?? 11) + (threeD ? 0.35 : 0),
        pitch: threeD ? PITCH_3D : 0,
        bearing: threeD ? BEARING_3D : 0,
      };
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (animate && !reduce) map.flyTo({ ...target, duration: 4200 });
      else map.jumpTo(target);
    },
    [places, localities],
  );

  // El relieve se activa después de que la fuente existe en el mapa.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !ready) return;
    try {
      map.setTerrain(
        is3d ? { source: "terrain-dem", exaggeration: 1.6 } : null,
      );
    } catch {
      /* sin relieve: el mapa sigue funcionando en 2D */
    }
  }, [is3d, ready]);

  if (failed) {
    return (
      <div
        role="status"
        className={`border-border bg-sea-soft/50 text-muted grid place-items-center rounded-3xl border border-dashed p-4 text-center text-sm ${className}`}
      >
        {t("unavailable")}
      </div>
    );
  }

  return (
    <div
      ref={boxRef}
      className={`border-border relative overflow-hidden rounded-3xl border shadow-lg ${className}`}
    >
      <Map
        ref={mapRef}
        locale={mapLocale}
        mapStyle={getMapStyleUrl()}
        initialViewState={{
          latitude: MAP_CENTER.latitude,
          longitude: MAP_CENTER.longitude,
          zoom: 9.6,
          pitch: 0,
        }}
        maxBounds={COMMUNE_VIEW_BOUNDS}
        maxPitch={75}
        onLoad={(e) => {
          loaded.current = true;
          const map = e.target;
          const symbol = map.getStyle().layers.find((l) => l.type === "symbol");
          setFirstSymbolId(symbol?.id);
          try {
            map.setSky({
              "sky-color": "#9fd8ec",
              "horizon-color": "#fff1d6",
              "fog-color": "#ffffff",
              "sky-horizon-blend": 0.6,
              "horizon-fog-blend": 0.6,
              "fog-ground-blend": 0.4,
            });
          } catch {
            /* cielo no soportado: sin efecto */
          }
          setReady(true);
          camera(true, true);
        }}
        onError={() => {
          if (!loaded.current) setFailed(true);
        }}
        // Solo los gestos de la persona (no los vuelos del recorrido) traen
        // originalEvent: con ellos, el recorrido se detiene.
        onDragStart={(e) => {
          if (e.originalEvent) stopTour();
        }}
        onZoomStart={(e) => {
          if (e.originalEvent) stopTour();
        }}
        onRotateStart={(e) => {
          if (e.originalEvent) stopTour();
        }}
        attributionControl={{
          compact: true,
          customAttribution: TERRAIN_ATTRIBUTION,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl visualizePitch position="top-right" />
        {ready ? (
          <>
            <Source
              id="terrain-dem"
              type="raster-dem"
              tiles={[getTerrainTilesUrl()]}
              encoding="terrarium"
              tileSize={256}
              maxzoom={14}
            />
            <Source
              id="hillshade-dem"
              type="raster-dem"
              tiles={[getTerrainTilesUrl()]}
              encoding="terrarium"
              tileSize={256}
              maxzoom={14}
            >
              <Layer
                id="commune-hillshade"
                type="hillshade"
                beforeId={firstSymbolId}
                paint={{
                  "hillshade-shadow-color": "#3b5f4a",
                  "hillshade-highlight-color": "#fff6e0",
                  "hillshade-exaggeration": 0.45,
                }}
              />
            </Source>
          </>
        ) : null}

        {places.map((p) => (
          <Marker
            key={p.slug}
            ref={labelMarker(p.name)}
            latitude={p.latitude}
            longitude={p.longitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              stopTour();
              setSelected({ kind: "place", item: p });
            }}
          >
            <span
              title={p.name}
              style={{ background: CATEGORY_PIN_COLOR[p.category] }}
              className="block size-4 cursor-pointer rounded-full border-2 border-white shadow-md"
            />
          </Marker>
        ))}

        {localities.map((l) => (
          <Marker
            key={l.slug}
            ref={labelMarker(l.name)}
            latitude={l.latitude}
            longitude={l.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              stopTour();
              setSelected({ kind: "locality", item: l });
            }}
          >
            <span className="flex cursor-pointer flex-col items-center">
              <span className="bg-sea-deep rounded-full px-3 py-1 text-xs font-extrabold text-white shadow-lg">
                {l.name}
              </span>
              <span className="bg-sea-deep h-3 w-0.5" />
            </span>
          </Marker>
        ))}

        {selected ? (
          <Popup
            latitude={selected.item.latitude}
            longitude={selected.item.longitude}
            anchor="bottom"
            offset={selected.kind === "locality" ? 34 : 12}
            onClose={() => setSelected(null)}
            closeOnClick={false}
          >
            <div className="text-foreground min-w-32">
              <p className="text-sm font-bold">{selected.item.name}</p>
              <Link
                href={
                  selected.kind === "locality"
                    ? {
                        pathname: "/pueblos/[slug]",
                        params: { slug: selected.item.slug },
                      }
                    : {
                        pathname: "/lugares/[slug]",
                        params: { slug: selected.item.slug },
                      }
                }
                className="text-sea mt-1 inline-block text-sm font-bold underline"
              >
                {selected.kind === "locality"
                  ? t("viewVillage")
                  : t("viewPlace")}
              </Link>
            </div>
          </Popup>
        ) : null}
      </Map>

      <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-2">
        <span className="bg-sea-deep/90 rounded-full px-3 py-1 text-xs font-extrabold text-white shadow">
          {t("communeBadge")}
        </span>
      </div>
      {touring && tourStop ? (
        <div
          aria-live="polite"
          className="bg-surface/95 absolute top-3 right-14 left-3 flex max-w-sm gap-3 rounded-2xl p-2 shadow-lg sm:right-auto"
          data-testid="tour-card"
        >
          {tourStop.picture ? (
            <IllustratedImage
              picture={tourStop.picture}
              className="size-20 shrink-0 rounded-xl"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-muted text-xs font-bold">
              {[
                tourStop.categoryName,
                t("tourOf", {
                  n: (tourIdx % places.length) + 1,
                  total: places.length,
                }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="font-display truncate text-base leading-tight font-extrabold">
              {tourStop.name}
            </p>
            {tourStop.short ? (
              <p className="text-muted line-clamp-2 text-xs">
                {tourStop.short}
              </p>
            ) : null}
            <Link
              href={{
                pathname: "/lugares/[slug]",
                params: { slug: tourStop.slug },
              }}
              className="text-sea text-sm font-bold underline"
            >
              {t("viewPlace")}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-8 left-3 flex flex-wrap gap-2">
        {places.length > 0 ? (
          <button
            type="button"
            aria-pressed={touring}
            onClick={() => {
              if (touring) {
                stopTour();
                return;
              }
              autoStarted.current = true;
              setTouring(true);
            }}
            className="bg-sea-deep min-h-11 rounded-full px-4 text-sm font-extrabold text-white shadow-lg active:scale-95"
          >
            {touring ? t("tourPause") : t("tourStart")}
          </button>
        ) : null}
        <button
          type="button"
          aria-pressed={is3d}
          onClick={() => {
            const next = !is3d;
            setIs3d(next);
            camera(next, true);
          }}
          className="text-sea-deep min-h-11 rounded-full bg-white/95 px-4 text-sm font-extrabold shadow-lg active:scale-95"
        >
          {is3d ? t("view2d") : t("view3d")}
        </button>
        <button
          type="button"
          onClick={() => {
            stopTour();
            camera(is3d, true);
          }}
          className="text-sea-deep min-h-11 rounded-full bg-white/95 px-4 text-sm font-extrabold shadow-lg active:scale-95"
        >
          {t("recenter")}
        </button>
      </div>
    </div>
  );
}
