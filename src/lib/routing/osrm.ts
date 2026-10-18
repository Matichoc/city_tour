import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import {
  RoutingError,
  type RouteMode,
  type RouteProvider,
  type StreetRoute,
} from "@/lib/routing/types";

/**
 * Servidores públicos OSRM de FOSSGIS (datos de OpenStreetMap). Política de
 * uso: atribución, User-Agent válido, máximo 1 consulta por segundo y sin uso
 * intensivo. Para más tráfico, apuntar estas variables a un servidor propio.
 */
const DEFAULT_URLS: Record<RouteMode, string> = {
  walk: "https://routing.openstreetmap.de/routed-foot",
  car: "https://routing.openstreetmap.de/routed-car",
};
const DEFAULT_USER_AGENT =
  "PapudoEnTuMano/1.0 (+https://github.com/Matichoc/city_tour)";
const TIMEOUT_MS = 8000;

type OsrmResponse = {
  code?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }[];
};

export function osrmProvider(
  env: Record<string, string | undefined> = process.env,
): RouteProvider {
  const base: Record<RouteMode, string> = {
    walk: env.ROUTING_OSRM_WALK_URL || DEFAULT_URLS.walk,
    car: env.ROUTING_OSRM_CAR_URL || DEFAULT_URLS.car,
  };
  const userAgent = env.ROUTING_USER_AGENT || DEFAULT_USER_AGENT;

  return {
    async route(from: GeoPoint, to: GeoPoint, mode: RouteMode) {
      // El perfil (a pie o auto) lo fija el servidor elegido; el de la ruta no importa.
      const url =
        `${base[mode]}/route/v1/driving/` +
        `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
        `?overview=full&geometries=geojson&steps=false&alternatives=false`;
      let response: Response;
      try {
        response = await fetch(url, {
          headers: { "user-agent": userAgent, accept: "application/json" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        });
      } catch {
        throw new RoutingError("upstream");
      }
      if (!response.ok) throw new RoutingError("upstream");
      const data = (await response
        .json()
        .catch(() => null)) as OsrmResponse | null;
      if (data?.code === "NoRoute" || data?.code === "NoSegment")
        throw new RoutingError("no-route");
      const route = data?.code === "Ok" ? data.routes?.[0] : undefined;
      if (!route || route.geometry.coordinates.length < 2)
        throw new RoutingError("upstream");
      return {
        mode,
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration),
        coordinates: route.geometry.coordinates,
      } satisfies StreetRoute;
    },
  };
}
