export interface ItineraryPlaceInput {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  visitDurationMinutes: number;
}

export interface ItineraryBuildInput {
  places: ItineraryPlaceInput[];
  /** Índice en `places` desde donde comenzar. Por defecto, el primer lugar. */
  startIndex?: number;
  maxStops?: number;
  maxDurationMinutes?: number;
  averageSpeedKmh?: number;
  /**
   * Si es `true`, el recorrido vuelve al lugar de partida al terminar la
   * última parada (viaje redondo) en vez de quedarse ahí — pedido explícito
   * del usuario ("si te vas a quedar en el último punto, o vas a volver a
   * tu punto de origen"). Afecta tanto el orden óptimo elegido (con
   * `findOptimalOrder`) como los totales de distancia/duración.
   */
  returnToStart?: boolean;
}

export interface ItineraryStop {
  placeId: string;
  name: string;
  order: number;
  travelFromPreviousMinutes: number;
  visitDurationMinutes: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
  distanceFromPreviousKm: number;
}

export interface Itinerary {
  stops: ItineraryStop[];
  totalDurationMinutes: number;
  totalDistanceKm: number;
  skippedPlaceIds: string[];
  /**
   * Distancia/duración del tramo de vuelta desde la última parada hasta el
   * punto de partida — `null` si no se pidió viaje redondo (`returnToStart`)
   * o si el recorrido tiene una sola parada (no hay a dónde volver). Ya está
   * sumado a `totalDistanceKm`/`totalDurationMinutes`; se expone aparte para
   * que la UI pueda mostrarlo como su propia línea ("vuelta a X").
   */
  returnLegDistanceKm: number | null;
  returnLegDurationMinutes: number | null;
}
