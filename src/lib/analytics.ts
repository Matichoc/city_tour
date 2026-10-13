"use client";

import { track as vercelTrack } from "@vercel/analytics";

/**
 * Eventos anónimos para medir el impacto turístico (sin cookies, sin datos
 * personales). Se envían a Vercel Web Analytics si está activado en el
 * proyecto; si no, no hacen nada. Lista cerrada: docs/DECISIONES.md.
 */
export type AnalyticsEvent =
  "add_to_trip" | "add_route" | "navigate_click" | "share" | "qr_visit";

export function track(
  name: AnalyticsEvent,
  props?: Record<string, string | number>,
) {
  try {
    vercelTrack(name, props);
  } catch {
    /* analítica desactivada */
  }
}
