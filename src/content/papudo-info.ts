import type { Source } from "@/content/types";

/**
 * Información práctica e historia de Papudo, solo con datos respaldados por
 * fuentes (docs/INVESTIGACION.md). Se muestra en /informacion.
 */
export type InfoBlock = {
  id: "como-llegar" | "temporada" | "combate" | "sucupira";
  group: "practical" | "history";
  es: { title: string; body: string };
  en: { title: string; body: string };
  sources: Source[];
};

export const INFO_BLOCKS: InfoBlock[] = [
  {
    id: "como-llegar",
    group: "practical",
    es: {
      title: "Cómo llegar",
      body: "Desde Santiago, por la Ruta 5 Norte hacia La Ligua, o por la Ruta 68 hasta Viña del Mar y luego la ruta costera F-30-E; el viaje en auto toma unas 2 horas. También hay buses directos desde Santiago.",
    },
    en: {
      title: "Getting there",
      body: "From Santiago, take Ruta 5 Norte toward La Ligua, or Ruta 68 to Viña del Mar and then the coastal road F-30-E; the drive takes about 2 hours. There are also direct buses from Santiago.",
    },
    sources: [
      {
        url: "https://chile.travel/destinos/maitencillo-zapallar-y-papudo/",
        label: "chile.travel (Sernatur) — Maitencillo, Zapallar y Papudo",
      },
      {
        url: "https://www.checkmybus.com/santiago-rm/papudo-vs",
        label: "CheckMyBus — Santiago a Papudo",
      },
    ],
  },
  {
    id: "temporada",
    group: "practical",
    es: {
      title: "Mejor época",
      body: "Según Sernatur, la mejor temporada para visitar este litoral es de noviembre a marzo, que también es cuando llegan más visitantes.",
    },
    en: {
      title: "Best time to visit",
      body: "According to Sernatur, the best season to visit this coast is November to March, which is also when most visitors arrive.",
    },
    sources: [
      {
        url: "https://chile.travel/en/destinations/maitencillo-zapallar-y-papudo/",
        label: "chile.travel (Sernatur)",
      },
    ],
  },
  {
    id: "combate",
    group: "history",
    es: {
      title: "Combate Naval de Papudo (1865)",
      body: "El 26 de noviembre de 1865, frente a Papudo, la corbeta chilena Esmeralda, al mando de Juan Williams Rebolledo, capturó a la goleta española Covadonga, que pasó a la Armada de Chile. Arturo Prat, entonces guardiamarina, integró la partida de abordaje.",
    },
    en: {
      title: "Battle of Papudo (1865)",
      body: "On 26 November 1865, off Papudo, the Chilean corvette Esmeralda under Juan Williams Rebolledo captured the Spanish schooner Covadonga, which then joined the Chilean Navy. Arturo Prat, then a midshipman, was part of the boarding party.",
    },
    sources: [
      {
        url: "https://en.wikipedia.org/wiki/Battle_of_Papudo",
        label: "Wikipedia — Battle of Papudo",
      },
      {
        url: "https://revistamarina.cl/revistas/2011/3/gonzalez2.pdf",
        label: "Revista de Marina (2011)",
      },
    ],
  },
  {
    id: "sucupira",
    group: "history",
    es: {
      title: "Papudo en la televisión",
      body: "La teleserie Sucupira (TVN, 1996), dirigida por Vicente Sabatini, se grabó en Papudo y Zapallar. La Iglesia Nuestra Señora de las Mercedes fue una de sus locaciones.",
    },
    en: {
      title: "Papudo on TV",
      body: "The telenovela Sucupira (TVN, 1996), directed by Vicente Sabatini, was filmed in Papudo and Zapallar. Our Lady of Mercy Church was one of its locations.",
    },
    sources: [
      {
        url: "https://en.wikipedia.org/wiki/Sucupira_(TV_series)",
        label: "Wikipedia — Sucupira (TV series)",
      },
      {
        url: "https://www.emol.com/especiales/teleseries_07/sucupira.html",
        label: "Emol — Especial teleseries: Sucupira",
      },
    ],
  },
];
