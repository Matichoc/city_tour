import { describe, expect, it } from "vitest";
import {
  bearingDegrees,
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
