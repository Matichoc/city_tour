import { haversineDistanceKm } from "@/lib/itinerary-engine/geo";
import type { ItineraryPlaceInput } from "@/lib/itinerary-engine/types";

/**
 * Tope de paradas para las que se prueban TODOS los órdenes posibles
 * (pedido explícito del usuario, en vez de la heurística de vecino más
 * cercano de antes) antes de resignarse a esa misma heurística como
 * respaldo. El número de órdenes a partir de una parada fija crece como
 * factorial: `(n-1)!` — con 10 paradas son 9! = 362.880 recorridos, que un
 * navegador evalúa en milisegundos; una parada más ya empieza a notarse,
 * así que ahí se corta (ver `findOptimalOrder`/`buildItinerary`).
 */
export const EXACT_ORDER_STOPS_LIMIT = 10;

/**
 * Encuentra el orden de recorrido más corto (distancia en línea recta,
 * sumada) que empieza en `startIndex` y visita el resto de `places`
 * exactamente una vez, probando todos los órdenes posibles — no una
 * heurística. Poda ramas que ya superan la mejor distancia encontrada
 * hasta el momento ("branch and bound"): sigue siendo el óptimo exacto,
 * solo evita evaluar hasta el final recorridos que ya perdieron.
 *
 * Solo tiene sentido con pocas paradas (ver `EXACT_ORDER_STOPS_LIMIT`) —
 * el llamador debe usar una alternativa (vecino más cercano) por sobre
 * ese tope.
 */
export function findOptimalOrder(
  places: ItineraryPlaceInput[],
  startIndex = 0,
  returnToStart = false,
): number[] {
  if (places.length <= 2) {
    return places.map((_, index) => index);
  }

  const used = new Array<boolean>(places.length).fill(false);
  used[startIndex] = true;
  const order = [startIndex];

  let bestOrder = places.map((_, index) => index);
  let bestDistanceKm = Number.POSITIVE_INFINITY;

  function search(currentDistanceKm: number) {
    if (order.length === places.length) {
      // El tramo de vuelta solo se suma acá, al comparar el recorrido
      // completo — las podas de más abajo siguen siendo válidas porque
      // agregar el tramo de vuelta nunca puede *mejorar* la distancia
      // parcial ya recorrida.
      const totalDistanceKm = returnToStart
        ? currentDistanceKm +
          haversineDistanceKm(
            places[order[order.length - 1]!]!,
            places[startIndex]!,
          )
        : currentDistanceKm;

      if (totalDistanceKm < bestDistanceKm) {
        bestDistanceKm = totalDistanceKm;
        bestOrder = [...order];
      }
      return;
    }

    const last = order[order.length - 1]!;
    for (let index = 0; index < places.length; index++) {
      if (used[index]) continue;

      const legDistanceKm = haversineDistanceKm(places[last]!, places[index]!);
      const nextDistanceKm = currentDistanceKm + legDistanceKm;
      if (nextDistanceKm >= bestDistanceKm) continue;

      used[index] = true;
      order.push(index);
      search(nextDistanceKm);
      order.pop();
      used[index] = false;
    }
  }

  search(0);
  return bestOrder;
}
