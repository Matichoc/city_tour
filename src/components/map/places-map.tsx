"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
  MAP_DEFAULT_ZOOM,
  PLACE_ZOOM,
  getMapStyleUrl,
} from "@/lib/map-config";

export type MapMarker = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  category: CategorySlug;
  /** Número de parada (rutas y recorridos). */
  order?: number;
};

export function PlacesMap({
  markers,
  connect = false,
  className = "h-72",
}: {
  markers: MapMarker[];
  /** Une los puntos en orden con una línea. */
  connect?: boolean;
  className?: string;
}) {
  const t = useTranslations("map");
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [failed, setFailed] = useState(false);
  const loaded = useRef(false);

  const fit = useCallback(() => {
    const map = mapRef.current;
    if (!map || markers.length < 2) return;
    const lats = markers.map((m) => m.latitude);
    const lngs = markers.map((m) => m.longitude);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, duration: 0, maxZoom: 15 },
    );
  }, [markers]);

  const line = useMemo(
    () => ({
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: markers.map((m) => [m.longitude, m.latitude]),
      },
    }),
    [markers],
  );

  if (failed) {
    return (
      <div
        role="status"
        className={`border-border bg-sea-soft/50 text-muted grid place-items-center rounded-2xl border border-dashed p-4 text-center text-sm ${className}`}
      >
        {t("unavailable")}
      </div>
    );
  }

  const single = markers.length === 1 ? markers[0] : null;

  return (
    <div
      className={`border-border relative overflow-hidden rounded-2xl border ${className}`}
    >
      <Map
        ref={mapRef}
        mapStyle={getMapStyleUrl()}
        initialViewState={{
          latitude: single?.latitude ?? MAP_CENTER.latitude,
          longitude: single?.longitude ?? MAP_CENTER.longitude,
          zoom: single ? PLACE_ZOOM : MAP_DEFAULT_ZOOM,
        }}
        onLoad={() => {
          loaded.current = true;
          fit();
        }}
        // Solo si el estilo nunca cargó se oculta el mapa; un tile suelto que falla no.
        onError={() => {
          if (!loaded.current) setFailed(true);
        }}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl showCompass={false} position="top-right" />
        {connect && markers.length > 1 ? (
          <Source id="trip-line" type="geojson" data={line}>
            <Layer
              id="trip-line-casing"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 7,
                "line-opacity": 0.85,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
            <Layer
              id="trip-line-core"
              type="line"
              paint={{
                "line-color": "#e98bbd",
                "line-width": 3.5,
                "line-dasharray": [1.5, 1.5],
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        ) : null}
        {markers.map((m, i) => (
          <Marker
            key={m.slug}
            latitude={m.latitude}
            longitude={m.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(m);
            }}
          >
            {/* Sin <button>: MapLibre ya da al pin un rol propio. Los mismos
                lugares siempre están en la lista accesible de la página. */}
            <span
              title={m.name}
              style={
                {
                  "--i": i,
                  background: CATEGORY_PIN_COLOR[m.category],
                } as React.CSSProperties
              }
              className="pin-drop grid size-9 [transform:rotate(-45deg)] cursor-pointer place-items-center rounded-full rounded-bl-none border-2 border-white text-sm font-extrabold text-white shadow-lg"
            >
              <span className="[transform:rotate(45deg)]">{m.order ?? ""}</span>
            </span>
          </Marker>
        ))}
        {selected ? (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            anchor="bottom"
            offset={28}
            onClose={() => setSelected(null)}
            closeOnClick={false}
          >
            <div className="text-foreground min-w-32">
              <p className="text-sm font-bold">{selected.name}</p>
              <Link
                href={{
                  pathname: "/lugares/[slug]",
                  params: { slug: selected.slug },
                }}
                className="text-sea mt-1 inline-block text-sm font-bold underline"
              >
                {t("viewPlace")}
              </Link>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
