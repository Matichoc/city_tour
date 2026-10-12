import { buildItinerary } from "@/lib/itinerary-engine/build-itinerary";
import { buildItineraryInOrder } from "@/lib/itinerary-engine/build-itinerary-in-order";

export * from "@/lib/itinerary-engine/types";
export { haversineDistanceKm } from "@/lib/itinerary-engine/geo";
export {
  findOptimalOrder,
  EXACT_ORDER_STOPS_LIMIT,
} from "@/lib/itinerary-engine/optimize-order";

/**
 * Punto de extensión único hacia el motor de itinerarios. Módulo TS puro,
 * sin dependencias de UI ni de Supabase: pensado para reusarse desde una
 * futura interfaz conversacional.
 */
export const ItineraryEngine = {
  build: buildItinerary,
  buildInOrder: buildItineraryInOrder,
};
