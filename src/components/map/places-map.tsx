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
import { labelMarker, useMapLocale } from "@/components/map/map-locale";
import type { CategorySlug } from "@/content/types";
import {
  CATEGORY_PIN_COLOR,
  LIGHT_MAP_TINT,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  PLACE_ZOOM,
  getLightMapStyleUrl,
} from "@/lib/map-config";

/** Tarjeta que aparece abajo al tocar un pin (Explorar). */
export type MarkerDetail = {
  /** Puerta o categoría, ya traducida. */
  kicker: string;
  text: string;
  image: string | null;
  /** Clase de color del marco de la imagen (`DOOR_STYLE[...].frame`). */
  frame: string;
  /** "Cómo llegar": enlace externo a la app de mapas. */
  directions: string;
};

/** Pines amarillos y turquesa llevan el número en azul noche (contraste). */
const DARK_PIN_TEXT = new Set(["balneario", "ruralidad"]);

export type MapMarker = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  category: CategorySlug;
  /** Número de parada (rutas y recorridos). */
  order?: number;
  detail?: MarkerDetail;
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
  const tp = useTranslations("place");
  const mapLocale = useMapLocale();
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
        locale={mapLocale}
        mapStyle={getLightMapStyleUrl()}
        initialViewState={{
          latitude: single?.latitude ?? MAP_CENTER.latitude,
          longitude: single?.longitude ?? MAP_CENTER.longitude,
          zoom: single ? PLACE_ZOOM : MAP_DEFAULT_ZOOM,
        }}
        onLoad={(e) => {
          loaded.current = true;
          // Agua turquesa y tierra arena: los colores de Papudo, no el gris.
          const map = e.target;
          for (const l of map.getStyle().layers) {
            if (l.type === "background")
              map.setPaintProperty(
                l.id,
                "background-color",
                LIGHT_MAP_TINT.land,
              );
            else if (l.type === "fill" && /water/.test(l.id))
              map.setPaintProperty(l.id, "fill-color", LIGHT_MAP_TINT.water);
            else if (
              l.type === "fill" &&
              /(park|wood|grass|landcover)/.test(l.id)
            )
              map.setPaintProperty(l.id, "fill-color", LIGHT_MAP_TINT.green);
          }
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
                "line-color": "#14164a",
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
            ref={labelMarker(m.name)}
            latitude={m.latitude}
            longitude={m.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(m);
              // Con tarjeta abajo, el pin sube para que la tarjeta no lo tape.
              if (m.detail)
                mapRef.current?.easeTo({
                  center: [m.longitude, m.latitude],
                  offset: [0, -90],
                  duration: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? 0
                    : 400,
                });
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
              className={`pin-drop grid [transform:rotate(-45deg)] cursor-pointer place-items-center rounded-full rounded-bl-none border-white text-sm font-extrabold shadow-lg transition-[width,height] ${
                selected?.slug === m.slug
                  ? "size-11 border-[3px]"
                  : "size-9 border-2"
              } ${DARK_PIN_TEXT.has(m.category) ? "text-foreground" : "text-white"}`}
            >
              <span className="[transform:rotate(45deg)]">{m.order ?? ""}</span>
            </span>
          </Marker>
        ))}
        {selected && !selected.detail ? (
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
      {selected?.detail ? (
        <PlaceSheet
          marker={selected as MapMarker & { detail: MarkerDetail }}
          onClose={() => setSelected(null)}
          labels={{
            view: t("viewPlace"),
            directions: tp("navigate"),
            close: t("controls.close"),
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Tarjeta de abajo al elegir un pin: imagen con el marco de su puerta, nombre,
 * descripción y las dos acciones (ver la ficha o ir).
 */
function PlaceSheet({
  marker,
  onClose,
  labels,
}: {
  marker: MapMarker & { detail: MarkerDetail };
  onClose: () => void;
  labels: { view: string; directions: string; close: string };
}) {
  const d = marker.detail;
  return (
    <div
      role="dialog"
      aria-label={marker.name}
      className="bg-surface absolute inset-x-2 bottom-2 z-10 rounded-3xl p-4 shadow-[0_-4px_18px_rgb(20_22_74_/_0.16)]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className="text-muted hover:bg-soft absolute top-2 right-2 grid size-11 place-items-center rounded-full text-xl"
      >
        <span aria-hidden="true">×</span>
      </button>
      <div className="flex gap-4 pr-8">
        {d.image ? (
          <span
            className={`size-24 shrink-0 rounded-[1.2rem] p-[3px] ${d.frame}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.image}
              alt=""
              className="size-full rounded-[0.95rem] border-2 border-white/95 object-cover"
            />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-muted text-xs font-bold">{d.kicker}</p>
          <p className="font-display text-xl leading-tight font-extrabold">
            {marker.name}
          </p>
          <p className="text-muted mt-1 line-clamp-2 text-sm">{d.text}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={{ pathname: "/lugares/[slug]", params: { slug: marker.slug } }}
          className="border-foreground grid min-h-11 place-items-center rounded-full border-2 text-sm font-bold"
        >
          {labels.view}
        </Link>
        <a
          href={d.directions}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-coral grid min-h-11 place-items-center rounded-full text-sm font-bold text-white"
        >
          {labels.directions}
        </a>
      </div>
    </div>
  );
}
