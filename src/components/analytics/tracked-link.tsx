"use client";

import type { AnchorHTMLAttributes } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Enlace externo que registra un evento al hacer clic (p. ej. "Cómo llegar"). */
export function TrackedAnchor({
  event,
  eventProps,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: AnalyticsEvent;
  eventProps?: Record<string, string>;
}) {
  return <a {...props} onClick={() => track(event, eventProps)} />;
}
