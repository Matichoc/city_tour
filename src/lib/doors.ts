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

/**
 * Clases de color de cada puerta: `frame` para el marco de las miniaturas,
 * `on` para texto encima del color (AA) e `ink` para su nombre como texto
 * sobre blanco. Comer y dormir ("servicio") va en azul noche.
 */
export const DOOR_STYLE: Record<
  DoorKey | "servicio",
  { frame: string; on: string; ink: string }
> = {
  mar: {
    frame: "bg-cuadro-mar",
    on: "text-foreground",
    ink: "text-cuadro-mar-ink",
  },
  campo: {
    frame: "bg-cuadro-campo",
    on: "text-cuadro-campo-on",
    ink: "text-cuadro-campo-ink",
  },
  patrimonio: {
    frame: "bg-cuadro-patri",
    on: "text-white",
    ink: "text-cuadro-patri-ink",
  },
  paseos: {
    frame: "bg-cuadro-paseo",
    on: "text-cuadro-paseo-on",
    ink: "text-cuadro-paseo-ink",
  },
  servicio: {
    frame: "bg-foreground",
    on: "text-white",
    ink: "text-foreground",
  },
};

/** Estilo de color de una categoría (el de su puerta o el de servicio). */
export function styleOf(category: CategorySlug) {
  return DOOR_STYLE[doorOf(category)?.key ?? "servicio"];
}

export function findDoor(key: string | undefined): Door | undefined {
  return DOORS.find((d) => d.key === key);
}

/** La puerta de una categoría, o `undefined` si es un servicio. */
export function doorOf(category: CategorySlug): Door | undefined {
  return DOORS.find((d) =>
    (d.categories as readonly CategorySlug[]).includes(category),
  );
}
