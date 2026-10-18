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

/** Modos de viaje que ofrece el recorrido. */
export type TravelMode = "walk" | "car";
/** Velocidad media en auto por Papudo y los caminos de la comuna (a calibrar en terreno). */
export const CAR_SPEED_KMH = 35;
/**
 * El camino por calles es más largo que la línea recta. Mientras no haya una
 * ruta real, se estima multiplicando por este factor (a calibrar en terreno).
 */
export const DETOUR_FACTOR: Record<TravelMode, number> = {
  walk: 1.3,
  car: 1.4,
};
/** Desde esta distancia en línea recta se sugiere ir en auto. */
export const CAR_SUGGEST_FROM_M = 5000;
/** Si a pie pasa de estos minutos, se sugiere el auto. */
export const WALK_SUGGEST_MAX_MIN = 45;

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

/** Distancia y minutos estimados de un tramo, según el modo (sin ruta real). */
export function estimateLeg(
  straightMeters: number,
  mode: TravelMode,
): { meters: number; minutes: number } {
  const meters = straightMeters * DETOUR_FACTOR[mode];
  const speed = mode === "walk" ? WALK_SPEED_KMH : CAR_SPEED_KMH;
  return {
    meters,
    minutes: Math.max(1, Math.round((meters / 1000 / speed) * 60)),
  };
}

/**
 * Modo que se sugiere según la distancia en línea recta a la parada. Si ya se
 * conoce la ruta real a pie (`realWalkMinutes`), decide con esos minutos.
 */
export function suggestedMode(
  straightMeters: number,
  realWalkMinutes?: number,
): TravelMode {
  if (straightMeters > CAR_SUGGEST_FROM_M) return "car";
  if (straightMeters <= SHORT_WALK_MAX_M) return "walk";
  const walk = realWalkMinutes ?? estimateLeg(straightMeters, "walk").minutes;
  return walk > WALK_SUGGEST_MAX_MIN ? "car" : "walk";
}

/** «45 min», «1 h», «1 h 30 min». */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
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

/** Punto a `meters` de `from` en la dirección `bearing` (grados). */
export function offsetPoint(
  from: GeoPoint,
  bearing: number,
  meters: number,
): GeoPoint {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(from.latitude);
  const lon1 = toRad(from.longitude);
  const brg = toRad(bearing);
  const ang = meters / R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(ang) +
      Math.cos(lat1) * Math.sin(ang) * Math.cos(brg),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brg) * Math.sin(ang) * Math.cos(lat1),
      Math.cos(ang) - Math.sin(lat1) * Math.sin(lat2),
    );
  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lon2 * 180) / Math.PI,
  };
}

/** Avanza desde `from` hacia `to` hasta `meters`; si alcanza, devuelve `to`. */
export function moveToward(
  from: GeoPoint,
  to: GeoPoint,
  meters: number,
): GeoPoint {
  const d = distanceMeters(from, to);
  if (d <= meters) return { latitude: to.latitude, longitude: to.longitude };
  return offsetPoint(from, bearingDegrees(from, to), meters);
}

/** Paso por segundo del modo demostración: un tramo corto dura unos 20 s. */
export function demoStepMeters(distance: number): number {
  return Math.max(25, distance / 20);
}

/** Punto de una ruta: [longitud, latitud], como en GeoJSON. */
export type LngLat = [number, number];

const EARTH_R = 6371000;

/** Proyección plana local (metros) alrededor de `origin`: sirve en distancias cortas. */
function toXY(origin: GeoPoint, lng: number, lat: number): [number, number] {
  const toRad = Math.PI / 180;
  return [
    (lng - origin.longitude) *
      toRad *
      Math.cos(origin.latitude * toRad) *
      EARTH_R,
    (lat - origin.latitude) * toRad * EARTH_R,
  ];
}

/** Largo total de una ruta, en metros. */
export function polylineLength(line: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    total += distanceMeters(
      { latitude: line[i - 1]![1], longitude: line[i - 1]![0] },
      { latitude: line[i]![1], longitude: line[i]![0] },
    );
  }
  return total;
}

export type RouteSnap = {
  /** Distancia (m) del punto a la ruta. */
  distance: number;
  /** Tramo de la ruta donde cae (0 = entre los dos primeros puntos). */
  segment: number;
  /** Metros avanzados desde el inicio de la ruta hasta ese punto. */
  along: number;
  /** El punto de la ruta más cercano. */
  point: GeoPoint;
};

/** Punto de la ruta más cercano a `p` (medido en perpendicular a cada tramo). */
export function snapToPolyline(p: GeoPoint, line: LngLat[]): RouteSnap | null {
  if (line.length < 2) return null;
  let best: RouteSnap | null = null;
  let before = 0;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = toXY(p, line[i - 1]![0], line[i - 1]![1]);
    const [bx, by] = toXY(p, line[i]![0], line[i]![1]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const len = Math.sqrt(len2);
    // El punto `p` es el origen (0, 0) de la proyección.
    const t =
      len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const distance = Math.hypot(cx, cy);
    if (!best || distance < best.distance) {
      best = {
        distance,
        segment: i - 1,
        along: before + t * len,
        point: {
          latitude: line[i - 1]![1] + t * (line[i]![1] - line[i - 1]![1]),
          longitude: line[i - 1]![0] + t * (line[i]![0] - line[i - 1]![0]),
        },
      };
    }
    before += len;
  }
  return best;
}

/** Distancia (m) de `p` a la ruta, o null si no hay ruta. */
export function distanceToPolylineMeters(
  p: GeoPoint,
  line: LngLat[],
): number | null {
  return snapToPolyline(p, line)?.distance ?? null;
}

/** Punto de la ruta a `meters` más adelante de lo avanzado (`along`); no pasa del final. */
export function lookaheadPoint(
  line: LngLat[],
  along: number,
  meters: number,
): GeoPoint {
  const last = line[line.length - 1]!;
  let remaining = Math.max(0, along + meters);
  for (let i = 1; i < line.length; i++) {
    const a = { latitude: line[i - 1]![1], longitude: line[i - 1]![0] };
    const b = { latitude: line[i]![1], longitude: line[i]![0] };
    const len = distanceMeters(a, b);
    if (remaining <= len) {
      const t = len === 0 ? 0 : remaining / len;
      return {
        latitude: a.latitude + t * (b.latitude - a.latitude),
        longitude: a.longitude + t * (b.longitude - a.longitude),
      };
    }
    remaining -= len;
  }
  return { latitude: last[1], longitude: last[0] };
}

/** Parte la ruta en el tramo ya recorrido y el que falta, unidos en el punto más cercano. */
export function splitRouteAt(
  line: LngLat[],
  snap: RouteSnap,
): { done: LngLat[]; todo: LngLat[] } {
  const cut: LngLat = [snap.point.longitude, snap.point.latitude];
  return {
    done: [...line.slice(0, snap.segment + 1), cut],
    todo: [cut, ...line.slice(snap.segment + 1)],
  };
}
