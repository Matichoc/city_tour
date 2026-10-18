"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { distanceToPolylineMeters } from "@/lib/live-nav";
import { fetchStreetRoute } from "@/lib/routing/client";
import type { RouteMode, StreetRoute } from "@/lib/routing/types";
import type { GeoPoint } from "@/lib/itinerary-engine/geo";

/** Si te alejas de la calle más que esto, durante un rato, se recalcula. */
export const OFF_ROUTE_M = 40;
const OFF_ROUTE_SECONDS = 8;
/** Pausa mínima entre recálculos y tope por parada: cuidan el servicio de rutas. */
const MIN_RECALC_MS = 20_000;
const MAX_RECALCS = 8;
const CHECK_EVERY_MS = 4000;

export type RouteStatus = "idle" | "loading" | "ready" | "failed";
type Routes = Partial<Record<RouteMode, StreetRoute>>;

/**
 * Ruta por calles hasta la próxima parada, para a pie y en auto. Se calcula al
 * llegar a cada parada y se recalcula sola si te desvías. Sin `enabled` (la
 * persona no aceptó enviar su ubicación) no consulta nada.
 */
export function useStreetRoutes({
  enabled,
  position,
  target,
  modeRef,
}: {
  enabled: boolean;
  position: GeoPoint | null;
  target: (GeoPoint & { slug: string }) | null;
  /** Modo que se está usando ahora (lo decide la pantalla). */
  modeRef: RefObject<RouteMode>;
}) {
  const [state, setState] = useState<{
    slug: string | null;
    routes: Routes;
    status: RouteStatus;
  }>({ slug: null, routes: {}, status: "idle" });

  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  const hasPosition = position !== null;
  const slug = target?.slug ?? null;
  const lastFetch = useRef(0);
  const offSince = useRef<number | null>(null);
  const recalcs = useRef(0);
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  // Al llegar a una parada nueva: ruta a pie y en auto desde donde estás.
  useEffect(() => {
    const to = targetRef.current;
    const from = positionRef.current;
    if (!enabled || !to || !from) return;
    const controller = new AbortController();
    lastFetch.current = Date.now();
    offSince.current = null;
    recalcs.current = 0;
    queueMicrotask(() =>
      setState({ slug: to.slug, routes: {}, status: "loading" }),
    );
    (async () => {
      const walk = await fetchStreetRoute(from, to, "walk", controller.signal);
      if (controller.signal.aborted) return;
      setState((s) => ({
        ...s,
        routes: { ...s.routes, ...(walk ? { walk } : {}) },
      }));
      const car = await fetchStreetRoute(from, to, "car", controller.signal);
      if (controller.signal.aborted) return;
      setState((s) => {
        const routes = { ...s.routes, ...(car ? { car } : {}) };
        return {
          ...s,
          routes,
          status: routes.walk || routes.car ? "ready" : "failed",
        };
      });
    })();
    return () => controller.abort();
  }, [enabled, slug, hasPosition]);

  // Si te sales de la calle, se recalcula desde donde estás.
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(async () => {
      const from = positionRef.current;
      const to = targetRef.current;
      const mode = modeRef.current;
      const line = state.routes[mode]?.coordinates;
      if (!from || !to || !line || state.slug !== to.slug) return;
      const off = distanceToPolylineMeters(from, line);
      if (off === null || off <= OFF_ROUTE_M) {
        offSince.current = null;
        return;
      }
      const now = Date.now();
      offSince.current ??= now;
      if (
        now - offSince.current < OFF_ROUTE_SECONDS * 1000 ||
        now - lastFetch.current < MIN_RECALC_MS ||
        recalcs.current >= MAX_RECALCS
      )
        return;
      lastFetch.current = now;
      recalcs.current += 1;
      offSince.current = null;
      const fresh = await fetchStreetRoute(from, to, mode);
      if (fresh && targetRef.current?.slug === to.slug)
        setState((s) => ({ ...s, routes: { ...s.routes, [mode]: fresh } }));
    }, CHECK_EVERY_MS);
    return () => window.clearInterval(id);
  }, [enabled, modeRef, state.routes, state.slug]);

  const current = state.slug === slug;
  return {
    routes: current ? state.routes : ({} as Routes),
    status: (current ? state.status : "idle") as RouteStatus,
  };
}
