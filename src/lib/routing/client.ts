import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import type { RouteMode, StreetRoute } from "@/lib/routing/types";

/** Pide la ruta por calles a nuestro servidor; null si no se pudo (se usa la guía aproximada). */
export async function fetchStreetRoute(
  from: GeoPoint,
  to: GeoPoint,
  mode: RouteMode,
  signal?: AbortSignal,
): Promise<StreetRoute | null> {
  const query = new URLSearchParams({
    mode,
    fromLat: String(from.latitude),
    fromLon: String(from.longitude),
    toLat: String(to.latitude),
    toLon: String(to.longitude),
  });
  try {
    const response = await fetch(`/api/ruta?${query}`, { signal });
    if (!response.ok) return null;
    return (await response.json()) as StreetRoute;
  } catch {
    return null;
  }
}

const CONSENT_KEY = "papudo.route-consent";

/** La persona aceptó que su ubicación se envíe para calcular la ruta por calles. */
export function readRouteConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveRouteConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    // Sin almacenamiento: se vuelve a preguntar la próxima vez.
  }
}
