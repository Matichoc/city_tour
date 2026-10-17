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
import type { CategorySlug } from "@/content/types";
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

/**
 * Mapa de la comuna con relieve 3D, cámara inclinada y vuelo de entrada (se
 * omite si el usuario pidió reducir el movimiento). Los mismos lugares y
 * pueblos están en enlaces bajo el mapa, para quien no use el mapa.
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
  const mapRef = useRef<MapRef>(null);
  const loaded = useRef(false);
  const [failed, setFailed] = useState(false);
  const [is3d, setIs3d] = useState(true);
  const [firstSymbolId, setFirstSymbolId] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);

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
      className={`border-border relative overflow-hidden rounded-3xl border shadow-lg ${className}`}
    >
      <Map
        ref={mapRef}
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
            latitude={p.latitude}
            longitude={p.longitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
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
            latitude={l.latitude}
            longitude={l.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
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
      <div className="absolute bottom-8 left-3 flex gap-2">
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
          onClick={() => camera(is3d, true)}
          className="text-sea-deep min-h-11 rounded-full bg-white/95 px-4 text-sm font-extrabold shadow-lg active:scale-95"
        >
          {t("recenter")}
        </button>
      </div>
    </div>
  );
}
