import { describe, expect, it } from "vitest";
import { formatHours, groupHours, hoursStatus } from "@/lib/hours";

const es = {
  everyDay: "Todos los días",
  holidays: "festivos",
  and: "y",
  allYear: "Todo el año",
  monthRange: (a: string, b: string) => `${a} a ${b}`,
};

describe("horarios por temporada", () => {
  it("escribe la temporada, los días y la hora", () => {
    expect(
      formatHours(
        {
          fromMonth: 1,
          toMonth: 2,
          days: [0, 1, 2, 3, 4, 5, 6],
          opens: "09:00",
          closes: "22:00",
        },
        "es",
        es,
      ),
    ).toEqual({
      season: "Enero a febrero",
      days: "Todos los días",
      time: "09:00–22:00",
    });
    expect(
      formatHours(
        {
          fromMonth: 3,
          toMonth: 12,
          days: [0, 6],
          holidays: true,
          opens: "10:00",
          closes: "19:00",
        },
        "es",
        es,
      ).days,
    ).toBe("Sábado, domingo y festivos");
    expect(
      formatHours(
        {
          fromMonth: 1,
          toMonth: 12,
          days: [1],
          opens: "10:00",
          closes: "12:00",
        },
        "es",
        es,
      ).season,
    ).toBe("Todo el año");
  });

  it("agrupa las filas de la base (una por día)", () => {
    const row = (
      d: number,
      from: number,
      to: number,
      opens: string,
      closes: string,
      holidays = false,
    ) => ({
      day_of_week: d,
      opens_at: `${opens}:00`,
      closes_at: `${closes}:00`,
      closed: false,
      from_month: from,
      to_month: to,
      holidays,
    });
    expect(
      groupHours([
        row(6, 3, 12, "10:00", "19:00", true),
        row(0, 3, 12, "10:00", "19:00", true),
        ...[0, 1, 2, 3, 4, 5, 6].map((d) => row(d, 1, 2, "09:00", "22:00")),
      ]),
    ).toEqual([
      {
        fromMonth: 1,
        toMonth: 2,
        days: [0, 1, 2, 3, 4, 5, 6],
        opens: "09:00",
        closes: "22:00",
      },
      {
        fromMonth: 3,
        toMonth: 12,
        days: [0, 6],
        holidays: true,
        opens: "10:00",
        closes: "19:00",
      },
    ]);
  });
});

describe("¿abierto ahora?", () => {
  // Horario de Roots Salinas: verano todos los días; el resto, fin de semana.
  const roots = [
    {
      fromMonth: 1,
      toMonth: 2,
      days: [0, 1, 2, 3, 4, 5, 6],
      opens: "09:00",
      closes: "22:00",
    },
    {
      fromMonth: 3,
      toMonth: 12,
      days: [0, 6],
      holidays: true,
      opens: "10:00",
      closes: "19:00",
    },
  ];
  const at = (iso: string) => hoursStatus(roots, new Date(iso));

  it("un miércoles de noviembre está cerrado y abre el sábado", () => {
    expect(at("2026-11-04T15:00:00-03:00")).toEqual({
      kind: "closed",
      next: { inDays: 3, weekday: 6, opens: "10:00" },
    });
  });
  it("el sábado temprano abre más tarde, y a mediodía está abierto", () => {
    expect(at("2026-11-07T09:00:00-03:00")).toEqual({
      kind: "later",
      opens: "10:00",
    });
    expect(at("2026-11-07T12:00:00-03:00")).toEqual({
      kind: "open",
      closes: "19:00",
    });
  });
  it("en verano abre todos los días y, después de cerrar, abre mañana", () => {
    expect(at("2026-01-15T21:30:00-03:00")).toEqual({
      kind: "open",
      closes: "22:00",
    });
    expect(at("2026-01-15T23:00:00-03:00")).toEqual({
      kind: "closed",
      next: { inDays: 1, weekday: 5, opens: "09:00" },
    });
  });
  it("al cambiar de temporada usa el horario del mes siguiente", () => {
    expect(at("2026-02-28T23:00:00-03:00")).toEqual({
      kind: "closed",
      next: { inDays: 1, weekday: 0, opens: "10:00" },
    });
  });
  it("sin horario por temporada no hay estado", () => {
    expect(hoursStatus([], new Date())).toBe(null);
  });
});
