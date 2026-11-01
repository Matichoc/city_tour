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

export const CATEGORY_PIN_COLOR: Record<string, string> = {
  balneario: "#a8841f",
  recreacion: "#b0447c",
  deportes: "#3f6fb5",
  patrimonio: "#b8423f",
  gastronomia: "#b8692c",
  ruralidad: "#2a8584",
  alojamiento: "#6d52b0",
};

export function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/** "Cómo llegar" cuando no hay coordenada: búsqueda por nombre y dirección. */
export function searchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
