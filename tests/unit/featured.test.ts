import { describe, expect, it } from "vitest";
import { eventsInWindow, todayInChile } from "@/lib/featured";

const ev = (name: string, month: number | null, day: number | null = null) => ({
  name,
  month,
  day,
});

describe("destacados del mes", () => {
  const today = { year: 2026, month: 10, day: 18 };

  it("incluye lo que cae de hoy a 30 días, en orden de fecha", () => {
    const out = eventsInWindow(
      [
        ev("fin de ventana", 11, 17),
        ev("hoy", 10, 18),
        ev("fuera por dos días", 11, 18),
        ev("ayer", 10, 17),
      ],
      today,
    );
    expect(out.map((e) => e.name)).toEqual(["hoy", "fin de ventana"]);
  });

  it("un evento con solo mes entra si el mes se cruza con la ventana", () => {
    const out = eventsInWindow(
      [ev("octubre", 10), ev("noviembre", 11), ev("diciembre", 12)],
      today,
    );
    expect(out.map((e) => e.name)).toEqual(["octubre", "noviembre"]);
  });

  it("cruza el fin de año", () => {
    const out = eventsInWindow(
      [ev("año nuevo", 1, 1), ev("navidad", 12, 25), ev("marzo", 3, 1)],
      { year: 2026, month: 12, day: 20 },
    );
    expect(out.map((e) => e.name)).toEqual(["navidad", "año nuevo"]);
  });

  it("deja fuera los que no tienen mes", () => {
    expect(
      eventsInWindow([ev("verano", null), ev("por confirmar", null)], today),
    ).toEqual([]);
  });
});

describe("hoy en Chile", () => {
  it("usa la fecha de Chile, no la del servidor", () => {
    // 01:00 UTC del 1 de enero sigue siendo 31 de diciembre en Chile (UTC-3 en verano).
    expect(todayInChile(new Date("2026-01-01T01:00:00Z"))).toEqual({
      year: 2025,
      month: 12,
      day: 31,
    });
  });
});
