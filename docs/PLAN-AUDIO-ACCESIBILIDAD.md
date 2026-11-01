# Audio e inclusión — plan por fases

Pedido del usuario (2026-11-01): un botón de audio en cada lugar con
descripción, pensado como inclusivo («para alguien que sea no vidente»), y
evaluar que todo el sitio se pueda escuchar en orden.

## La decisión de fondo

- **Una persona ciega ya navega con su lector de pantalla** (VoiceOver,
  TalkBack, NVDA). Un «leer toda la página» propio choca con el suyo (dos voces
  a la vez), le quita el control y no lo encuentra sin navegar igual. Para ella
  lo que importa es que **el sitio sea 100 % navegable con lector**: títulos en
  orden, botones con nombre, imágenes descritas, saltar el menú, mapa con
  alternativa en texto.
- **El botón «Escuchar» sirve a otras personas**: baja visión, adultos
  mayores, dislexia o poca lectura, turistas caminando o con sol en la
  pantalla, quien no domina el idioma.
- Por eso hay dos frentes complementarios: accesibilidad real (fase 1) y audio
  para todos (fases 2–4). Ninguno reemplaza al otro.
- Argumento comercial: los sitios del Estado de Chile deben cumplir una norma
  técnica de accesibilidad basada en WCAG 2.0 AA (por confirmar el decreto
  vigente). Para una municipalidad, «cumple WCAG AA y tiene audioguía» suma.

## Fases

| Fase | Qué | Estado |
| ---- | --- | ------ |
| 1. Accesibilidad de base | Saltar al contenido; mapas en el idioma del sitio y con nombre en cada pin; h1 en el 404; títulos de categoría en Explorar; carrusel sin rol inválido. Auditoría axe WCAG 2.1 A/AA + buenas prácticas: 0 fallas en 18 páginas. | Hecha (PR #37) |
| 2. «Escuchar» en las fichas de lugar | Voz del dispositivo (Web Speech API), gratis y sin servidor. | Hecha (PR #37) |
| 3. Voz natural pregrabada | Audio por ficha con una voz neural (p. ej. voces chilenas de Azure), guardado en Supabase Storage y regenerado al editar el texto en `/admin`; si falta, se usa la voz del dispositivo. | Pendiente: decidir voz sintética o narración humana local |
| 4. Escuchar páginas y audioguía de rutas | El mismo reproductor en eventos, pueblos y rutas; en una ruta, las paradas en orden y con la pantalla bloqueada (Media Session). | Pendiente |

Pendiente de la fase 1 que no se resuelve con código: **probar con lector de
pantalla real** (TalkBack en Android y VoiceOver en iPhone) y, si es posible,
con una persona con discapacidad visual (organización local). La auditoría
automática encuentra cerca de un tercio de los problemas.

## Cómo funciona «Escuchar» (fase 2)

- Componente `src/components/listen/listen-button.tsx`; lógica pura en
  `src/lib/speech.ts` (pruebas en `tests/unit/speech.test.ts`).
- **Orden de lectura** (armado en la ficha, `lugares/[slug]/page.tsx`): nombre →
  categoría y pueblo → aviso de ficha de ejemplo → descripción → horarios →
  dirección → «todavía no verificado» o «puede estar desactualizado».
- **Nunca suena sola** (WCAG 1.4.2): solo al tocar el botón. Se corta al salir
  de la página.
- **Trozos cortos** (≤ 200 caracteres, por oración): Chrome corta en silencio
  las lecturas largas y pausar a mitad no funciona en Android. Pausar cancela y
  «Continuar» retoma desde el trozo en curso.
- **Voz**: `es-CL` si el dispositivo la tiene; si no, una latinoamericana antes
  que la de España; a igualdad, la más natural. Se elige en cada trozo porque
  Chrome entrega la lista de voces tarde. Sin voz en ese idioma, avisa en vez
  de leer con acento de otro idioma.
- Velocidad 1×, 1,25× y 0,8×. Los cambios de estado se anuncian al lector de
  pantalla con una región `aria-live`.
- Si el navegador no tiene Web Speech, el botón no aparece.
- Medición: evento anónimo `listen_play` (primera vez por ficha), para decidir
  con datos si vale la pena la fase 3.

## Límites conocidos (honestos)

- La calidad de la voz depende del teléfono: en algunos Android suena robótica
  o con acento de España; en iPhone se corta al bloquear la pantalla.
- Una voz sintética puede pronunciar mal nombres locales (Pullally, Los
  Lilenes, chorrillanas). En la fase 3 hay que escuchar cada audio y usar un
  diccionario de pronunciación.
- Portugués: solo 8 de 21 fichas tienen texto propio; el resto cae al español.
- Volumen actual: ~8.000 caracteres en español (≈ 9 minutos de audio), similar
  en inglés. Pregrabar es barato; el costo real es mantenerlo al día.
