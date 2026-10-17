/**
 * Vigencia de los datos de un comercio: deben confirmarse al menos cada
 * 6 meses. Se avisa un mes antes de que venzan.
 */
export const UPDATE_EVERY_MONTHS = 6;
export const DUE_SOON_DAYS = 30;

export type Freshness = "never" | "ok" | "soon" | "overdue";

/** Fecha en que vence la última actualización. */
export function infoDueDate(updatedAt: string): Date {
  const due = new Date(updatedAt);
  due.setUTCMonth(due.getUTCMonth() + UPDATE_EVERY_MONTHS);
  return due;
}

export function freshness(
  updatedAt: string | null,
  now: Date = new Date(),
): Freshness {
  if (!updatedAt || Number.isNaN(Date.parse(updatedAt))) return "never";
  const left = infoDueDate(updatedAt).getTime() - now.getTime();
  if (left <= 0) return "overdue";
  return left <= DUE_SOON_DAYS * 24 * 3600 * 1000 ? "soon" : "ok";
}

const ORDER: Record<Freshness, number> = {
  never: 0,
  overdue: 1,
  soon: 2,
  ok: 3,
};

/** Primero lo que hay que pedir: sin fecha, vencidos, por vencer, al día. */
export const byUrgency = (a: Freshness, b: Freshness) => ORDER[a] - ORDER[b];
