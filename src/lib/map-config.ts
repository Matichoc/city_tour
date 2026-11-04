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

/**
 * Relieve 3D: teselas de elevación abiertas (Terrain Tiles de Mapzen en AWS
 * Open Data, formato "terrarium", sin API key). Configurable para cambiar de
 * proveedor sin tocar código.
 */
export function getTerrainTilesUrl(): string {
  return (
    process.env.NEXT_PUBLIC_TERRAIN_TILES_URL ||
    "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
  );
}
export const TERRAIN_ATTRIBUTION =
  '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles (Mapzen, AWS)</a>';

export const MAP_CENTER = PAPUDO_CENTER;
export const MAP_DEFAULT_ZOOM = 12;
export const PLACE_ZOOM = 15;

/**
 * Mapas de lugares (Explorar, fichas, rutas): estilo claro "positron", que se
 * tiñe al cargar con los colores de Papudo (`LIGHT_MAP_TINT`) para que los
 * pines de colores sean lo que destaca. El mapa 3D y la navegación en vivo
 * siguen con `getMapStyleUrl()` (más detalle de relieve y calles).
 */
export function getLightMapStyleUrl(): string {
  return (
    process.env.NEXT_PUBLIC_LIGHT_MAP_STYLE_URL ||
    "https://tiles.openfreemap.org/styles/positron"
  );
}
export const LIGHT_MAP_TINT = {
  water: "#bfe9ea",
  land: "#f7f3ea",
  green: "#e3eccf",
};

/**
 * Color del pin: el de la puerta de su categoría (los cuadros del logo, un
 * poco más oscuros para que se vean sobre el mapa claro); comer y dormir, en
 * azul noche.
 */
export const CATEGORY_PIN_COLOR: Record<string, string> = {
  balneario: "#f5b800",
  ruralidad: "#0f9493",
  patrimonio: "#d71f19",
  recreacion: "#d4087e",
  deportes: "#d4087e",
  gastronomia: "#14164a",
  alojamiento: "#14164a",
};

export function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/** "Cómo llegar" cuando no hay coordenada: búsqueda por nombre y dirección. */
export function searchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
