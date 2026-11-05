import type { NextRequest } from "next/server";
import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import {
  DEST_BOX,
  MAX_POINTS,
  MAX_STOPS,
  createCache,
  decimate,
  inBox,
  round,
} from "@/lib/routing/limits";
import { fail, guard, provider, throttle } from "@/lib/routing/server";
import {
  RoutingError,
  type RouteMode,
  type StreetRoute,
} from "@/lib/routing/types";

/**
 * Camino por calles (a pie o en auto) que une las paradas de una ruta o de un
 * recorrido, en orden. Los mapas lo dibujan en vez de una línea recta, que
 * cruzaría el mar o los cerros. Las paradas son lugares públicos de la guía:
 * aquí no viaja la ubicación de nadie.
 */
const cache = createCache<StreetRoute>(200, 6 * 60 * 60_000);

/** `p=lat,lon` repetido, en orden. Null si alguno no sirve. */
function readStops(params: URLSearchParams): GeoPoint[] | null {
  const raw = params.getAll("p");
  if (raw.length < 2 || raw.length > MAX_STOPS) return null;
  const points: GeoPoint[] = [];
  for (const item of raw) {
    const [lat, lon, extra] = item.split(",");
    if (extra !== undefined || !lat || !lon) return null;
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    points.push({
      latitude: round(latitude, 5),
      longitude: round(longitude, 5),
    });
  }
  return points;
}

export async function GET(request: NextRequest) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  const params = request.nextUrl.searchParams;
  const mode = params.get("mode");
  const stops = readStops(params);
  if ((mode !== "walk" && mode !== "car") || !stops)
    return fail(400, "invalid");
  // Solo paradas dentro de la comuna: no es un ruteador general.
  if (!stops.every((p) => inBox(p, DEST_BOX))) return fail(400, "out-of-area");

  const key = `${mode}:${stops.map((p) => `${p.latitude},${p.longitude}`).join(";")}`;
  let route = cache.get(key);
  if (!route) {
    try {
      await throttle();
      const found = await provider.route(stops, mode as RouteMode);
      route = {
        ...found,
        coordinates: decimate(found.coordinates, MAX_POINTS),
      };
      cache.set(key, route);
    } catch (error) {
      if (error instanceof RoutingError && error.kind === "no-route")
        return fail(404, "no-route");
      console.error("ruta/paradas: el servicio de rutas no respondió");
      return fail(502, "upstream");
    }
  }
  // Son lugares públicos: el navegador puede guardarla un rato.
  return Response.json(route, {
    headers: { "cache-control": "private, max-age=3600" },
  });
}
