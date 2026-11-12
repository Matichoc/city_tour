import { DEMO_EVENTS, DEMO_PLACES } from "@/content/demo-content";
import {
  GUIDE_ALSO_IN,
  GUIDE_EVENTS,
  GUIDE_LOCALITY_SUMMARIES,
  GUIDE_PLACES,
  GUIDE_QR,
  GUIDE_SOURCE,
} from "@/content/guia-municipal-2026";
import { EVENTS } from "@/content/papudo-events";
import { LOCALITIES, PLACES } from "@/content/papudo-places";
import { ROUTES } from "@/content/papudo-routes";
import type {
  EventContent,
  LocalityContent,
  PlaceContent,
  RouteContent,
} from "@/content/types";

/** Todo el contenido del sitio: lo que se lee de la base o, si no hay, del repo. */
export type SiteContent = {
  localities: LocalityContent[];
  places: PlaceContent[];
  events: EventContent[];
  routes: RouteContent[];
};

/** Lugares del repo, con la guía municipal como fuente adicional donde aplica. */
const withGuideSource = (p: PlaceContent): PlaceContent => {
  if (!GUIDE_ALSO_IN.includes(p.slug)) return p;
  const pin = GUIDE_QR[p.slug];
  return {
    ...p,
    // La ubicación del QR municipal reemplaza una aproximada o la que faltaba.
    ...(pin
      ? {
          latitude: pin.lat,
          longitude: pin.lng,
          mapsUrl: p.mapsUrl ?? pin.maps,
        }
      : {}),
    extraSources: [...(p.extraSources ?? []), GUIDE_SOURCE],
  };
};

const localities: LocalityContent[] = LOCALITIES.map((l) =>
  GUIDE_LOCALITY_SUMMARIES[l.slug]
    ? {
        ...l,
        summary: GUIDE_LOCALITY_SUMMARIES[l.slug],
        sourceUrl: GUIDE_SOURCE.url,
        sourceLabel: GUIDE_SOURCE.label,
      }
    : l,
);

/**
 * Contenido del repo (src/content), incluidas las fichas de EJEMPLO. Es el
 * respaldo cuando no hay base de datos y el origen de supabase/content.sql.
 */
export const STATIC_CONTENT: SiteContent = {
  localities,
  places: [...PLACES.map(withGuideSource), ...GUIDE_PLACES, ...DEMO_PLACES],
  events: [...EVENTS, ...GUIDE_EVENTS, ...DEMO_EVENTS],
  routes: ROUTES,
};
