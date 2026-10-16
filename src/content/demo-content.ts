/**
 * CONTENIDO DE EJEMPLO (ficticio) para demostrar cómo se vería la guía con
 * comercios, actividades y opiniones. NADA de esto existe.
 *
 * Reglas (docs/DECISIONES.md):
 * - Cada ficha lleva `demo: true` y se rotula «Ejemplo» en toda la interfaz.
 * - No tienen coordenadas, dirección, teléfono ni fuente real: no hay cómo
 *   llegar ni nada que confundir con un lugar verdadero.
 * - Las opiniones simuladas solo se asocian a estas fichas ficticias, jamás a
 *   comercios reales.
 * - No se indexan (noindex) ni salen en el sitemap.
 * - Se ocultan todas con `NEXT_PUBLIC_SHOW_DEMO=0` (hacerlo antes de abrir el
 *   sitio al público).
 */
import type { EventContent, PlaceContent } from "@/content/types";

const demoPlace = (
  p: Omit<PlaceContent, "latitude" | "longitude" | "demo" | "business">,
): PlaceContent => ({
  ...p,
  latitude: null,
  longitude: null,
  business: true,
  demo: true,
});

export const DEMO_PLACES: PlaceContent[] = [
  demoPlace({
    slug: "demo-parador-ola-mansa",
    localitySlug: "papudo",
    categorySlug: "balneario",
    es: {
      name: "Parador Ola Mansa (ejemplo)",
      short:
        "Parador frente al mar con sombrillas, jugos naturales y sándwiches para pasar el día de playa.",
      description:
        "Un parador de playa de ejemplo: arriendo de sombrillas y reposeras, jugos naturales, helados y sándwiches, con baños y mesas bajo toldo. Está pensado para mostrar cómo se vería la ficha de un negocio de balneario.",
    },
    en: {
      name: "Ola Mansa Beach Stand (example)",
      short:
        "Seaside stand with umbrellas, fresh juices and sandwiches for a beach day.",
      description:
        "An example beach stand: umbrella and sun lounger rental, fresh juices, ice cream and sandwiches, with restrooms and tables under an awning. It is meant to show what a seaside business page would look like.",
    },
    pt: {
      name: "Parador Ola Mansa (exemplo)",
      short:
        "Parador de frente para o mar com guarda-sóis, sucos naturais e sanduíches para um dia de praia.",
      description:
        "Um parador de praia de exemplo: aluguel de guarda-sóis e espreguiçadeiras, sucos naturais, sorvetes e sanduíches, com banheiros e mesas sob toldo. Serve para mostrar como seria a ficha de um negócio de balneário.",
    },
  }),
  demoPlace({
    slug: "demo-cabalgatas-del-valle",
    localitySlug: "pullally",
    categorySlug: "recreacion",
    es: {
      name: "Cabalgatas del Valle (ejemplo)",
      short:
        "Paseos a caballo por el campo de Pullally, con salidas al atardecer para toda la familia.",
      description:
        "Una actividad de ejemplo: cabalgatas guiadas de una hora por caminos de campo, con caballos mansos y salidas al atardecer. Sirve para mostrar cómo se vería una ficha de recreación.",
    },
    en: {
      name: "Valley Horseback Rides (example)",
      short:
        "Horseback rides through the Pullally countryside, with sunset departures for the whole family.",
      description:
        "An example activity: one-hour guided rides along country roads, with gentle horses and sunset departures. It shows what a recreation page would look like.",
    },
    pt: {
      name: "Cavalgadas do Vale (exemplo)",
      short:
        "Passeios a cavalo pelo campo de Pullally, com saídas ao entardecer para toda a família.",
      description:
        "Uma atividade de exemplo: cavalgadas guiadas de uma hora por caminhos de campo, com cavalos mansos e saídas ao entardecer. Serve para mostrar como seria uma ficha de recreação.",
    },
  }),
  demoPlace({
    slug: "demo-escuela-de-surf-ola-brava",
    localitySlug: "las-salinas-papudo",
    categorySlug: "deportes",
    es: {
      name: "Escuela de Surf Ola Brava (ejemplo)",
      short:
        "Clases de surf y stand up paddle para principiantes, con equipo incluido.",
      description:
        "Un negocio deportivo de ejemplo: clases grupales y particulares de surf y stand up paddle, con tablas y trajes incluidos. Sirve para mostrar cómo se vería una ficha de deportes.",
    },
    en: {
      name: "Ola Brava Surf School (example)",
      short:
        "Surf and stand-up paddle lessons for beginners, equipment included.",
      description:
        "An example sports business: group and private surf and stand-up paddle lessons, boards and wetsuits included. It shows what a sports page would look like.",
    },
    pt: {
      name: "Escola de Surfe Ola Brava (exemplo)",
      short:
        "Aulas de surfe e stand up paddle para iniciantes, com equipamento incluído.",
      description:
        "Um negócio esportivo de exemplo: aulas em grupo e particulares de surfe e stand up paddle, com pranchas e roupas de borracha incluídas. Serve para mostrar como seria uma ficha de esportes.",
    },
  }),
  demoPlace({
    slug: "demo-circuito-casas-antiguas",
    localitySlug: "papudo",
    categorySlug: "patrimonio",
    es: {
      name: "Circuito Casas Antiguas (ejemplo)",
      short:
        "Recorrido guiado a pie por el casco histórico, con relatos de las familias que lo fundaron.",
      description:
        "Una experiencia cultural de ejemplo: caminata guiada de 90 minutos por calles patrimoniales, con historias y fotos antiguas. Sirve para mostrar cómo se vería una ficha de cultura y patrimonio.",
    },
    en: {
      name: "Old Houses Circuit (example)",
      short:
        "Guided walk through the historic centre, with stories of the families who founded it.",
      description:
        "An example cultural experience: a 90-minute guided walk along heritage streets, with stories and old photographs. It shows what a culture and heritage page would look like.",
    },
    pt: {
      name: "Circuito Casas Antigas (exemplo)",
      short:
        "Passeio guiado a pé pelo centro histórico, com relatos das famílias que o fundaram.",
      description:
        "Uma experiência cultural de exemplo: caminhada guiada de 90 minutos por ruas históricas, com histórias e fotos antigas. Serve para mostrar como seria uma ficha de cultura e patrimônio.",
    },
  }),
  demoPlace({
    slug: "demo-cocineria-sabor-a-mar",
    localitySlug: "papudo",
    categorySlug: "gastronomia",
    es: {
      name: "Cocinería Sabor a Mar (ejemplo)",
      short:
        "Pescado del día, machas a la parmesana y empanadas de mariscos, cerca de la caleta.",
      description:
        "Un restaurante de ejemplo: cocina de mar con pescado fresco, machas a la parmesana y empanadas de mariscos, en un local familiar con terraza. Sirve para mostrar cómo se vería una ficha de gastronomía.",
    },
    en: {
      name: "Sabor a Mar Seafood Kitchen (example)",
      short:
        "Fish of the day, parmesan razor clams and seafood empanadas, near the fishing cove.",
      description:
        "An example restaurant: seafood cooking with fresh fish, parmesan razor clams and seafood empanadas, in a family-run place with a terrace. It shows what a food page would look like.",
    },
    pt: {
      name: "Cozinha Sabor a Mar (exemplo)",
      short:
        "Peixe do dia, lingueirões à parmesã e empanadas de frutos do mar, perto da caleta.",
      description:
        "Um restaurante de exemplo: cozinha do mar com peixe fresco, lingueirões à parmesã e empanadas de frutos do mar, em um local familiar com terraço. Serve para mostrar como seria uma ficha de gastronomia.",
    },
  }),
  demoPlace({
    slug: "demo-huerta-y-quesos-el-retono",
    localitySlug: "pullally",
    categorySlug: "ruralidad",
    es: {
      name: "Huerta y Quesos El Retoño (ejemplo)",
      short:
        "Visita a una huerta familiar con degustación de quesos, mermeladas y frutas de la temporada.",
      description:
        "Una experiencia rural de ejemplo: recorrido por una huerta familiar, ordeña demostrativa y degustación de productos del campo. Sirve para mostrar cómo se vería una ficha de campo y ruralidad.",
    },
    en: {
      name: "El Retoño Farm & Cheese (example)",
      short:
        "Visit to a family farm with tastings of cheese, jams and seasonal fruit.",
      description:
        "An example rural experience: a tour of a family farm, a demonstration milking and tastings of country products. It shows what a countryside page would look like.",
    },
    pt: {
      name: "Horta e Queijos El Retoño (exemplo)",
      short:
        "Visita a uma horta familiar com degustação de queijos, geleias e frutas da estação.",
      description:
        "Uma experiência rural de exemplo: passeio por uma horta familiar, ordenha demonstrativa e degustação de produtos do campo. Serve para mostrar como seria uma ficha de campo e ruralidade.",
    },
  }),
  demoPlace({
    slug: "demo-cabanas-brisa-salina",
    localitySlug: "las-salinas-papudo",
    categorySlug: "alojamiento",
    es: {
      name: "Cabañas Brisa Salina (ejemplo)",
      short:
        "Cabañas para familias entre el campo y el mar, con quincho y estacionamiento.",
      description:
        "Un alojamiento de ejemplo: cabañas para cuatro a seis personas con cocina equipada, quincho compartido y estacionamiento. Sirve para mostrar cómo se vería una ficha de alojamiento.",
    },
    en: {
      name: "Brisa Salina Cabins (example)",
      short:
        "Family cabins between the countryside and the sea, with a barbecue area and parking.",
      description:
        "An example place to stay: cabins for four to six people with a full kitchen, a shared barbecue area and parking. It shows what an accommodation page would look like.",
    },
    pt: {
      name: "Cabanas Brisa Salina (exemplo)",
      short:
        "Cabanas para famílias entre o campo e o mar, com churrasqueira e estacionamento.",
      description:
        "Uma hospedagem de exemplo: cabanas para quatro a seis pessoas com cozinha equipada, churrasqueira compartilhada e estacionamento. Serve para mostrar como seria uma ficha de hospedagem.",
    },
  }),
];

export const DEMO_EVENTS: EventContent[] = [
  {
    slug: "demo-noche-de-bandas",
    categorySlug: "recreacion",
    localitySlug: "papudo",
    month: 1,
    season: "summer",
    demo: true,
    illustration: "musica",
    es: {
      name: "Noche de bandas en la costanera (ejemplo)",
      short:
        "Música en vivo con bandas locales, feria de artesanía y comida al paso frente al mar.",
    },
    en: {
      name: "Band night on the seafront (example)",
      short:
        "Live music from local bands, a craft fair and street food by the sea.",
    },
    pt: {
      name: "Noite de bandas na orla (exemplo)",
      short:
        "Música ao vivo com bandas locais, feira de artesanato e comida de rua de frente para o mar.",
    },
  },
  {
    slug: "demo-cata-de-mariscos",
    categorySlug: "gastronomia",
    localitySlug: "papudo",
    month: 2,
    demo: true,
    illustration: "mariscos",
    es: {
      name: "Cata de mariscos en la caleta (ejemplo)",
      short:
        "Degustación de productos del mar con pescadores y cocineras de la zona.",
    },
    en: {
      name: "Seafood tasting at the cove (example)",
      short: "Tasting of seafood with local fishermen and cooks.",
    },
    pt: {
      name: "Degustação de frutos do mar na caleta (exemplo)",
      short:
        "Degustação de produtos do mar com pescadores e cozinheiras da região.",
    },
  },
];

/* ── Opiniones simuladas (solo de fichas y eventos ficticios) ────────────── */

export type DemoReview = {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: { es: string; en: string; pt: string };
  ownerReply?: { es: string; en: string; pt: string };
};

const reply = (es: string, en: string, pt: string) => ({ es, en, pt });

export const DEMO_REVIEWS: Record<string, DemoReview[]> = {
  "demo-parador-ola-mansa": [
    {
      id: "r1",
      author: "Camila R.",
      rating: 5,
      text: {
        es: "Perfecto para pasar el día con niños: sombra, jugos ricos y baños limpios. Volveremos.",
        en: "Perfect for a day with kids: shade, tasty juices and clean restrooms. We'll be back.",
        pt: "Perfeito para passar o dia com crianças: sombra, sucos gostosos e banheiros limpos. Voltaremos.",
      },
      ownerReply: reply(
        "¡Gracias, Camila! Las reposeras para niños ya están disponibles.",
        "Thanks, Camila! Kids' loungers are now available.",
        "Obrigado, Camila! As espreguiçadeiras infantis já estão disponíveis.",
      ),
    },
    {
      id: "r2",
      author: "Tomás V.",
      rating: 4,
      text: {
        es: "Buena ubicación y atención amable. En fin de semana hay que llegar temprano.",
        en: "Great spot and friendly service. On weekends you need to arrive early.",
        pt: "Ótima localização e atendimento simpático. Nos fins de semana é preciso chegar cedo.",
      },
    },
  ],
  "demo-cabalgatas-del-valle": [
    {
      id: "r1",
      author: "Javiera P.",
      rating: 5,
      text: {
        es: "El paseo al atardecer fue lo mejor del viaje. Los caballos son muy mansos.",
        en: "The sunset ride was the best part of the trip. The horses are very gentle.",
        pt: "O passeio ao entardecer foi o melhor da viagem. Os cavalos são muito mansos.",
      },
    },
    {
      id: "r2",
      author: "Rodrigo M.",
      rating: 4,
      text: {
        es: "Muy buen guía, se nota que conoce el campo. Llevar bloqueador y gorro.",
        en: "Very good guide who clearly knows the countryside. Bring sunscreen and a hat.",
        pt: "Ótimo guia, dá para ver que conhece o campo. Leve protetor solar e chapéu.",
      },
    },
    {
      id: "r3",
      author: "Fernanda L.",
      rating: 5,
      text: {
        es: "Fuimos en familia con dos niños y todo salió perfecto.",
        en: "We went as a family with two kids and everything was perfect.",
        pt: "Fomos em família com duas crianças e tudo foi perfeito.",
      },
    },
  ],
  "demo-escuela-de-surf-ola-brava": [
    {
      id: "r1",
      author: "Matías S.",
      rating: 5,
      text: {
        es: "Nunca había surfeado y en una hora ya estaba parado en la tabla. Excelentes profes.",
        en: "I had never surfed and within an hour I was standing on the board. Excellent instructors.",
        pt: "Eu nunca tinha surfado e em uma hora já estava em pé na prancha. Professores excelentes.",
      },
      ownerReply: reply(
        "¡Qué bueno, Matías! Te esperamos para el nivel 2.",
        "Great, Matías! See you for level 2.",
        "Que bom, Matías! Esperamos você para o nível 2.",
      ),
    },
    {
      id: "r2",
      author: "Daniela C.",
      rating: 4,
      text: {
        es: "Muy buena clase, aunque el agua estaba helada. Los trajes ayudan harto.",
        en: "Very good lesson, although the water was freezing. The wetsuits help a lot.",
        pt: "Aula muito boa, embora a água estivesse gelada. As roupas de borracha ajudam bastante.",
      },
    },
  ],
  "demo-circuito-casas-antiguas": [
    {
      id: "r1",
      author: "Pablo A.",
      rating: 5,
      text: {
        es: "Aprendí mucho del pueblo en una tarde. Las fotos antiguas son lo mejor.",
        en: "I learned a lot about the town in one afternoon. The old photographs are the best part.",
        pt: "Aprendi muito sobre a vila em uma tarde. As fotos antigas são o melhor.",
      },
    },
    {
      id: "r2",
      author: "Isidora G.",
      rating: 4,
      text: {
        es: "Entretenido y bien explicado. Ideal para ir con los abuelos.",
        en: "Entertaining and well explained. Ideal to do with grandparents.",
        pt: "Divertido e bem explicado. Ideal para fazer com os avós.",
      },
    },
  ],
  "demo-cocineria-sabor-a-mar": [
    {
      id: "r1",
      author: "Andrea T.",
      rating: 5,
      text: {
        es: "Las machas a la parmesana, de las mejores que he probado. Porciones generosas.",
        en: "The parmesan razor clams are among the best I've had. Generous portions.",
        pt: "Os lingueirões à parmesã estão entre os melhores que já provei. Porções generosas.",
      },
    },
    {
      id: "r2",
      author: "Sebastián O.",
      rating: 4,
      text: {
        es: "Rico y a buen precio. Se llena en la hora de almuerzo, conviene reservar.",
        en: "Tasty and well priced. It fills up at lunchtime, so booking helps.",
        pt: "Gostoso e com bom preço. Lota na hora do almoço, convém reservar.",
      },
      ownerReply: reply(
        "Gracias por avisar, ya estamos recibiendo reservas por WhatsApp.",
        "Thanks for the tip, we now take bookings on WhatsApp.",
        "Obrigado pelo aviso, já aceitamos reservas pelo WhatsApp.",
      ),
    },
    {
      id: "r3",
      author: "Paula K.",
      rating: 3,
      text: {
        es: "Comida muy buena, pero el servicio fue lento un sábado de mucho público.",
        en: "Very good food, but service was slow on a busy Saturday.",
        pt: "Comida muito boa, mas o serviço foi lento em um sábado de muito movimento.",
      },
    },
  ],
  "demo-huerta-y-quesos-el-retono": [
    {
      id: "r1",
      author: "Valentina E.",
      rating: 5,
      text: {
        es: "A mis hijos les encantó ver la ordeña. Los quesos y las mermeladas, deliciosos.",
        en: "My kids loved watching the milking. The cheeses and jams are delicious.",
        pt: "Meus filhos adoraram ver a ordenha. Os queijos e as geleias são deliciosos.",
      },
    },
    {
      id: "r2",
      author: "Nicolás B.",
      rating: 5,
      text: {
        es: "Una experiencia auténtica de campo, con gente muy cálida.",
        en: "An authentic countryside experience, with very warm people.",
        pt: "Uma experiência autêntica de campo, com pessoas muito acolhedoras.",
      },
    },
  ],
  "demo-cabanas-brisa-salina": [
    {
      id: "r1",
      author: "Carolina H.",
      rating: 4,
      text: {
        es: "Cabañas limpias y cómodas, con un quincho espectacular. El camino de acceso es de tierra.",
        en: "Clean, comfortable cabins with a great barbecue area. The access road is unpaved.",
        pt: "Cabanas limpas e confortáveis, com uma churrasqueira espetacular. A estrada de acesso é de terra.",
      },
      ownerReply: reply(
        "¡Gracias, Carolina! Estamos mejorando el acceso para esta temporada.",
        "Thanks, Carolina! We're improving the access road for this season.",
        "Obrigado, Carolina! Estamos melhorando o acesso para esta temporada.",
      ),
    },
    {
      id: "r2",
      author: "Gonzalo F.",
      rating: 5,
      text: {
        es: "Tranquilidad total entre el campo y el mar. Perfecto para descansar en familia.",
        en: "Total peace between the countryside and the sea. Perfect for a family rest.",
        pt: "Tranquilidade total entre o campo e o mar. Perfeito para descansar em família.",
      },
    },
  ],
  "demo-noche-de-bandas": [
    {
      id: "r1",
      author: "Antonia D.",
      rating: 5,
      text: {
        es: "Ambiente increíble frente al mar, con música para todas las edades.",
        en: "Incredible atmosphere by the sea, with music for all ages.",
        pt: "Ambiente incrível de frente para o mar, com música para todas as idades.",
      },
    },
    {
      id: "r2",
      author: "Felipe N.",
      rating: 4,
      text: {
        es: "Muy entretenido. Conviene llegar temprano para encontrar estacionamiento.",
        en: "Great fun. Arrive early to find parking.",
        pt: "Muito divertido. Convém chegar cedo para achar estacionamento.",
      },
    },
  ],
  "demo-cata-de-mariscos": [
    {
      id: "r1",
      author: "Marcela J.",
      rating: 5,
      text: {
        es: "Probé cosas que nunca había comido y todo estaba fresquísimo.",
        en: "I tried things I had never eaten and everything was super fresh.",
        pt: "Provei coisas que nunca tinha comido e tudo estava fresquíssimo.",
      },
    },
  ],
};
