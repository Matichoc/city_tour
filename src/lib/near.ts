import { haversineDistanceKm, type GeoPoint } from "@/lib/itinerary-engine/geo";

/**
 * «Cerca de ti»: ordena lugares por cercanía a un punto de partida, que puede
 * ser la ubicación del teléfono o el centro de un pueblo (Papudo, Pullally,
 * Las Salinas). Todo se calcula en el teléfono: la ubicación no sale de ahí.
 *
 * Muchas fichas aún no tienen coordenadas (la Guía 2026 no las trae). Para no
 * dejarlas fuera, se ubican en el centro de su pueblo y se marcan como
 * aproximadas: la guía muestra «en Pullally», nunca una distancia inventada.
 */

/** Punto de partida elegido por la persona. */
export type NearOrigin =
  | { kind: "gps"; latitude: number; longitude: number }
  | { kind: "pueblo"; slug: string; latitude: number; longitude: number };

export type NearLocality = GeoPoint & { slug: string; name: string };

export type NearCandidate = {
  slug: string;
  latitude: number | null;
  longitude: number | null;
  localitySlug: string | null;
};

export type NearResult<T> = {
  item: T;
  /** Distancia en línea recta, en km. `null` si no hay cómo ubicarlo. */
  km: number | null;
  /** Ubicado por su pueblo, no por coordenadas propias. */
  approx: boolean;
};

/**
 * Una ficha sin coordenadas cuenta como si estuviera un poco más lejos que el
 * centro de su pueblo: así, en Papudo, los lugares exactos cercanos van antes,
 * pero en Las Salinas lo de Las Salinas va antes que lo de Papudo.
 */
export const APPROX_PENALTY_KM = 1.5;

/** Más lejos que esto, la persona aún no está en la comuna (va en camino). */
export const FAR_FROM_COMMUNE_KM = 25;

export function rankByNearness<T extends NearCandidate>(
  items: readonly T[],
  origin: GeoPoint,
  localities: readonly NearLocality[],
): NearResult<T>[] {
  const town = new Map(localities.map((l) => [l.slug, l]));
  const ranked = items.map((item, index) => {
    if (item.latitude !== null && item.longitude !== null) {
      const km = haversineDistanceKm(origin, {
        latitude: item.latitude,
        longitude: item.longitude,
      });
      return { item, km, approx: false, key: km, index };
    }
    const l = item.localitySlug ? town.get(item.localitySlug) : undefined;
    if (!l) return { item, km: null, approx: true, key: Infinity, index };
    const km = haversineDistanceKm(origin, l);
    return { item, km, approx: true, key: km + APPROX_PENALTY_KM, index };
  });
  // Orden estable: a igual distancia se respeta el orden original (sugerido).
  ranked.sort((a, b) => a.key - b.key || a.index - b.index);
  return ranked.map(({ item, km, approx }) => ({ item, km, approx }));
}

/** Los pueblos que tienen coordenadas, listos para «Cerca de ti». */
export function nearLocalities(
  localities: readonly {
    slug: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
  }[],
): NearLocality[] {
  return localities.flatMap((l) =>
    l.latitude !== null && l.longitude !== null
      ? [
          {
            slug: l.slug,
            name: l.name,
            latitude: l.latitude,
            longitude: l.longitude,
          },
        ]
      : [],
  );
}

/** El pueblo más cercano a un punto (para decir «estás cerca de Pullally»). */
export function nearestLocality(
  origin: GeoPoint,
  localities: readonly NearLocality[],
): { locality: NearLocality; km: number } | null {
  let best: { locality: NearLocality; km: number } | null = null;
  for (const l of localities) {
    const km = haversineDistanceKm(origin, l);
    if (!best || km < best.km) best = { locality: l, km };
  }
  return best;
}

/** «350 m» o «2,4 km», redondeado y en el idioma de la guía. */
export function formatKm(km: number, locale: string): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km.toLocaleString(locale, {
    maximumFractionDigits: km < 10 ? 1 : 0,
  })} km`;
}
