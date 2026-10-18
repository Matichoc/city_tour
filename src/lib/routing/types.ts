import type { GeoPoint } from "@/lib/itinerary-engine/geo";

export type RouteMode = "walk" | "car";

/** Ruta por calles entre dos puntos. `coordinates` va como GeoJSON: [lon, lat]. */
export type StreetRoute = {
  mode: RouteMode;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
};

/** `no-route`: no hay camino entre los puntos. `upstream`: el servicio falló. */
export class RoutingError extends Error {
  constructor(public kind: "no-route" | "upstream") {
    super(kind);
  }
}

/** Motor de rutas intercambiable (OSRM, Valhalla, un servicio pago…). */
export interface RouteProvider {
  route(from: GeoPoint, to: GeoPoint, mode: RouteMode): Promise<StreetRoute>;
}
