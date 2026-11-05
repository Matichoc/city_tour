"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchStreetPath } from "@/lib/routing/client";
import type { RouteMode, StreetRoute } from "@/lib/routing/types";
import type { GeoPoint } from "@/lib/itinerary-engine/geo";

export type PathStatus = "idle" | "loading" | "ready" | "failed";

/**
 * Camino por calles que une las paradas en orden (a pie o en auto). Mientras
 * carga, o si falla, no hay línea: nunca se dibuja una recta entre paradas,
 * porque cruzaría el mar o los cerros.
 */
export function useStreetPath(stops: GeoPoint[], mode: RouteMode) {
  const key = useMemo(
    () =>
      stops.length < 2
        ? ""
        : `${mode}|${stops.map((s) => `${s.latitude},${s.longitude}`).join(";")}`,
    [stops, mode],
  );
  const [state, setState] = useState<{
    key: string;
    route: StreetRoute | null;
    status: PathStatus;
  }>({ key: "", route: null, status: "idle" });

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const points = key
      .split("|")[1]!
      .split(";")
      .map((pair) => {
        const [latitude, longitude] = pair.split(",").map(Number);
        return { latitude: latitude!, longitude: longitude! };
      });
    const pathMode = key.split("|")[0] as RouteMode;
    fetchStreetPath(points, pathMode, controller.signal).then((route) => {
      if (controller.signal.aborted) return;
      setState({ key, route, status: route ? "ready" : "failed" });
    });
    return () => controller.abort();
  }, [key]);

  if (!key) return { route: null, status: "idle" as PathStatus };
  // Mientras llega la del modo o paradas nuevas, no se muestra la anterior.
  if (state.key !== key)
    return { route: null, status: "loading" as PathStatus };
  return { route: state.route, status: state.status };
}
