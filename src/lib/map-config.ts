import { PAPUDO_CENTER } from "@/content/catalog";

/**
 * Estilo de mapa configurable por variable de entorno. Por defecto, OpenFreeMap
 * "liberty" (vectorial, gratis, sin API key; colores vivos). Antes de producción
 * decidir el proveedor definitivo (docs/FINANCIAMIENTO.md §3).
 */
export function getMapStyleUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
    "https://tiles.openfreemap.org/styles/liberty"
  );
}

export const MAP_CENTER = PAPUDO_CENTER;
export const MAP_DEFAULT_ZOOM = 12;
export const PLACE_ZOOM = 15;

export const CATEGORY_PIN_COLOR: Record<string, string> = {
  playas: "#0b7285",
  naturaleza: "#4a7a37",
  patrimonio: "#a85a17",
  gastronomia: "#e0553a",
  alojamiento: "#07495a",
  actividades: "#2f8f7a",
};

export function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/** "Cómo llegar" cuando no hay coordenada: búsqueda por nombre y dirección. */
export function searchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
