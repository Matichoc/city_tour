"use client";

import { useSyncExternalStore } from "react";

/**
 * Lugares guardados ("me gusta"): solo en este dispositivo, sin cuenta. Cuando
 * existan cuentas (Tanda B) se podrán sincronizar.
 */
const KEY = "papudo-en-tu-mano:saved:v1";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: string[] } | null = null;

function parse(raw: string | null): string[] {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : EMPTY;
  } catch {
    return EMPTY;
  }
}

function snapshot(): string[] {
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

function write(next: string[]): void {
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

export function useSaved(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** Guarda o quita; devuelve si quedó guardado. */
export function toggleSaved(slug: string): boolean {
  const s = snapshot();
  if (s.includes(slug)) {
    write(s.filter((x) => x !== slug));
    return false;
  }
  write([...s, slug]);
  return true;
}
