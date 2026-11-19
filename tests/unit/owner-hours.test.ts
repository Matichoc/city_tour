import { describe, expect, it } from "vitest";
import {
  emptySeason,
  hoursKey,
  parseHours,
  planFromSeasons,
  seasonsFromPlan,
  ALL_YEAR,
  SUMMER,
  REST_OF_YEAR,
} from "@/lib/owner/hours";
import {
  readOwnerForm,
  changedFields,
  type OwnerValues,
} from "@/lib/owner/access";
import type { PlaceHours } from "@/content/types";

const BASE: OwnerValues = {
  short_description: null,
  full_description: null,
  hours_text: null,
  address: null,
  cta_kind: null,
  cta_value: null,
  instagram: null,
  website: null,
  hours: null,
};

describe("Mi local: horario con selector", () => {
  it("agrupa los días con el mismo horario en una temporada", () => {
    const s = emptySeason(ALL_YEAR);
    for (const d of [1, 2, 3, 4, 5])
      s.days[d] = { open: true, opens: "09:00", closes: "18:00" };
    s.days[6] = { open: true, opens: "10:00", closes: "14:00" };
    expect(seasonsFromPlan({ split: false, seasons: [s] })).toEqual([
      {
        fromMonth: 1,
        toMonth: 12,
        days: [1, 2, 3, 4, 5],
        opens: "09:00",
        closes: "18:00",
      },
      { fromMonth: 1, toMonth: 12, days: [6], opens: "10:00", closes: "14:00" },
    ]);
  });

  it("verano y resto del año van como dos temporadas, con festivos", () => {
    const summer = emptySeason(SUMMER);
    summer.days = summer.days.map(() => ({
      open: true,
      opens: "09:00",
      closes: "22:00",
    }));
    summer.holidays = true;
    const rest = emptySeason(REST_OF_YEAR);
    rest.days[0] = { open: true, opens: "10:00", closes: "19:00" };
    rest.days[6] = { open: true, opens: "10:00", closes: "19:00" };
    const seasons = seasonsFromPlan({ split: true, seasons: [summer, rest] });
    expect(seasons).toEqual([
      {
        fromMonth: 1,
        toMonth: 2,
        days: [0, 1, 2, 3, 4, 5, 6],
        holidays: true,
        opens: "09:00",
        closes: "22:00",
      },
      {
        fromMonth: 3,
        toMonth: 12,
        days: [0, 6],
        opens: "10:00",
        closes: "19:00",
      },
    ]);
  });

  it("arma el selector desde el horario de la ficha y vuelve al mismo horario", () => {
    const ficha: PlaceHours[] = [
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
    const plan = planFromSeasons(ficha);
    expect(plan.split).toBe(true);
    expect(hoursKey(seasonsFromPlan(plan))).toBe(hoursKey(ficha));

    const todoElAno: PlaceHours[] = [
      {
        fromMonth: 1,
        toMonth: 12,
        days: [1, 2, 3, 4, 5],
        opens: "09:00",
        closes: "18:00",
      },
    ];
    const single = planFromSeasons(todoElAno);
    expect(single.split).toBe(false);
    expect(hoursKey(seasonsFromPlan(single))).toBe(hoursKey(todoElAno));
  });

  it("sin horario no se informa nada", () => {
    expect(hoursKey(seasonsFromPlan(planFromSeasons([])))).toBeNull();
  });

  it("rechaza un horario mal formado", () => {
    expect(parseHours("no es json")).toBeNull();
    expect(
      parseHours(
        '[{"fromMonth":13,"toMonth":2,"days":[1],"opens":"09:00","closes":"18:00"}]',
      ),
    ).toBeNull();
    expect(
      parseHours(
        '[{"fromMonth":1,"toMonth":2,"days":[],"opens":"09:00","closes":"18:00"}]',
      ),
    ).toBeNull();
    expect(
      parseHours(
        '[{"fromMonth":1,"toMonth":2,"days":[7],"opens":"09:00","closes":"18:00"}]',
      ),
    ).toBeNull();
    expect(
      parseHours(
        '[{"fromMonth":1,"toMonth":2,"days":[1],"opens":"9","closes":"18:00"}]',
      ),
    ).toBeNull();
    expect(parseHours("")).toEqual([]);
  });

  it("el formulario manda el horario solo si cambió, y en su forma única", () => {
    const actual: PlaceHours[] = [
      {
        fromMonth: 1,
        toMonth: 12,
        days: [1, 2, 3, 4, 5],
        opens: "09:00",
        closes: "18:00",
      },
    ];
    const current = { ...BASE, hours: hoursKey(actual) };
    // Mismo horario con otro orden de días: no cuenta como cambio.
    const same = new FormData();
    same.set(
      "hours",
      JSON.stringify([{ ...actual[0], days: [5, 4, 3, 2, 1] }]),
    );
    const a = readOwnerForm(same);
    expect(a.errors).toEqual([]);
    expect(changedFields(current, a.values)).toEqual({});

    const otro = new FormData();
    otro.set("hours", JSON.stringify([{ ...actual[0], closes: "20:00" }]));
    const b = readOwnerForm(otro);
    expect(Object.keys(changedFields(current, b.values))).toEqual(["hours"]);

    const malo = new FormData();
    malo.set("hours", "[{]");
    expect(readOwnerForm(malo).errors).toContain("hours");
  });
});
