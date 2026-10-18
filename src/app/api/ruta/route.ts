import type { NextRequest } from "next/server";
import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import { ACCESS_COOKIE, verifyAccess } from "@/lib/share-link";
import { osrmProvider } from "@/lib/routing/osrm";
import {
  MAX_POINTS,
  createCache,
  createLimiter,
  createThrottle,
  decimate,
  round,
  withinReach,
} from "@/lib/routing/limits";
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
const provider = osrmProvider();
const cache = createCache<StreetRoute>(300, 10 * 60_000);
const allow = createLimiter(
  Number(process.env.ROUTING_MAX_PER_MINUTE) || 40,
  60_000,
);
const throttle = createThrottle(
  process.env.ROUTING_MIN_INTERVAL_MS !== undefined
    ? Number(process.env.ROUTING_MIN_INTERVAL_MS)
    : 1100,
);

const noStore = { "cache-control": "no-store" };
const fail = (status: number, error: string) =>
  Response.json({ error }, { status, headers: noStore });

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
  // Solo desde esta misma app (no como servicio para otros sitios).
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    return fail(403, "forbidden");

  // En un sitio cerrado con enlace temporal, la ruta también lo exige.
  const secret = process.env.SHARE_LINK_SECRET;
  if (
    secret &&
    !(await verifyAccess(secret, request.cookies.get(ACCESS_COOKIE)?.value))
  )
    return fail(401, "unauthorized");

  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(client)) return fail(429, "rate-limited");

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
      const found = await provider.route(from, to, mode as RouteMode);
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
