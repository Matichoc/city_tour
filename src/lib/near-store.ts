"use client";

import { useSyncExternalStore } from "react";
import type { NearOrigin } from "@/lib/near";

/**
 * Punto de partida de «Cerca de ti» y si la lista se ordena por cercanía.
 * Vive solo en este teléfono y solo mientras dura la visita (sessionStorage):
 * la ubicación nunca se envía ni se guarda en el servidor.
 */
const KEY = "papudo-en-tu-mano:cerca:v1";

export type NearState = { origin: NearOrigin | null; sortNear: boolean };
const EMPTY: NearState = { origin: null, sortNear: false };
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: NearState } | null = null;
let memory: string | null = null;

function isOrigin(v: unknown): v is NearOrigin {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    (o.kind === "gps" || (o.kind === "pueblo" && typeof o.slug === "string")) &&
    typeof o.latitude === "number" &&
    typeof o.longitude === "number"
  );
}

function parse(raw: string | null): NearState {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as { origin?: unknown; sortNear?: unknown };
    const origin = isOrigin(v.origin) ? v.origin : null;
    return { origin, sortNear: Boolean(origin && v.sortNear === true) };
  } catch {
    return EMPTY;
  }
}

function read(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return memory;
  }
}

function snapshot(): NearState {
  const raw = read();
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: parse(raw) };
  return cache.value;
}

function write(next: NearState): void {
  const raw = JSON.stringify(next);
  try {
    window.sessionStorage.setItem(KEY, raw);
  } catch {
    memory = raw; // sin almacenamiento: vive solo en memoria
  }
  cache = { raw, value: next };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useNear(): NearState {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** Fija el punto de partida y ordena por cercanía. */
export function setNearOrigin(origin: NearOrigin): void {
  write({ origin, sortNear: true });
}

export function setSortNear(sortNear: boolean): void {
  const s = snapshot();
  write({ origin: s.origin, sortNear: Boolean(s.origin && sortNear) });
}

export function clearNear(): void {
  write(EMPTY);
}

export type GpsResult = "ok" | "denied" | "unavailable";

/**
 * Pide la ubicación del teléfono una vez (sin seguirla). Precisión normal:
 * para ordenar lugares basta, y responde más rápido y gasta menos batería.
 */
export function locateMe(): Promise<GpsResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearOrigin({
          kind: "gps",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        resolve("ok");
      },
      (err) =>
        resolve(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 },
    );
  });
}
