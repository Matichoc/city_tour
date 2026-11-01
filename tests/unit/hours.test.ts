import { describe, expect, it } from "vitest";
import { formatHours, groupHours } from "@/lib/hours";

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
