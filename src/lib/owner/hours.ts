/**
 * Horario con selector para «Mi local» (migración 0035).
 *
 * El locatario elige, para cada día de lunes a domingo, si abre y a qué hora.
 * Puede tener un solo horario para todo el año o uno de verano (enero y
 * febrero) y otro para el resto del año, porque en Papudo cambia mucho. Al
 * enviarlo se convierte en las mismas temporadas que usa el panel
 * (PlaceHours), agrupando los días con el mismo horario.
 */
import type { PlaceHours } from "@/content/types";

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Lunes primero; el valor es el día de la semana (0 = domingo). */
export const WEEK = [1, 2, 3, 4, 5, 6, 0] as const;

export type DayPlan = { open: boolean; opens: string; closes: string };
export type SeasonPlan = {
  fromMonth: number;
  toMonth: number;
  holidays: boolean;
  /** Índice = día de la semana (0 = domingo … 6 = sábado). */
  days: DayPlan[];
};
/** Un horario para todo el año, o verano + resto del año. */
export type HoursPlan = { split: boolean; seasons: SeasonPlan[] };

export const ALL_YEAR = { fromMonth: 1, toMonth: 12 } as const;
export const SUMMER = { fromMonth: 1, toMonth: 2 } as const;
export const REST_OF_YEAR = { fromMonth: 3, toMonth: 12 } as const;

const DEFAULT_DAY: DayPlan = { open: false, opens: "10:00", closes: "19:00" };

export function emptySeason(range: {
  fromMonth: number;
  toMonth: number;
}): SeasonPlan {
  return {
    ...range,
    holidays: false,
    days: Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })),
  };
}

const covers = (h: PlaceHours, month: number) =>
  h.fromMonth <= h.toMonth
    ? month >= h.fromMonth && month <= h.toMonth
    : month >= h.fromMonth || month <= h.toMonth;

/** Plan de un rango de meses a partir de las temporadas de la ficha. */
function seasonFrom(
  seasons: PlaceHours[],
  range: { fromMonth: number; toMonth: number },
  sampleMonth: number,
): SeasonPlan {
  const s = emptySeason(range);
  for (const h of seasons.filter((x) => covers(x, sampleMonth))) {
    for (const d of h.days) {
      if (d < 0 || d > 6 || s.days[d].open) continue;
      s.days[d] = { open: true, opens: h.opens, closes: h.closes };
    }
    if (h.holidays) s.holidays = true;
  }
  return s;
}

/** Arma el selector desde el horario actual de la ficha. */
export function planFromSeasons(seasons: PlaceHours[]): HoursPlan {
  const summer = seasonFrom(seasons, SUMMER, 1);
  const rest = seasonFrom(seasons, REST_OF_YEAR, 6);
  const same =
    summer.holidays === rest.holidays &&
    summer.days.every(
      (d, i) =>
        d.open === rest.days[i].open &&
        (!d.open ||
          (d.opens === rest.days[i].opens && d.closes === rest.days[i].closes)),
    );
  if (same) return { split: false, seasons: [{ ...rest, ...ALL_YEAR }] };
  return { split: true, seasons: [summer, rest] };
}

/** Temporadas del panel a partir del selector: agrupa días con igual horario. */
export function seasonsFromPlan(plan: HoursPlan): PlaceHours[] {
  const out: PlaceHours[] = [];
  const list = plan.split ? plan.seasons.slice(0, 2) : plan.seasons.slice(0, 1);
  for (const s of list) {
    const range = plan.split
      ? { fromMonth: s.fromMonth, toMonth: s.toMonth }
      : ALL_YEAR;
    const groups = new Map<string, number[]>();
    s.days.forEach((d, day) => {
      if (!d.open || !TIME_RE.test(d.opens) || !TIME_RE.test(d.closes)) return;
      const key = `${d.opens}|${d.closes}`;
      groups.set(key, [...(groups.get(key) ?? []), day]);
    });
    for (const [key, days] of groups) {
      const [opens, closes] = key.split("|");
      out.push({
        ...range,
        days: [...days].sort((a, b) => a - b),
        ...(s.holidays ? { holidays: true } : {}),
        opens,
        closes,
      });
    }
  }
  return sortSeasons(out);
}

const sortSeasons = (s: PlaceHours[]) =>
  [...s].sort(
    (a, b) =>
      a.fromMonth - b.fromMonth ||
      a.toMonth - b.toMonth ||
      a.opens.localeCompare(b.opens) ||
      a.closes.localeCompare(b.closes) ||
      a.days.join().localeCompare(b.days.join()),
  );

/** Forma única en texto (para comparar y para guardar en la propuesta). */
export function hoursKey(seasons: PlaceHours[]): string | null {
  if (seasons.length === 0) return null;
  return JSON.stringify(
    sortSeasons(seasons).map((h) => ({
      fromMonth: h.fromMonth,
      toMonth: h.toMonth,
      days: [...new Set(h.days)].sort((a, b) => a - b),
      ...(h.holidays ? { holidays: true } : {}),
      opens: h.opens,
      closes: h.closes,
    })),
  );
}

const validSeason = (h: PlaceHours) => {
  const month = (m: unknown) =>
    typeof m === "number" && Number.isInteger(m) && m >= 1 && m <= 12;
  return (
    month(h.fromMonth) &&
    month(h.toMonth) &&
    Array.isArray(h.days) &&
    h.days.length > 0 &&
    h.days.length <= 7 &&
    h.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
    typeof h.opens === "string" &&
    typeof h.closes === "string" &&
    TIME_RE.test(h.opens) &&
    TIME_RE.test(h.closes) &&
    (h.holidays === undefined || typeof h.holidays === "boolean")
  );
};

/** Lee el horario guardado en una propuesta; null si no es válido. */
export function parseHours(
  json: string | null | undefined,
): PlaceHours[] | null {
  if (!json) return [];
  try {
    const v: unknown = JSON.parse(json);
    if (!Array.isArray(v) || v.length > 24) return null;
    return v.every((s) => s && typeof s === "object" && validSeason(s))
      ? (v as PlaceHours[])
      : null;
  } catch {
    return null;
  }
}
