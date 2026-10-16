"use client";

import { useSyncExternalStore } from "react";

/**
 * Opiniones que el visitante escribe en la DEMOSTRACIÓN: se guardan solo en
 * este dispositivo (localStorage) y solo sobre fichas y eventos de ejemplo.
 * En la versión real habrá cuentas, moderación y base de datos.
 */
export type MyReview = {
  id: string;
  rating: number;
  text: string;
  name: string;
  createdAt: number;
};

const KEY = "papudo-en-tu-mano:demo-reviews:v1";
const EMPTY_ALL: Record<string, MyReview[]> = {};
const EMPTY: MyReview[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Record<string, MyReview[]> } | null =
  null;

function parse(raw: string | null): Record<string, MyReview[]> {
  if (!raw) return EMPTY_ALL;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return EMPTY_ALL;
    const out: Record<string, MyReview[]> = {};
    for (const [slug, list] of Object.entries(v)) {
      if (!Array.isArray(list)) continue;
      out[slug] = list
        .filter(
          (r): r is MyReview =>
            r &&
            typeof r.id === "string" &&
            typeof r.rating === "number" &&
            typeof r.text === "string",
        )
        .map((r) => ({
          id: r.id,
          rating: Math.min(5, Math.max(1, Math.round(r.rating))),
          text: r.text.slice(0, 500),
          name: typeof r.name === "string" ? r.name.slice(0, 40) : "",
          createdAt: typeof r.createdAt === "number" ? r.createdAt : 0,
        }));
    }
    return out;
  } catch {
    return EMPTY_ALL;
  }
}

function snapshot(): Record<string, MyReview[]> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* almacenamiento bloqueado */
  }
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: parse(raw) };
  return cache.value;
}

function write(next: Record<string, MyReview[]>) {
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    /* sin almacenamiento: vive solo en memoria */
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

export function useMyReviews(slug: string): MyReview[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot()[slug] ?? EMPTY,
    () => EMPTY,
  );
}

export function addMyReview(
  slug: string,
  review: Omit<MyReview, "id" | "createdAt">,
): void {
  const all = snapshot();
  const mine: MyReview = {
    ...review,
    name: review.name.trim().slice(0, 40),
    text: review.text.trim().slice(0, 500),
    id: `mine-${Date.now().toString(36)}`,
    createdAt: Date.now(),
  };
  write({ ...all, [slug]: [mine, ...(all[slug] ?? [])] });
}

export function removeMyReview(slug: string, id: string): void {
  const all = snapshot();
  write({ ...all, [slug]: (all[slug] ?? []).filter((r) => r.id !== id) });
}
