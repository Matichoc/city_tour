"use client";

import { useMemo, useState } from "react";
import type { PlaceHours } from "@/content/types";
import {
  REST_OF_YEAR,
  SUMMER,
  WEEK,
  emptySeason,
  hoursKey,
  planFromSeasons,
  seasonsFromPlan,
  type DayPlan,
  type HoursPlan,
  type SeasonPlan,
} from "@/lib/owner/hours";

export type HoursPickerLabels = {
  legend: string;
  help: string;
  split: string;
  summer: string;
  rest: string;
  allYear: string;
  open: string;
  opens: string;
  closes: string;
  closed: string;
  copyAll: string;
  holidays: string;
  /** Nombres cortos de los días, en el orden de WEEK (lunes primero). */
  days: string[];
};

const timeInput =
  "border-border bg-surface w-full min-w-0 rounded-lg border px-2 py-2 text-base";

/**
 * Horario de «Mi local» con selector: cada día con su casilla «abre», hora
 * de apertura y de cierre. Un horario para todo el año, o uno de verano y
 * otro para el resto del año. Se envía en el campo oculto `name` como las
 * temporadas del panel (JSON), que la base valida de nuevo.
 */
export function HoursPicker({
  name,
  initial,
  labels,
}: {
  name: string;
  initial: PlaceHours[];
  labels: HoursPickerLabels;
}) {
  const [plan, setPlan] = useState<HoursPlan>(() => planFromSeasons(initial));
  const value = useMemo(() => hoursKey(seasonsFromPlan(plan)) ?? "", [plan]);

  const setSeason = (i: number, next: SeasonPlan) =>
    setPlan((p) => ({
      ...p,
      seasons: p.seasons.map((s, j) => (j === i ? next : s)),
    }));

  const toggleSplit = (split: boolean) =>
    setPlan((p) => {
      if (split === p.split) return p;
      if (split) {
        const base = p.seasons[0];
        return {
          split: true,
          seasons: [
            { ...base, ...SUMMER, days: base.days.map((d) => ({ ...d })) },
            {
              ...base,
              ...REST_OF_YEAR,
              days: base.days.map((d) => ({ ...d })),
            },
          ],
        };
      }
      return {
        split: false,
        seasons: [
          {
            ...(p.seasons[1] ?? emptySeason(REST_OF_YEAR)),
            fromMonth: 1,
            toMonth: 12,
          },
        ],
      };
    });

  return (
    <fieldset className="space-y-4" data-testid="hours-picker">
      <legend className="font-semibold">{labels.legend}</legend>
      <p className="text-muted -mt-2 text-sm">{labels.help}</p>
      <input type="hidden" name={name} value={value} />

      <label className="flex items-center gap-3 font-semibold">
        <input
          type="checkbox"
          className="size-5"
          checked={plan.split}
          onChange={(e) => toggleSplit(e.target.checked)}
        />
        {labels.split}
      </label>

      {plan.seasons.map((s, i) => (
        <SeasonEditor
          key={plan.split ? i : "todo"}
          title={
            plan.split
              ? i === 0
                ? labels.summer
                : labels.rest
              : labels.allYear
          }
          season={s}
          labels={labels}
          onChange={(next) => setSeason(i, next)}
        />
      ))}
    </fieldset>
  );
}

function SeasonEditor({
  title,
  season,
  labels,
  onChange,
}: {
  title: string;
  season: SeasonPlan;
  labels: HoursPickerLabels;
  onChange: (s: SeasonPlan) => void;
}) {
  const setDay = (day: number, patch: Partial<DayPlan>) =>
    onChange({
      ...season,
      days: season.days.map((d, j) => (j === day ? { ...d, ...patch } : d)),
    });
  const copyToAll = (from: number) => {
    const src = season.days[from];
    onChange({
      ...season,
      days: season.days.map(() => ({ ...src })),
    });
  };

  return (
    <div className="border-border space-y-3 rounded-2xl border p-3">
      <p className="font-display text-lg font-extrabold">{title}</p>
      <ul className="space-y-2">
        {WEEK.map((day, k) => {
          const d = season.days[day];
          const dayName = labels.days[k];
          return (
            <li
              key={day}
              className="grid grid-cols-[5.5rem_1fr] items-center gap-2 sm:grid-cols-[7rem_1fr_auto]"
            >
              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  className="size-5"
                  checked={d.open}
                  onChange={(e) => setDay(day, { open: e.target.checked })}
                  aria-label={`${dayName}: ${labels.open}`}
                />
                {dayName}
              </label>
              {d.open ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-muted text-xs font-semibold">
                    {labels.opens}
                    <input
                      type="time"
                      step={900}
                      value={d.opens}
                      onChange={(e) => setDay(day, { opens: e.target.value })}
                      className={timeInput}
                      aria-label={`${dayName}: ${labels.opens}`}
                    />
                  </label>
                  <label className="text-muted text-xs font-semibold">
                    {labels.closes}
                    <input
                      type="time"
                      step={900}
                      value={d.closes}
                      onChange={(e) => setDay(day, { closes: e.target.value })}
                      className={timeInput}
                      aria-label={`${dayName}: ${labels.closes}`}
                    />
                  </label>
                </div>
              ) : (
                <span className="text-muted text-sm">{labels.closed}</span>
              )}
              {d.open ? (
                <button
                  type="button"
                  onClick={() => copyToAll(day)}
                  className="text-sea-deep col-span-2 justify-self-start text-sm font-semibold underline sm:col-span-1"
                >
                  {labels.copyAll}
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}
            </li>
          );
        })}
      </ul>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          className="size-5"
          checked={season.holidays}
          onChange={(e) => onChange({ ...season, holidays: e.target.checked })}
        />
        {labels.holidays}
      </label>
    </div>
  );
}
