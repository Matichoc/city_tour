import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import { distanceMeters } from "@/lib/live-nav";

/**
 * Cajas donde se aceptan rutas: el destino debe estar en la comuna de Papudo y
 * el origen en la región. Así el servicio no sirve de ruteador general para
 * cualquiera que lo descubra.
 */
export const DEST_BOX = {
  south: -32.7,
  north: -32.2,
  west: -71.7,
  east: -71.2,
};
export const ORIGIN_BOX = {
  south: -34.5,
  north: -31.0,
  west: -72.5,
  east: -69.5,
};
/** Distancia máxima entre origen y destino (en línea recta). */
export const MAX_DISTANCE_M = 300_000;
/** Largo máximo de la línea que se devuelve (puntos). */
export const MAX_POINTS = 1500;

export const inBox = (
  p: GeoPoint,
  box: { south: number; north: number; west: number; east: number },
) =>
  p.latitude >= box.south &&
  p.latitude <= box.north &&
  p.longitude >= box.west &&
  p.longitude <= box.east;

export const withinReach = (from: GeoPoint, to: GeoPoint) =>
  inBox(to, DEST_BOX) &&
  inBox(from, ORIGIN_BOX) &&
  distanceMeters(from, to) <= MAX_DISTANCE_M;

/** Redondea a `decimals` decimales (5 ≈ 1 m, 4 ≈ 11 m). */
export const round = (n: number, decimals: number) =>
  Number(n.toFixed(decimals));

/** Conserva el inicio y el final y reparte el resto parejo hasta `max` puntos. */
export function decimate<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const out: T[] = [];
  const step = (points.length - 1) / (max - 1);
  for (let i = 0; i < max - 1; i++) out.push(points[Math.round(i * step)]!);
  out.push(points[points.length - 1]!);
  return out;
}

/** Contador por ventana, en memoria: freno al abuso, no una cuota exacta. */
export function createLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string, now = Date.now()) => {
    if (hits.size > 2000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    const hit = hits.get(key);
    if (!hit || hit.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    hit.count += 1;
    return hit.count <= max;
  };
}

/** Caché pequeña con vencimiento. */
export function createCache<V>(maxEntries: number, ttlMs: number) {
  const map = new Map<string, { value: V; expiresAt: number }>();
  return {
    get(key: string, now = Date.now()): V | undefined {
      const hit = map.get(key);
      if (!hit) return undefined;
      if (hit.expiresAt <= now) {
        map.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key: string, value: V, now = Date.now()) {
      if (map.size >= maxEntries) map.delete(map.keys().next().value!);
      map.set(key, { value, expiresAt: now + ttlMs });
    },
  };
}

/** Espacia las llamadas al servicio externo (política: 1 por segundo). */
export function createThrottle(minIntervalMs: number) {
  let chain: Promise<void> = Promise.resolve();
  let last = 0;
  return async () => {
    const previous = chain;
    let release!: () => void;
    chain = new Promise<void>((resolve) => (release = resolve));
    await previous;
    const wait = last + minIntervalMs - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    release();
  };
}
