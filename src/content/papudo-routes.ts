import type { RouteContent } from "@/content/types";

/**
 * Rutas de Papudo. "Ruta costera de Papudo" sale de la ruta
 * "Ruta Costera: Papudo y Zapallar" de directorio_turistico, conservando solo
 * las paradas que están en la comuna de Papudo y su orden. No se fija una
 * duración: la original (270 min) cubría también Zapallar y La Ligua.
 */
export const ROUTES: RouteContent[] = [
  {
    slug: "ruta-costera-papudo",
    durationMinutes: null,
    es: {
      name: "Ruta costera de Papudo",
      description:
        "Del humedal al balneario: las Salinas de Pullally, a unos 12 km al norte del pueblo, y las playas del balneario, con Playa Chica como alternativa más resguardada.",
    },
    en: {
      name: "Papudo coastal route",
      description:
        "From wetland to seaside town: the Salinas de Pullally, about 12 km north of the town, and the resort's beaches, with Playa Chica as the more sheltered option.",
    },
    stops: [
      { slug: "papudo-salinas-pullally" },
      { slug: "playa-papudo" },
      { slug: "playa-chica-papudo" },
    ],
    source: {
      url: "https://www.minube.com/tips/actualidad/rincones-unicos-que-visitar-en-papudo-mar-y-montana-te-esperan",
      label: "minube — Qué ver en Papudo",
    },
  },
];
