import { ILLUSTRATIONS } from "@/content/images";
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
    cover: {
      src: "/rutas/ruta-costera-papudo.webp",
      alt: {
        es: "Ilustración de la bahía de Papudo al atardecer: playa, paseo costero, humedal con aves y lomas de campo.",
        en: "Illustration of Papudo bay at sunset: beach, seafront promenade, wetland with birds and countryside hills.",
      },
    },
    source: {
      url: "https://www.minube.com/tips/actualidad/rincones-unicos-que-visitar-en-papudo-mar-y-montana-te-esperan",
      label: "minube — Qué ver en Papudo",
    },
  },
  {
    // Recorrido a pie por el centro del balneario, armado con lugares que ya
    // tienen fuente. No se fija duración: la calcula "Mi recorrido".
    slug: "papudo-a-pie",
    durationMinutes: null,
    es: {
      name: "Papudo a pie",
      description:
        "Un paseo por el centro del balneario: la Plaza, Playa Chica y la playa principal, siguiendo el paseo La Terraza.",
    },
    en: {
      name: "Papudo on foot",
      description:
        "A stroll through the heart of the resort: the main square, Playa Chica and the main beach, along the La Terraza promenade.",
    },
    stops: [
      { slug: "papudo-plaza" },
      { slug: "playa-chica-papudo" },
      { slug: "playa-papudo" },
      { slug: "papudo-parque" },
    ],
    source: {
      url: "https://www.playasdechile.com/playas-en-papudo/",
      label: "PlayasDeChile.com — Playas en Papudo",
    },
    cover: { src: ILLUSTRATIONS.paseo.src, alt: ILLUSTRATIONS.paseo.alt },
  },
];
