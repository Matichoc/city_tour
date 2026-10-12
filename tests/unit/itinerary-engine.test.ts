import { describe, expect, it } from "vitest";
import {
  EXACT_ORDER_STOPS_LIMIT,
  ItineraryEngine,
} from "@/lib/itinerary-engine";
import type { ItineraryPlaceInput } from "@/lib/itinerary-engine/types";

const places: ItineraryPlaceInput[] = [
  {
    id: "a",
    name: "A",
    latitude: -32.25,
    longitude: -70.93,
    visitDurationMinutes: 30,
  },
  {
    id: "b",
    name: "B",
    latitude: -32.26,
    longitude: -70.94,
    visitDurationMinutes: 30,
  },
  {
    id: "c",
    name: "C",
    latitude: -32.6,
    longitude: -71.2,
    visitDurationMinutes: 30,
  },
];

describe("ItineraryEngine.build", () => {
  it("returns an empty itinerary for no places", () => {
    const result = ItineraryEngine.build({ places: [] });
    expect(result.stops).toHaveLength(0);
    expect(result.totalDurationMinutes).toBe(0);
  });

  it("visits the closest place first, then the next closest", () => {
    const result = ItineraryEngine.build({ places });
    expect(result.stops.map((stop) => stop.placeId)).toEqual(["a", "b", "c"]);
    expect(result.skippedPlaceIds).toHaveLength(0);
  });

  it("respects maxStops", () => {
    const result = ItineraryEngine.build({ places, maxStops: 2 });
    expect(result.stops).toHaveLength(2);
    expect(result.skippedPlaceIds).toEqual(["c"]);
  });

  it("stops adding places once maxDurationMinutes would be exceeded", () => {
    const result = ItineraryEngine.build({
      places,
      maxDurationMinutes: 40,
    });
    expect(result.stops).toHaveLength(1);
    expect(result.totalDurationMinutes).toBeLessThanOrEqual(40);
  });

  it("is deterministic for the same input", () => {
    const first = ItineraryEngine.build({ places });
    const second = ItineraryEngine.build({ places });
    expect(first).toEqual(second);
  });

  it("finds the true shortest order even when nearest-neighbor would pick a worse one", () => {
    // Trampa clásica del vecino más cercano: ir al vecino más cercano
    // primero ("b") deja a "d" varado, obligando a un desvío largo al
    // final. El orden óptimo real visita "d" antes, aunque quede un poco
    // más lejos que "b" desde el punto de partida.
    const trapPlaces: ItineraryPlaceInput[] = [
      {
        id: "a",
        name: "A",
        latitude: 0,
        longitude: 0,
        visitDurationMinutes: 0,
      },
      {
        id: "b",
        name: "B",
        latitude: 0,
        longitude: 1,
        visitDurationMinutes: 0,
      },
      {
        id: "c",
        name: "C",
        latitude: 0,
        longitude: 2,
        visitDurationMinutes: 0,
      },
      {
        id: "d",
        name: "D",
        latitude: 1.1,
        longitude: 0,
        visitDurationMinutes: 0,
      },
    ];

    const result = ItineraryEngine.build({ places: trapPlaces });
    expect(result.stops.map((stop) => stop.placeId)).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("adds the return leg to the totals when returnToStart is set", () => {
    const withoutReturn = ItineraryEngine.build({ places });
    const withReturn = ItineraryEngine.build({
      places,
      returnToStart: true,
    });

    expect(withReturn.returnLegDistanceKm).not.toBeNull();
    expect(withReturn.returnLegDurationMinutes).not.toBeNull();
    expect(withReturn.totalDistanceKm).toBeGreaterThan(
      withoutReturn.totalDistanceKm,
    );
    // El propio orden de paradas no debería cambiar para este set (las
    // distancias son chicas y monótonas), solo los totales.
    expect(withReturn.stops.map((stop) => stop.placeId)).toEqual(
      withoutReturn.stops.map((stop) => stop.placeId),
    );
  });

  it("returnToStart can change the optimal order, not just the totals", () => {
    // Cuadrado: a-b-c-d en sentido horario. Sin vuelta, el orden óptimo
    // desde "a" es a-b-c-d (o cualquier rotación) igual de corto que
    // a-d-c-b para un camino abierto. Con vuelta al origen, ambos also dan
    // el mismo total (es un ciclo) — así que en vez de eso se prueba que
    // el total con vuelta sea igual a recorrer las 4 aristas del cuadrado.
    const square: ItineraryPlaceInput[] = [
      {
        id: "a",
        name: "A",
        latitude: 0,
        longitude: 0,
        visitDurationMinutes: 0,
      },
      {
        id: "b",
        name: "B",
        latitude: 0,
        longitude: 1,
        visitDurationMinutes: 0,
      },
      {
        id: "c",
        name: "C",
        latitude: 1,
        longitude: 1,
        visitDurationMinutes: 0,
      },
      {
        id: "d",
        name: "D",
        latitude: 1,
        longitude: 0,
        visitDurationMinutes: 0,
      },
    ];

    const result = ItineraryEngine.build({
      places: square,
      returnToStart: true,
    });
    // Perímetro del cuadrado unitario: 4 lados de longitud 1 (en grados,
    // aproximado por haversine) — el total con vuelta debe acercarse a 4
    // veces un lado, no a un camino abierto más corto que se salte una
    // arista.
    const oneSideKm = result.totalDistanceKm / 4;
    expect(result.totalDistanceKm).toBeCloseTo(oneSideKm * 4, 5);
    expect(result.returnLegDistanceKm).toBeCloseTo(oneSideKm, 1);
  });

  it("falls back to nearest-neighbor without hanging past EXACT_ORDER_STOPS_LIMIT", () => {
    const manyPlaces: ItineraryPlaceInput[] = Array.from(
      { length: EXACT_ORDER_STOPS_LIMIT + 1 },
      (_, index) => ({
        id: `place-${index}`,
        name: `Place ${index}`,
        latitude: index * 0.1,
        longitude: index * 0.1,
        visitDurationMinutes: 10,
      }),
    );

    const result = ItineraryEngine.build({ places: manyPlaces });
    expect(result.stops).toHaveLength(manyPlaces.length);
    expect(result.skippedPlaceIds).toHaveLength(0);
  });
});

describe("ItineraryEngine.buildInOrder", () => {
  it("returns an empty itinerary for no places", () => {
    const result = ItineraryEngine.buildInOrder([]);
    expect(result.stops).toHaveLength(0);
    expect(result.totalDurationMinutes).toBe(0);
  });

  it("respects the given order instead of reordering by distance", () => {
    // "c" es el lugar más lejano de los tres — buildItinerary lo dejaría al
    // final; acá va primero a propósito, porque el usuario lo eligió así.
    const manualOrder = [places[2]!, places[0]!, places[1]!];
    const result = ItineraryEngine.buildInOrder(manualOrder);
    expect(result.stops.map((stop) => stop.placeId)).toEqual(["c", "a", "b"]);
    expect(result.skippedPlaceIds).toHaveLength(0);
  });

  it("never skips a place", () => {
    const result = ItineraryEngine.buildInOrder(places);
    expect(result.stops).toHaveLength(places.length);
    expect(result.skippedPlaceIds).toHaveLength(0);
  });

  it("adds the return leg when returnToStart is set", () => {
    const withoutReturn = ItineraryEngine.buildInOrder(places);
    const withReturn = ItineraryEngine.buildInOrder(places, undefined, true);

    expect(withReturn.returnLegDistanceKm).not.toBeNull();
    expect(withReturn.totalDistanceKm).toBeGreaterThan(
      withoutReturn.totalDistanceKm,
    );
  });
});
