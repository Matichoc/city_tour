/**
 * Contenido de EJEMPLO (ficticio).
 *
 * Desde noviembre de 2026 la guía tiene los locales y servicios reales de la
 * Guía Turística Papudo 2026, así que ya no hay fichas, eventos ni opiniones
 * de ejemplo: las listas quedan vacías. La interfaz sigue sabiendo rotular
 * una ficha con `demo: true` (se rotula «Ejemplo», no se indexa y se oculta
 * con `NEXT_PUBLIC_SHOW_DEMO=0`), por si algún día hace falta mostrar uno.
 * Las opiniones simuladas solo pueden ir sobre fichas ficticias («demo-…»),
 * jamás sobre comercios reales (docs/DECISIONES.md).
 */
import type { EventContent, PlaceContent } from "@/content/types";

export const DEMO_PLACES: PlaceContent[] = [];

export const DEMO_EVENTS: EventContent[] = [];

export type DemoReview = {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: { es: string; en: string; pt: string };
  ownerReply?: { es: string; en: string; pt: string };
};

export const DEMO_REVIEWS: Record<string, DemoReview[]> = {};
