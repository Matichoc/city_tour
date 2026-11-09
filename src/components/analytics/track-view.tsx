"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Cuenta una vista al abrir la página (ficha de lugar, ruta o evento) o una
 * búsqueda sin resultados. Anónimo: solo suma uno al conteo del día.
 */
export function TrackView({
  event,
  props,
}: {
  event: AnalyticsEvent;
  props: Record<string, string>;
}) {
  const key = JSON.stringify(props);
  useEffect(() => {
    track(event, JSON.parse(key) as Record<string, string>);
  }, [event, key]);
  return null;
}
