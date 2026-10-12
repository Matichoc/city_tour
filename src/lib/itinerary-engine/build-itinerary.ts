import { haversineDistanceKm } from "@/lib/itinerary-engine/geo";
import {
  EXACT_ORDER_STOPS_LIMIT,
  findOptimalOrder,
} from "@/lib/itinerary-engine/optimize-order";
import type {
  Itinerary,
  ItineraryBuildInput,
  ItineraryPlaceInput,
  ItineraryStop,
} from "@/lib/itinerary-engine/types";

const DEFAULT_AVERAGE_SPEED_KMH = 40;

/** Heurística de vecino más cercano — respaldo para más paradas de las que
 * `findOptimalOrder` puede probar exhaustivamente (ver
 * `EXACT_ORDER_STOPS_LIMIT`). */
function nearestNeighborOrder(
  places: ItineraryPlaceInput[],
  startIndex: number,
): number[] {
  const remaining = new Set(places.map((_, index) => index));
  remaining.delete(startIndex);
  const order = [startIndex];
  let cursor = places[startIndex]!;

  while (remaining.size > 0) {
    let nearestIndex: number | null = null;
    let nearestDistanceKm = Number.POSITIVE_INFINITY;

    for (const index of remaining) {
      const distanceKm = haversineDistanceKm(cursor, places[index]!);
      if (distanceKm < nearestDistanceKm) {
        nearestDistanceKm = distanceKm;
        nearestIndex = index;
      }
    }

    if (nearestIndex === null) break;
    remaining.delete(nearestIndex);
    order.push(nearestIndex);
    cursor = places[nearestIndex]!;
  }

  return order;
}

/**
 * Arma un itinerario visitando `places` en el orden más corto posible
 * (distancia en línea recta) a partir de `startIndex`, respetando los
 * topes de paradas/duración. Determinista dado el mismo input: no usa
 * aleatoriedad ni el reloj.
 *
 * El orden se decide probando TODOS los órdenes posibles
 * (`findOptimalOrder`, pedido explícito del usuario en vez de conformarse
 * con una heurística) mientras el número de paradas sea manejable (ver
 * `EXACT_ORDER_STOPS_LIMIT`); con más paradas que eso, se cae a la
 * heurística de vecino más cercano que ya tenía este motor, para no
 * colgar el navegador — el carrito real de "Mi recorrido" rara vez junta
 * tantos lugares.
 */
export function buildItinerary(input: ItineraryBuildInput): Itinerary {
  const {
    places,
    startIndex = 0,
    maxStops = places.length,
    maxDurationMinutes = Number.POSITIVE_INFINITY,
    averageSpeedKmh = DEFAULT_AVERAGE_SPEED_KMH,
    returnToStart = false,
  } = input;

  if (places.length === 0) {
    return {
      stops: [],
      totalDurationMinutes: 0,
      totalDistanceKm: 0,
      skippedPlaceIds: [],
      returnLegDistanceKm: null,
      returnLegDurationMinutes: null,
    };
  }

  const [firstIndex, ...restIndices] =
    places.length <= EXACT_ORDER_STOPS_LIMIT
      ? findOptimalOrder(places, startIndex, returnToStart)
      : nearestNeighborOrder(places, startIndex);

  const firstPlace: ItineraryPlaceInput = places[firstIndex!]!;
  const stops: ItineraryStop[] = [
    {
      placeId: firstPlace.id,
      name: firstPlace.name,
      order: 0,
      travelFromPreviousMinutes: 0,
      visitDurationMinutes: firstPlace.visitDurationMinutes,
      arrivalOffsetMinutes: 0,
      departureOffsetMinutes: firstPlace.visitDurationMinutes,
      distanceFromPreviousKm: 0,
    },
  ];
  let totalDurationMinutes = firstPlace.visitDurationMinutes;
  let totalDistanceKm = 0;
  let previous = firstPlace;

  for (const index of restIndices) {
    if (stops.length >= maxStops) break;

    const place = places[index]!;
    const distanceFromPreviousKm = haversineDistanceKm(previous, place);
    const travelFromPreviousMinutes =
      (distanceFromPreviousKm / averageSpeedKmh) * 60;
    const arrivalOffsetMinutes =
      totalDurationMinutes + travelFromPreviousMinutes;
    const departureOffsetMinutes =
      arrivalOffsetMinutes + place.visitDurationMinutes;

    if (departureOffsetMinutes > maxDurationMinutes) break;

    stops.push({
      placeId: place.id,
      name: place.name,
      order: stops.length,
      travelFromPreviousMinutes,
      visitDurationMinutes: place.visitDurationMinutes,
      arrivalOffsetMinutes,
      departureOffsetMinutes,
      distanceFromPreviousKm,
    });

    totalDurationMinutes = departureOffsetMinutes;
    totalDistanceKm += distanceFromPreviousKm;
    previous = place;
  }

  const visitedIds = new Set(stops.map((stop) => stop.placeId));
  const skippedPlaceIds = places
    .map((place) => place.id)
    .filter((id) => !visitedIds.has(id));

  let returnLegDistanceKm: number | null = null;
  let returnLegDurationMinutes: number | null = null;
  if (returnToStart && stops.length > 1) {
    returnLegDistanceKm = haversineDistanceKm(previous, firstPlace);
    returnLegDurationMinutes = (returnLegDistanceKm / averageSpeedKmh) * 60;
    totalDurationMinutes += returnLegDurationMinutes;
    totalDistanceKm += returnLegDistanceKm;
  }

  return {
    stops,
    totalDurationMinutes,
    totalDistanceKm,
    skippedPlaceIds,
    returnLegDistanceKm,
    returnLegDurationMinutes,
  };
}
