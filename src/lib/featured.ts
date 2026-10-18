/** Fecha de calendario (sin hora), para no depender de la zona horaria del servidor. */
export type CalendarDay = { year: number; month: number; day: number };

/** Hoy en Chile continental (America/Santiago), donde está la comuna. */
export function todayInChile(now: Date = new Date()): CalendarDay {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const n = (type: string) => Number(p.find((x) => x.type === type)!.value);
  return { year: n("year"), month: n("month"), day: n("day") };
}

const DAY_MS = 86_400_000;
const utcDay = (year: number, month: number, day: number) =>
  Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);

/** Días que abarca «lo del mes»: desde hoy hasta 30 días hacia adelante. */
export const FEATURED_WINDOW_DAYS = 30;

/**
 * Eventos que caen entre hoy y `days` días más, en orden de fecha. Un evento
 * con día fijo cuenta si su fecha cae en la ventana; uno que solo tiene mes,
 * si ese mes se cruza con la ventana (y se ordena desde hoy o el día 1). Los
 * que no tienen mes (solo temporada o por confirmar) no se incluyen: no hay
 * fecha que comparar.
 */
export function eventsInWindow<
  T extends { month: number | null; day: number | null },
>(events: T[], today: CalendarDay, days = FEATURED_WINDOW_DAYS): T[] {
  const start = utcDay(today.year, today.month, today.day);
  const end = start + days;
  const dated: { event: T; at: number; order: number }[] = [];
  events.forEach((event, order) => {
    if (!event.month) return;
    let at: number | null = null;
    for (const year of [today.year, today.year + 1]) {
      if (event.day) {
        const d = utcDay(year, event.month, event.day);
        if (d >= start && d <= end) at = d;
      } else {
        const first = utcDay(year, event.month, 1);
        const last = utcDay(year, event.month + 1, 1) - 1;
        if (first <= end && last >= start) at = Math.max(first, start);
      }
      if (at !== null) break;
    }
    if (at !== null) dated.push({ event, at, order });
  });
  return dated
    .sort((a, b) => a.at - b.at || a.order - b.order)
    .map((d) => d.event);
}
