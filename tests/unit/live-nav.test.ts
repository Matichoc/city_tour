import { describe, expect, it } from "vitest";
import {
  CAR_SUGGEST_FROM_M,
  distanceToPolylineMeters,
  lookaheadPoint,
  splitRouteAt,
  polylineLength,
  snapToPolyline,
  CAR_SPEED_KMH,
  DETOUR_FACTOR,
  WALK_SPEED_KMH,
  bearingDegrees,
  estimateLeg,
  formatMinutes,
  suggestedMode,
  distanceMeters,
  formatMeters,
  headingFromOrientation,
  isArrived,
  isShortWalk,
  moveToward,
  offsetPoint,
  demoStepMeters,
  relativeBearing,
  walkMinutes,
} from "@/lib/live-nav";

const playaChica = { latitude: -32.5078, longitude: -71.4476 };

describe("recorrido en vivo", () => {
  it("calcula rumbos cardinales", () => {
    const north = {
      latitude: playaChica.latitude + 0.01,
      longitude: playaChica.longitude,
    };
    const east = {
      latitude: playaChica.latitude,
      longitude: playaChica.longitude + 0.01,
    };
    expect(bearingDegrees(playaChica, north)).toBeCloseTo(0, 0);
    expect(bearingDegrees(playaChica, east)).toBeCloseTo(90, 0);
    expect(bearingDegrees(north, playaChica)).toBeCloseTo(180, 0);
  });

  it("gira la flecha por el camino más corto", () => {
    expect(relativeBearing(10, 350)).toBe(20);
    expect(relativeBearing(350, 10)).toBe(-20);
    expect(relativeBearing(90, 90)).toBe(0);
    expect(relativeBearing(270, 0)).toBe(-90);
  });

  it("estima la caminata a 4,5 km/h", () => {
    expect(walkMinutes(4500)).toBe(60);
    expect(walkMinutes(10)).toBe(1);
  });

  it("detecta la llegada con margen por precisión del GPS, con tope", () => {
    expect(isArrived(30)).toBe(true);
    expect(isArrived(50)).toBe(false);
    expect(isArrived(50, 40)).toBe(true);
    expect(isArrived(70, 500)).toBe(false);
  });

  it("ofrece la cámara solo en tramos cortos", () => {
    const near = {
      latitude: playaChica.latitude + 0.005,
      longitude: playaChica.longitude,
    };
    expect(isShortWalk(distanceMeters(playaChica, near))).toBe(true);
    expect(isShortWalk(5000)).toBe(false);
  });

  it("formatea metros y kilómetros", () => {
    expect(formatMeters(123, "es")).toBe("125 m");
    expect(formatMeters(1530, "es")).toBe("1,5 km");
    expect(formatMeters(1530, "en")).toBe("1.5 km");
  });

  it("lee la brújula de iOS y de Android", () => {
    expect(headingFromOrientation({ alpha: 0, webkitCompassHeading: 45 })).toBe(
      45,
    );
    expect(headingFromOrientation({ alpha: 90, absolute: true })).toBe(270);
    expect(headingFromOrientation({ alpha: 90, absolute: false })).toBeNull();
    expect(headingFromOrientation({ alpha: null })).toBeNull();
  });
});

describe("modo demostración", () => {
  it("avanza hacia el destino y lo alcanza sin pasarse", () => {
    const stop = { latitude: -32.5078, longitude: -71.4476 };
    const start = offsetPoint(stop, 200, 500);
    expect(distanceMeters(start, stop)).toBeCloseTo(500, -1);
    const step = moveToward(start, stop, 100);
    expect(distanceMeters(step, stop)).toBeCloseTo(400, -1);
    expect(moveToward(step, stop, 1000)).toEqual(stop);
  });

  it("acelera los tramos largos para que la demo no se haga eterna", () => {
    expect(demoStepMeters(300)).toBe(25);
    expect(demoStepMeters(12000)).toBe(600);
  });
});

describe("modos de viaje: a pie y en auto (estimados)", () => {
  it("el camino real es más largo que la línea recta, según el modo", () => {
    expect(estimateLeg(1000, "walk").meters).toBeCloseTo(
      1000 * DETOUR_FACTOR.walk,
    );
    expect(estimateLeg(1000, "car").meters).toBeCloseTo(
      1000 * DETOUR_FACTOR.car,
    );
  });

  it("los minutos salen de la velocidad de cada modo", () => {
    const walk = estimateLeg(2000, "walk");
    expect(walk.minutes).toBe(
      Math.round((walk.meters / 1000 / WALK_SPEED_KMH) * 60),
    );
    const car = estimateLeg(2000, "car");
    expect(car.minutes).toBe(
      Math.round((car.meters / 1000 / CAR_SPEED_KMH) * 60),
    );
    expect(car.minutes).toBeLessThan(walk.minutes);
  });

  it("nunca estima menos de un minuto", () => {
    expect(estimateLeg(5, "walk").minutes).toBe(1);
    expect(estimateLeg(0, "car").minutes).toBe(1);
  });

  it("lo cercano se sugiere a pie", () => {
    expect(suggestedMode(80)).toBe("walk");
    expect(suggestedMode(1500)).toBe("walk");
  });

  it("lo lejano se sugiere en auto", () => {
    expect(suggestedMode(CAR_SUGGEST_FROM_M + 1)).toBe("car");
    expect(suggestedMode(30_000)).toBe("car");
  });

  it("en el tramo intermedio, a pie solo si no pasa de ~45 minutos", () => {
    expect(suggestedMode(2000)).toBe("walk");
    expect(estimateLeg(2000, "walk").minutes).toBeLessThanOrEqual(45);
    expect(suggestedMode(3500)).toBe("car");
    expect(estimateLeg(3500, "walk").minutes).toBeGreaterThan(45);
  });

  it("con la ruta real a pie, decide por esos minutos y no por la línea recta", () => {
    // En línea recta son 2 km (a pie, sí), pero por calles hay una hora.
    expect(suggestedMode(2000, 60)).toBe("car");
    expect(suggestedMode(2000, 20)).toBe("walk");
    // Cerca siempre se sugiere a pie.
    expect(suggestedMode(300, 60)).toBe("walk");
    // Lejos siempre en auto, aunque la ruta a pie sea corta.
    expect(suggestedMode(6000, 30)).toBe("car");
  });

  it("una caminata de 30 km no se presenta como el modo sugerido", () => {
    expect(suggestedMode(30_000)).not.toBe("walk");
    expect(estimateLeg(30_000, "car").minutes).toBeLessThan(180);
  });

  it("formatea los minutos para leerlos rápido", () => {
    expect(formatMinutes(1)).toBe("1 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(90)).toBe("1 h 30 min");
    expect(formatMinutes(750)).toBe("12 h 30 min");
  });
});

describe("seguir una ruta por calles", () => {
  // Calle en «L»: ~222 m al norte y luego ~222 m al este.
  const a = { latitude: -32.5, longitude: -71.45 };
  const b = offsetPoint(a, 0, 222);
  const c = offsetPoint(b, 90, 222);
  const line: [number, number][] = [
    [a.longitude, a.latitude],
    [b.longitude, b.latitude],
    [c.longitude, c.latitude],
  ];

  it("mide el largo de la ruta", () => {
    expect(polylineLength(line)).toBeGreaterThan(440);
    expect(polylineLength(line)).toBeLessThan(450);
    expect(polylineLength([line[0]!])).toBe(0);
  });

  it("un punto sobre la calle está a ~0 m", () => {
    const onStreet = offsetPoint(a, 0, 100);
    expect(distanceToPolylineMeters(onStreet, line)!).toBeLessThan(1);
  });

  it("un punto al costado se mide en perpendicular, no al vértice", () => {
    const side = offsetPoint(offsetPoint(a, 0, 100), 90, 30);
    expect(distanceToPolylineMeters(side, line)!).toBeCloseTo(30, 0);
  });

  it("al pasar la esquina, la distancia es a la calle más cercana", () => {
    const nearCorner = offsetPoint(offsetPoint(b, 0, 40), 90, 60);
    const d = distanceToPolylineMeters(nearCorner, line)!;
    expect(d).toBeLessThan(45);
    expect(d).toBeGreaterThan(35);
  });

  it("ubica en qué tramo y cuánto se ha avanzado", () => {
    const onSecond = offsetPoint(b, 90, 100);
    const snap = snapToPolyline(onSecond, line)!;
    expect(snap.segment).toBe(1);
    expect(snap.along).toBeGreaterThan(315);
    expect(snap.along).toBeLessThan(325);
  });

  it("el punto adelantado sigue la calle, también al doblar", () => {
    const start = snapToPolyline(offsetPoint(a, 0, 210), line)!;
    const ahead = lookaheadPoint(line, start.along, 40);
    // 12 m antes de la esquina + 28 m ya hacia el este.
    expect(distanceMeters(ahead, b)).toBeGreaterThan(20);
    expect(bearingDegrees(offsetPoint(a, 0, 210), ahead)).toBeGreaterThan(30);
    expect(bearingDegrees(offsetPoint(a, 0, 210), ahead)).toBeLessThan(80);
  });

  it("el punto adelantado no pasa del final", () => {
    const ahead = lookaheadPoint(line, 430, 100);
    expect(distanceMeters(ahead, c)).toBeLessThan(1);
  });

  it("parte la ruta en lo ya recorrido y lo que falta", () => {
    const here = offsetPoint(b, 90, 100);
    const snap = snapToPolyline(here, line)!;
    const { done, todo } = splitRouteAt(line, snap);
    expect(done[0]).toEqual(line[0]);
    expect(todo.at(-1)).toEqual(line[2]);
    // El punto de corte une las dos mitades.
    expect(done.at(-1)).toEqual(todo[0]);
    expect(done).toHaveLength(3);
    expect(todo).toHaveLength(2);
  });

  it("sin ruta no hay nada que medir", () => {
    expect(snapToPolyline(a, [])).toBeNull();
    expect(distanceToPolylineMeters(a, [line[0]!])).toBeNull();
  });
});
