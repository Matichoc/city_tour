import type { GeoPoint } from "@/lib/itinerary-engine/geo";

export type RouteMode = "walk" | "car";

/** Ruta por calles entre dos puntos. `coordinates` va como GeoJSON: [lon, lat]. */
export type StreetRoute = {
  mode: RouteMode;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
  /** Tramos entre puntos consecutivos (con varias paradas, uno por tramo). */
  legs?: { distanceMeters: number; durationSeconds: number }[];
};

/** `no-route`: no hay camino entre los puntos. `upstream`: el servicio falló. */
export class RoutingError extends Error {
  constructor(public kind: "no-route" | "upstream") {
    super(kind);
  }
}

/**
 * Motor de rutas intercambiable (OSRM, Valhalla, un servicio pago…). Recibe
 * dos o más puntos y devuelve un solo camino que pasa por todos, en orden.
 */
export interface RouteProvider {
  route(points: GeoPoint[], mode: RouteMode): Promise<StreetRoute>;
}
