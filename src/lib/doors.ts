import type { CategorySlug } from "@/content/types";
import type { IllustrationKey } from "@/content/images";

/**
 * Las cuatro puertas de entrada del sitio: los cuadros del logo municipal
 * (docs/MARCA-REFERENCIA.md). Cada una junta una o más categorías, tiene su
 * color (`--cuadro-*`) y una ilustración. Gastronomía y alojamiento no son
 * puerta: son servicios que se buscan aparte.
 */
export const DOORS = [
  { key: "mar", categories: ["balneario"], illustration: "playa" },
  { key: "campo", categories: ["ruralidad"], illustration: "humedal" },
  { key: "patrimonio", categories: ["patrimonio"], illustration: "plaza" },
  {
    key: "paseos",
    categories: ["recreacion", "deportes"],
    illustration: "paseo",
  },
] as const satisfies readonly {
  key: string;
  categories: readonly CategorySlug[];
  illustration: IllustrationKey;
}[];

export type Door = (typeof DOORS)[number];
export type DoorKey = Door["key"];

export const SERVICE_CATEGORIES = [
  "gastronomia",
  "alojamiento",
] as const satisfies readonly CategorySlug[];

export function findDoor(key: string | undefined): Door | undefined {
  return DOORS.find((d) => d.key === key);
}

/** La puerta de una categoría, o `undefined` si es un servicio. */
export function doorOf(category: CategorySlug): Door | undefined {
  return DOORS.find((d) =>
    (d.categories as readonly CategorySlug[]).includes(category),
  );
}
