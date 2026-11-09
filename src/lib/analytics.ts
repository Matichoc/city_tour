"use client";

import { track as vercelTrack } from "@vercel/analytics";
import {
  localeFromPath,
  MAX_BATCH,
  toMetric,
  type Metric,
  type MetricEvent,
} from "@/lib/metrics";

/**
 * Eventos anónimos para medir el impacto turístico (sin cookies, sin datos
 * personales). Van a dos lugares: a las métricas propias del panel
 * (/admin/metricas, conteos diarios en Supabase vía /api/metricas) y a Vercel
 * Web Analytics si está activado en el proyecto. Lista cerrada:
 * src/lib/metrics.ts y docs/DECISIONES.md.
 */
export type AnalyticsEvent = MetricEvent;

const PANEL_ONLY = new Set<AnalyticsEvent>([
  "place_view",
  "route_view",
  "event_view",
  "search_empty",
]);

let queue: Metric[] = [];
let queueLocale = "";
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const body = JSON.stringify({ locale: queueLocale, events: queue });
  queue = [];
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/metricas", blob)) return;
    void fetch("/api/metricas", {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* sin red: se pierde este conteo */
  }
}

function enqueue(metric: Metric, locale: string) {
  // Un envío por idioma: si cambia, se manda lo anterior primero.
  if (queue.length && locale !== queueLocale) flush();
  queueLocale = locale;
  queue.push(metric);
  if (!listening) {
    listening = true;
    // Al salir o pasar a otra pestaña se envía lo pendiente.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush);
  }
  if (queue.length >= MAX_BATCH) flush();
  else if (!timer) timer = setTimeout(flush, 3000);
}

export function track(
  name: AnalyticsEvent,
  props?: Record<string, string | number>,
) {
  try {
    const path = window.location.pathname;
    const metric = toMetric(name, props, path);
    if (metric) enqueue(metric, localeFromPath(path));
  } catch {
    /* métricas desactivadas */
  }
  // Vercel ya cuenta las páginas vistas: las vistas de fichas y las búsquedas
  // quedan solo en las métricas propias.
  if (PANEL_ONLY.has(name)) return;
  try {
    vercelTrack(name, props);
  } catch {
    /* analítica desactivada */
  }
}
