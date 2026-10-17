import { DEMO_EVENTS, DEMO_PLACES } from "@/content/demo-content";
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

/**
 * Contenido del repo (src/content), incluidas las fichas de EJEMPLO. Es el
 * respaldo cuando no hay base de datos y el origen de supabase/content.sql.
 */
export const STATIC_CONTENT: SiteContent = {
  localities: LOCALITIES,
  places: [...PLACES, ...DEMO_PLACES],
  events: [...EVENTS, ...DEMO_EVENTS],
  routes: ROUTES,
};
