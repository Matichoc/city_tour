/** "HH:MM" + minutos → "HH:MM" (pasa de medianoche sin romperse). */
export function addMinutesToClock(clock: string, minutes: number): string {
  const [h = "0", m = "0"] = clock.split(":");
  const total = (Number(h) * 60 + Number(m) + Math.round(minutes)) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** 95 → "1 h 35 min", 40 → "40 min". */
export function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatKm(km: number): string {
  return `${km.toFixed(1).replace(".", ",")} km`;
}
