"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { MarkerInstance } from "react-map-gl/maplibre";

/**
 * `ref` de un `<Marker>` que le da al pin el nombre del lugar para el lector
 * de pantalla. MapLibre solo pone su texto genérico ("Marker.Title") si el pin
 * no trae `aria-label`, y el ref corre antes de que lo agregue al mapa.
 */
export function labelMarker(name: string) {
  return (marker: MarkerInstance | null) => {
    marker?.getElement().setAttribute("aria-label", name);
  };
}

/**
 * Textos de los controles de MapLibre en el idioma del sitio. Sin esto, un
 * lector de pantalla anuncia "Map", "Zoom in" o "Map marker" en inglés dentro
 * de una página en español (WCAG 3.1.2). Se pasa como `locale` al `<Map>`.
 */
export function useMapLocale(): Record<string, string> {
  const t = useTranslations("map.controls");
  return useMemo(
    () => ({
      "AttributionControl.ToggleAttribution": t("attribution"),
      "AttributionControl.MapFeedback": t("feedback"),
      "FullscreenControl.Enter": t("fullscreenEnter"),
      "FullscreenControl.Exit": t("fullscreenExit"),
      "GeolocateControl.FindMyLocation": t("findMe"),
      "GeolocateControl.LocationNotAvailable": t("locationUnavailable"),
      "GlobeControl.Enable": t("globeEnable"),
      "GlobeControl.Disable": t("globeDisable"),
      "LogoControl.Title": t("logo"),
      "Map.Title": t("map"),
      "Marker.Title": t("marker"),
      "NavigationControl.ResetBearing": t("resetBearing"),
      "NavigationControl.ZoomIn": t("zoomIn"),
      "NavigationControl.ZoomOut": t("zoomOut"),
      "Popup.Close": t("close"),
      "TerrainControl.Enable": t("terrainEnable"),
      "TerrainControl.Disable": t("terrainDisable"),
      "CooperativeGesturesHandler.WindowsHelpText": t("helpWindows"),
      "CooperativeGesturesHandler.MacHelpText": t("helpMac"),
      "CooperativeGesturesHandler.MobileHelpText": t("helpMobile"),
    }),
    [t],
  );
}
