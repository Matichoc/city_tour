import type { Itinerary } from "@/lib/itinerary-engine/types";

/** Distancia y tiempo reales de un tramo (por calle, a pie o en auto). */
export interface LegTime {
  distanceKm: number;
  minutes: number;
}

/**
 * Reemplaza los tiempos estimados en línea recta por los del camino real:
 * `legs[i]` es el tramo de la parada `i` a la `i + 1` y, si el itinerario
 * vuelve al inicio, el último es la vuelta. No cambia el orden. Si los tramos
 * no calzan con las paradas, devuelve el itinerario tal cual.
 */
export function withLegTimes(itinerary: Itinerary, legs: LegTime[]): Itinerary {
  const between = Math.max(0, itinerary.stops.length - 1);
  const needsReturn = itinerary.returnLegDistanceKm !== null;
  if (legs.length !== between + (needsReturn ? 1 : 0)) return itinerary;

  let clock = 0;
  let totalDistanceKm = 0;
  const stops = itinerary.stops.map((stop, i) => {
    const leg = i > 0 ? legs[i - 1]! : { distanceKm: 0, minutes: 0 };
    const arrivalOffsetMinutes = clock + leg.minutes;
    const departureOffsetMinutes =
      arrivalOffsetMinutes + stop.visitDurationMinutes;
    clock = departureOffsetMinutes;
    totalDistanceKm += leg.distanceKm;
    return {
      ...stop,
      travelFromPreviousMinutes: leg.minutes,
      distanceFromPreviousKm: leg.distanceKm,
      arrivalOffsetMinutes,
      departureOffsetMinutes,
    };
  });

  const back = needsReturn ? legs[between]! : null;
  return {
    ...itinerary,
    stops,
    totalDurationMinutes: clock + (back?.minutes ?? 0),
    totalDistanceKm: totalDistanceKm + (back?.distanceKm ?? 0),
    returnLegDistanceKm: back ? back.distanceKm : null,
    returnLegDurationMinutes: back ? back.minutes : null,
  };
}
