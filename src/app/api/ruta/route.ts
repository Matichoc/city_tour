import type { NextRequest } from "next/server";
import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import {
  MAX_POINTS,
  createCache,
  decimate,
  round,
  withinReach,
} from "@/lib/routing/limits";
import { fail, guard, noStore, provider, throttle } from "@/lib/routing/server";
import {
  RoutingError,
  type RouteMode,
  type StreetRoute,
} from "@/lib/routing/types";

/**
 * Ruta por calles (a pie o en auto) desde donde está la persona hasta una
 * parada. Pasa por el servidor para no exponer claves, cachear y frenar el
 * abuso. No guarda ni registra coordenadas: solo se reenvían al servicio de
 * rutas, redondeadas (origen ≈ 11 m, destino ≈ 1 m).
 */
const cache = createCache<StreetRoute>(300, 10 * 60_000);

function readPoint(
  params: URLSearchParams,
  lat: string,
  lon: string,
): GeoPoint | null {
  const rawLat = params.get(lat);
  const rawLon = params.get(lon);
  if (!rawLat || !rawLon) return null;
  const latitude = Number(rawLat);
  const longitude = Number(rawLon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export async function GET(request: NextRequest) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  const params = request.nextUrl.searchParams;
  const mode = params.get("mode");
  const rawFrom = readPoint(params, "fromLat", "fromLon");
  const rawTo = readPoint(params, "toLat", "toLon");
  if ((mode !== "walk" && mode !== "car") || !rawFrom || !rawTo)
    return fail(400, "invalid");
  if (!withinReach(rawFrom, rawTo)) return fail(400, "out-of-area");

  const from = {
    latitude: round(rawFrom.latitude, 4),
    longitude: round(rawFrom.longitude, 4),
  };
  const to = {
    latitude: round(rawTo.latitude, 5),
    longitude: round(rawTo.longitude, 5),
  };
  const key = `${mode}:${from.latitude},${from.longitude}:${to.latitude},${to.longitude}`;

  let route = cache.get(key);
  if (!route) {
    try {
      await throttle();
      const found = await provider.route([from, to], mode as RouteMode);
      route = {
        ...found,
        coordinates: decimate(found.coordinates, MAX_POINTS),
      };
      cache.set(key, route);
    } catch (error) {
      if (error instanceof RoutingError && error.kind === "no-route")
        return fail(404, "no-route");
      console.error("ruta: el servicio de rutas no respondió");
      return fail(502, "upstream");
    }
  }
  return Response.json(route, { headers: noStore });
}
