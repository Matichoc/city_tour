import { getTranslations } from "next-intl/server";
import type { PlaceHours } from "@/content/types";
import { saveHoursAction } from "@/app/admin/places-actions";
import { field } from "@/components/admin/place-form";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
/** Lunes primero; el valor es el día de la semana (0 = domingo). */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const BLANK_ROWS = 2;

const monthName = (m: number) =>
  new Intl.DateTimeFormat("es", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, m - 1, 1)),
  );
// 2024-01-07 fue domingo: el día d es el 7 + d.
const dayName = (d: number) =>
  new Intl.DateTimeFormat("es", { weekday: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 7 + d)),
  );

/**
 * Horarios por temporada (se repiten cada año). Una fila por temporada: de qué
 * mes a qué mes, qué días, a qué hora, y si abre festivos. Sin JavaScript: se
 * guardan todas las filas juntas y siempre queda un par de filas vacías.
 */
export async function HoursEditor({
  placeId,
  seasons,
}: {
  placeId: string;
  seasons: PlaceHours[];
}) {
  const t = await getTranslations({
    locale: "es",
    namespace: "admin.places.hours",
  });
  const rows: (PlaceHours | null)[] = [
    ...seasons,
    ...Array.from({ length: BLANK_ROWS }, () => null),
  ];
  return (
    <form action={saveHoursAction} className="space-y-4">
      <input type="hidden" name="id" value={placeId} />
      <input type="hidden" name="n" value={rows.length} />
      <p className="text-muted text-sm">{t("help")}</p>
      <ul className="space-y-3">
        {rows.map((h, i) => (
          <li
            key={i}
            className="border-border space-y-3 rounded-xl border p-3"
            aria-label={t("season", { n: i + 1 })}
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="text-sm font-semibold">
                {t("from")}
                <select
                  name={`h${i}_de`}
                  defaultValue={h?.fromMonth ?? ""}
                  className={field}
                >
                  <option value="">—</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {monthName(m)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                {t("to")}
                <select
                  name={`h${i}_a`}
                  defaultValue={h?.toMonth ?? ""}
                  className={field}
                >
                  <option value="">—</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {monthName(m)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                {t("opens")}
                <input
                  type="time"
                  name={`h${i}_abre`}
                  defaultValue={h?.opens ?? ""}
                  className={field}
                />
              </label>
              <label className="text-sm font-semibold">
                {t("closes")}
                <input
                  type="time"
                  name={`h${i}_cierra`}
                  defaultValue={h?.closes ?? ""}
                  className={field}
                />
              </label>
            </div>
            <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <legend className="sr-only">{t("days")}</legend>
              {WEEK.map((d) => (
                <label key={d} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name={`h${i}_d${d}`}
                    defaultChecked={h?.days.includes(d) ?? false}
                    className="size-5"
                  />
                  {dayName(d)}
                </label>
              ))}
              <label className="flex items-center gap-1 font-semibold">
                <input
                  type="checkbox"
                  name={`h${i}_fest`}
                  defaultChecked={h?.holidays === true}
                  className="size-5"
                />
                {t("holidays")}
              </label>
              {h && (
                <label className="text-coral-ink ml-auto flex items-center gap-1 font-semibold">
                  <input
                    type="checkbox"
                    name={`h${i}_quitar`}
                    className="size-5"
                  />
                  {t("remove")}
                </label>
              )}
            </fieldset>
          </li>
        ))}
      </ul>
      <button
        type="submit"
        className="bg-sea-deep rounded-full px-5 py-2 font-bold text-white"
      >
        {t("save")}
      </button>
    </form>
  );
}
