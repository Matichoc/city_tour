"use client";

import { useSyncExternalStore } from "react";

/**
 * "Mi recorrido": se guarda solo en este dispositivo (localStorage), sin
 * cuenta. Para compartirlo se genera un enlace con los lugares en la URL.
 */
export type TripState = {
  slugs: string[];
  /** Lugar de partida (debe estar en `slugs`); null = el primero. */
  start: string | null;
  returnToStart: boolean;
  /** Hora de inicio "HH:MM". */
  startTime: string;
  /** auto = orden más corto calculado; manual = el orden del usuario. */
  orderMode: "auto" | "manual";
};

export const EMPTY_TRIP: TripState = {
  slugs: [],
  start: null,
  returnToStart: false,
  startTime: "10:00",
  orderMode: "auto",
};

const KEY = "papudo-en-tu-mano:trip:v1";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: TripState } | null = null;

function parse(raw: string | null): TripState {
  if (!raw) return EMPTY_TRIP;
  try {
    const v = JSON.parse(raw) as Partial<TripState>;
    return {
      slugs: Array.isArray(v.slugs)
        ? v.slugs.filter((s) => typeof s === "string")
        : [],
      start: typeof v.start === "string" ? v.start : null,
      returnToStart: v.returnToStart === true,
      startTime:
        typeof v.startTime === "string" && /^\d{2}:\d{2}$/.test(v.startTime)
          ? v.startTime
          : "10:00",
      orderMode: v.orderMode === "manual" ? "manual" : "auto",
    };
  } catch {
    return EMPTY_TRIP;
  }
}

function snapshot(): TripState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* almacenamiento bloqueado: el recorrido vive solo en memoria */
  }
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: parse(raw) };
  return cache.value;
}

/** Lee el recorrido guardado ahora mismo (no el del primer render). */
export function readTrip(): TripState {
  return snapshot();
}

export function setTrip(next: TripState): void {
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    /* sin almacenamiento */
  }
  cache = { raw, value: next };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTrip(): TripState {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_TRIP);
}

export function addToTrip(slug: string): void {
  const t = snapshot();
  if (!t.slugs.includes(slug)) setTrip({ ...t, slugs: [...t.slugs, slug] });
}

export function addManyToTrip(slugs: string[]): void {
  const t = snapshot();
  const merged = [...t.slugs, ...slugs.filter((s) => !t.slugs.includes(s))];
  setTrip({ ...t, slugs: merged });
}

export function removeFromTrip(slug: string): void {
  const t = snapshot();
  setTrip({
    ...t,
    slugs: t.slugs.filter((s) => s !== slug),
    start: t.start === slug ? null : t.start,
  });
}
