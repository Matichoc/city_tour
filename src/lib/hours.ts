/**
 * Horarios por temporada, en texto para la ficha («Enero a febrero · Todos
 * los días · 09:00–22:00»). Meses y días salen de Intl en cada idioma; las
 * frases fijas vienen de los mensajes.
 */
import type { PlaceHours } from "@/content/types";

export type HoursWords = {
  everyDay: string;
  holidays: string;
  and: string;
  monthRange: (from: string, to: string) => string;
  allYear: string;
};

/** Orden de lectura: lunes primero. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function list(items: string[], and: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;
}

export function formatHours(
  h: PlaceHours,
  locale: string,
  w: HoursWords,
): { season: string; days: string; time: string } {
  const month = (m: number) =>
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
      new Date(Date.UTC(2024, m - 1, 1)),
    );
  // 2024-01-07 fue domingo: día d = 7 + d.
  const weekday = (d: number) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, 7 + d)));
  const allYear =
    (h.toMonth - h.fromMonth + 12) % 12 === 11 ||
    (h.fromMonth === 1 && h.toMonth === 12);
  const season = allYear
    ? w.allYear
    : capitalize(w.monthRange(month(h.fromMonth), month(h.toMonth)));
  const sorted = WEEK_ORDER.filter((d) => h.days.includes(d));
  const days =
    sorted.length === 7
      ? w.everyDay
      : capitalize(
          list(
            [...sorted.map(weekday), ...(h.holidays ? [w.holidays] : [])],
            w.and,
          ),
        );
  return { season, days, time: `${h.opens}–${h.closes}` };
}

/** Estado del local ahora, según su horario por temporada (hora de Chile). */
export type HoursStatus =
  | { kind: "open"; closes: string }
  | { kind: "later"; opens: string }
  | {
      kind: "closed";
      next: { inDays: number; weekday: number; opens: string } | null;
    };

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const inSeason = (h: PlaceHours, month: number) =>
  h.fromMonth <= h.toMonth
    ? month >= h.fromMonth && month <= h.toMonth
    : month >= h.fromMonth || month <= h.toMonth;

/** Mes, día de la semana (0 = domingo) y minuto del día en Chile. */
function chileParts(date: Date) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    month: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  return {
    month: Number(get("month")),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      get("weekday"),
    ),
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/**
 * ¿Abierto ahora? Si no, ¿abre más tarde hoy o cuándo vuelve a abrir (hasta
 * una semana)? Los festivos no se consideran: no se sabe cuáles son. `null`
 * si el local no tiene horario por temporada.
 */
export function hoursStatus(
  hours: PlaceHours[],
  now: Date = new Date(),
): HoursStatus | null {
  if (hours.length === 0) return null;
  const today = chileParts(now);
  const rowsOn = (month: number, weekday: number) =>
    hours
      .filter((h) => inSeason(h, month) && h.days.includes(weekday))
      .sort((a, b) => minutes(a.opens) - minutes(b.opens));
  for (const h of rowsOn(today.month, today.weekday)) {
    // "00:00" como cierre es medianoche: el final del día.
    const closes = minutes(h.closes) || 24 * 60;
    if (today.minute >= minutes(h.opens) && today.minute < closes)
      return { kind: "open", closes: h.closes };
    if (today.minute < minutes(h.opens))
      return { kind: "later", opens: h.opens };
  }
  for (let d = 1; d <= 7; d++) {
    const day = chileParts(new Date(now.getTime() + d * 86_400_000));
    const first = rowsOn(day.month, day.weekday)[0];
    if (first)
      return {
        kind: "closed",
        next: { inDays: d, weekday: day.weekday, opens: first.opens },
      };
  }
  return { kind: "closed", next: null };
}

/** Filas de place_hours (una por día) → temporadas agrupadas. */
export function groupHours(
  rows: {
    day_of_week: number;
    opens_at: string | null;
    closes_at: string | null;
    closed: boolean;
    from_month: number | null;
    to_month: number | null;
    holidays: boolean;
  }[],
): PlaceHours[] {
  const groups = new Map<string, PlaceHours>();
  for (const r of rows) {
    if (r.closed || !r.opens_at || !r.closes_at) continue;
    const opens = r.opens_at.slice(0, 5);
    const closes = r.closes_at.slice(0, 5);
    const from = r.from_month ?? 1;
    const to = r.to_month ?? 12;
    const key = `${from}|${to}|${opens}|${closes}|${r.holidays}`;
    const g = groups.get(key) ?? {
      fromMonth: from,
      toMonth: to,
      days: [],
      ...(r.holidays ? { holidays: true } : {}),
      opens,
      closes,
    };
    if (!g.days.includes(r.day_of_week)) g.days.push(r.day_of_week);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, days: [...g.days].sort((a, b) => a - b) }))
    .sort(
      (a, b) => a.fromMonth - b.fromMonth || a.opens.localeCompare(b.opens),
    );
}
