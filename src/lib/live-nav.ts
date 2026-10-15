import { haversineDistanceKm, type GeoPoint } from "@/lib/itinerary-engine/geo";

/**
 * Cálculos del recorrido en vivo (GPS + brújula). Todo es en línea recta: no
 * hay un servicio de rutas por calles, así que la app lo dice y ofrece abrir
 * Google Maps para el tramo.
 */

/** Velocidad de caminata usada para estimar minutos (persona adulta, sin apuro). */
export const WALK_SPEED_KMH = 4.5;
/** A esta distancia (m) de la parada se considera que llegaste. */
export const ARRIVAL_RADIUS_M = 35;
/** Hasta esta distancia (m) se ofrece la guía con la cámara. */
export const SHORT_WALK_MAX_M = 1500;

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  return haversineDistanceKm(a, b) * 1000;
}

/** Rumbo inicial de `a` hacia `b`, en grados (0 = norte, 90 = este). */
export function bearingDegrees(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI);
}

export function normalizeDegrees(d: number): number {
  return ((d % 360) + 360) % 360;
}

/**
 * Ángulo en que debe girar la flecha en pantalla: rumbo al destino menos hacia
 * dónde apunta el teléfono. Entre -180 y 180 (negativo = a la izquierda).
 */
export function relativeBearing(target: number, heading: number): number {
  const d = normalizeDegrees(target - heading);
  return d > 180 ? d - 360 : d;
}

export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round((meters / 1000 / WALK_SPEED_KMH) * 60));
}

export function isArrived(meters: number, accuracyMeters = 0): boolean {
  // Con GPS impreciso se amplía un poco el radio, sin pasar de 60 m.
  return meters <= Math.min(60, ARRIVAL_RADIUS_M + accuracyMeters / 2);
}

export function isShortWalk(meters: number): boolean {
  return meters <= SHORT_WALK_MAX_M;
}

export function formatMeters(meters: number, locale: string): string {
  if (meters < 1000) return `${Math.round(meters / 5) * 5} m`;
  return `${(meters / 1000).toLocaleString(locale, {
    maximumFractionDigits: 1,
  })} km`;
}

/**
 * Hacia dónde apunta la parte superior del teléfono (0 = norte), a partir de un
 * evento de orientación. iOS entrega `webkitCompassHeading`; Android, `alpha`
 * absoluto (sentido antihorario), corregido por la rotación de la pantalla.
 */
export function headingFromOrientation(
  e: {
    alpha: number | null;
    absolute?: boolean;
    webkitCompassHeading?: number;
  },
  screenAngle = 0,
): number | null {
  if (typeof e.webkitCompassHeading === "number") {
    return normalizeDegrees(e.webkitCompassHeading + screenAngle);
  }
  if (e.alpha === null || e.absolute === false) return null;
  return normalizeDegrees(360 - e.alpha + screenAngle);
}
