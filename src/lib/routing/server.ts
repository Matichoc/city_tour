import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, verifyAccess } from "@/lib/share-link";
import { osrmProvider } from "@/lib/routing/osrm";
import { createLimiter, createThrottle } from "@/lib/routing/limits";

/**
 * Piezas compartidas por los endpoints de rutas por calles: el motor, el freno
 * al abuso (por persona) y la pausa entre consultas al servicio externo. Son
 * las mismas instancias para todos los endpoints, así el límite es uno solo.
 */
export const provider = osrmProvider();
export const allow = createLimiter(
  Number(process.env.ROUTING_MAX_PER_MINUTE) || 40,
  60_000,
);
export const throttle = createThrottle(
  process.env.ROUTING_MIN_INTERVAL_MS !== undefined
    ? Number(process.env.ROUTING_MIN_INTERVAL_MS)
    : 1100,
);

export const noStore = { "cache-control": "no-store" };
export const fail = (status: number, error: string) =>
  Response.json({ error }, { status, headers: noStore });

/**
 * Revisa que la consulta venga de esta app, con el enlace vigente si el sitio
 * está cerrado, y sin pasar el límite por persona. Devuelve la respuesta de
 * error, o null si puede seguir.
 */
export async function guard(request: NextRequest): Promise<Response | null> {
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
  return null;
}
