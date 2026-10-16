/**
 * Agenda de eventos de Papudo (PLADETUR B2.4, «Agenda anual de eventos»).
 *
 * Son eventos recurrentes con fuente. NO se publican fechas de un año
 * concreto: las fiestas cambian cada año y hay que confirmarlas con la
 * Municipalidad (el plan pide revisar la agenda al menos cada trimestre).
 * Todo queda `pending` hasta verificarlo en terreno.
 *
 * Fuente principal: PLADETUR de Papudo, iD actitud e impacto, junio de 2023
 * (docs/investigacion). Páginas impresas: patrimonio inmaterial pp. 78–79 y
 * comités de producto p. 188.
 */
import type { EventContent } from "@/content/types";

const PLADETUR = (page: string) => ({
  url: "https://munipapudo.cl/municipalidad/accesos-directos/plan-de-desarrollo-turistico-pladetur",
  label: `PLADETUR de Papudo, iD, 2023 (${page})`,
});

export const EVENTS: EventContent[] = [
  {
    slug: "feria-internacional-integracion-papudo",
    categorySlug: "gastronomia",
    localitySlug: "papudo",
    month: 2,
    featured: true,
    illustration: "paseo",
    es: {
      name: "Feria Internacional de Integración de Papudo (FIP)",
      short:
        "Cada febrero reúne música, artesanos, productores y diseñadores de distintos países, con foco en productos gourmet, vitivinícolas y olivícolas, y en estrechar lazos con provincias de Argentina.",
    },
    en: {
      name: "Papudo International Integration Fair (FIP)",
      short:
        "Every February it brings together music, artisans, producers and designers from several countries, with a focus on gourmet, wine and olive products and on strengthening ties with Argentine provinces.",
    },
    source: PLADETUR("p. 79"),
  },
  {
    slug: "festival-de-verano-papudo",
    categorySlug: "recreacion",
    localitySlug: "papudo",
    month: null,
    season: "summer",
    es: {
      name: "Festival de Verano Papudo",
      short:
        "Festival de la temporada estival que el PLADETUR lista entre las actividades de la comuna. Fechas y programa por confirmar con la Municipalidad.",
    },
    en: {
      name: "Papudo Summer Festival",
      short:
        "Summer-season festival that the PLADETUR lists among the commune's activities. Dates and programme to be confirmed with the Municipality.",
    },
    source: PLADETUR("p. 188"),
  },
  {
    slug: "glorias-navales-papudo",
    categorySlug: "patrimonio",
    localitySlug: "papudo",
    month: 5,
    day: 21,
    es: {
      name: "Día de las Glorias Navales",
      short:
        "Desfile y ceremonia por las glorias navales, una de las celebraciones nacionales que la comunidad de Papudo vive con desfiles.",
    },
    en: {
      name: "Naval Glories Day",
      short:
        "Parade and ceremony for Chile's naval glories, one of the national celebrations that the Papudo community marks with parades.",
    },
    source: {
      url: "https://g5noticias.cl/2023/05/22/papudo-realiza-impecables-desfiles-en-conmemoracion-de-las-glorias-navales/",
      label: "G5 Noticias — Papudo realiza impecables desfiles (22-05-2023)",
    },
    extraSources: [PLADETUR("p. 79")],
  },
  {
    slug: "fiesta-de-san-pedro",
    categorySlug: "patrimonio",
    localitySlug: "papudo",
    month: 7,
    featured: true,
    illustration: "humedal",
    es: {
      name: "Fiesta de San Pedro",
      short:
        "Fiesta religiosa de julio: procesión desde el Templo San Pedro Pescador por las calles hasta la caleta, con la imagen escoltada por pescadores, paseos de lancha y misa en la Iglesia Nuestra Señora de las Mercedes.",
    },
    en: {
      name: "Saint Peter's Festival",
      short:
        "July religious festival: a procession from the San Pedro Pescador church through the streets to the fishing cove, with the image escorted by fishermen, boat rides and mass at Nuestra Señora de las Mercedes church.",
    },
    source: PLADETUR("p. 79"),
  },
  {
    slug: "fiestas-patrias-papudo",
    categorySlug: "patrimonio",
    localitySlug: "papudo",
    month: 9,
    es: {
      name: "Fiestas Patrias",
      short:
        "Carreras a la chilena, desfile, fondas y juegos populares, además de fiestas costumbristas en Pullally y en Playa Chica según el PLADETUR.",
    },
    en: {
      name: "Chilean Independence Day celebrations",
      short:
        "Chilean-style horse races, a parade, fondas and traditional games, plus traditional fairs in Pullally and Playa Chica according to the PLADETUR.",
    },
    source: PLADETUR("p. 79"),
  },
  {
    slug: "combate-naval-de-papudo",
    categorySlug: "patrimonio",
    localitySlug: "papudo",
    month: 11,
    day: 26,
    featured: true,
    illustration: "plaza",
    es: {
      name: "Aniversario del Combate Naval de Papudo",
      short:
        "Cada 26 de noviembre se conmemora el combate de 1865 con una ceremonia y un desfile cívico-militar junto al monumento a los héroes, con la Armada, autoridades y escuelas. En 2025 se cumplieron 160 años.",
    },
    en: {
      name: "Anniversary of the Naval Combat of Papudo",
      short:
        "Every 26 November the 1865 combat is commemorated with a civic-military ceremony and parade by the heroes' monument, with the Navy, authorities and schools. 2025 marked 160 years.",
    },
    source: {
      url: "https://laliguanoticias.cl/2025/11/28/comuna-de-papudo-conmemora-160-aniversario-del-combate-naval-con-solemne-desfile-civico-militar/",
      label:
        "La Ligua Noticias — Papudo conmemora 160° aniversario del Combate Naval (28-11-2025)",
    },
    extraSources: [
      {
        url: "https://www.armada.cl/noticias-navales/140-aniversario-del-combate-naval-de-papudo",
        label: "Armada de Chile — 140° aniversario del Combate Naval de Papudo",
      },
    ],
  },
  {
    slug: "fiesta-costumbrista-pullally",
    categorySlug: "ruralidad",
    localitySlug: "pullally",
    month: null,
    es: {
      name: "Fiesta Costumbrista en Pullally",
      short:
        "Fiesta de las tradiciones del campo, coordinada por la Municipalidad con emprendedores y la red de turismo local de Pullally. Fecha por confirmar.",
    },
    en: {
      name: "Traditional Fair in Pullally",
      short:
        "Festival of countryside traditions, coordinated by the Municipality with entrepreneurs and Pullally's local tourism network. Date to be confirmed.",
    },
    source: PLADETUR("pp. 79 y 188"),
  },
];
