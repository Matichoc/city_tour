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
| 2. «Escuchar» en las fichas de lugar | Primero con la voz del dispositivo (Web Speech API); desde el PR #46, con voz natural (fase 3). | Hecha (PR #37) |
| 3. Voz natural | Azure AI Speech con **Catalina (es-CL)**; inglés y portugués con voces neurales. Cada audio se genera una vez, se guarda en Supabase Storage y se regenera solo si el texto cambia. **Sin voz robótica de respaldo**: si no hay audio, el botón lo avisa. | Hecha (PR #46); falta configurar Azure y escuchar los nombres locales |
| 4a. Audioguía de rutas | En la ficha de una ruta: presentación y cada parada en orden, con «Anterior» y «Siguiente» para saltar entre paradas y la parada que suena resaltada en la lista. | Hecha (PR #39) |
| 4b. Escuchar eventos y pueblos | El mismo reproductor en eventos y pueblos. (Con la fase 3 la audioguía ya sigue sonando con la pantalla bloqueada.) | Pendiente |

Pendiente de la fase 1 que no se resuelve con código: **probar con lector de
pantalla real** (TalkBack en Android y VoiceOver en iPhone) y, si es posible,
con una persona con discapacidad visual (organización local). La auditoría
automática encuentra cerca de un tercio de los problemas.

## Cómo funciona «Escuchar» (fase 3: voz natural)

Regla del proyecto: **nunca voz robótica** (ni la del dispositivo, ni
siquiera de respaldo). Por eso la fase 2, que usaba la voz del teléfono, se
reemplazó entera.

- **Texto:** `src/lib/listen-text.ts` arma lo que se lee (lo usan la página y
  el servidor, así el audio dice exactamente lo que muestra la ficha). Orden en
  una ficha: nombre → categoría y pueblo → aviso de ejemplo → descripción →
  horarios → dirección → «todavía no verificado». En una ruta: la presentación
  y una parte por parada.
- **Servidor:** `/api/escuchar?tipo=lugar|ruta&slug=…&locale=…` arma el texto
  desde los datos (nadie puede pedir que se lea otra cosa) y devuelve un audio
  por parte. Exige el mismo origen, el enlace temporal del sitio cerrado y un
  tope de pedidos por minuto.
- **Voz:** Azure AI Speech por REST (`src/lib/tts/azure.ts`): `es-CL-CatalinaNeural`,
  `en-US-JennyNeural` y `pt-BR-FranciscaNeural`; MP3 mono de 48 kb/s.
  Estilo elegido de oído («Catalina pausada»): 7 % más lento y una pausa de
  350 ms entre frases (`STYLE` en `azure.ts`; su versión entra en el nombre de
  cada audio, así que cambiarlo los regenera todos). Variables
  `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION` (solo servidor).
- **Guardado:** Supabase Storage, bucket público `listen-audio` (migración
  0030). Cada audio se llama `<idioma>/<hash>.<firma>.mp3`: el hash es del
  texto y la voz (un texto editado en `/admin` da un audio nuevo; el
  anterior deja de usarse) y la firma es un HMAC con `REVIEW_GATE_SECRET`.
  Se sube con la **clave pública**: la base solo acepta nombres bien firmados
  y no deja cambiar ni borrar. Así no hace falta la clave de servicio en
  Vercel (regla «nunca la clave de servicio en Vercel», ver
  `docs/DISENO-ABUSE-01-02.md`).
- **Navegador:** `src/components/listen/listen-button.tsx` reproduce las partes
  en orden con un elemento de audio real: **sigue sonando con la pantalla
  bloqueada** y se controla desde ahí y desde los audífonos (Media Session).
  Pausa, continúa, velocidad 1×, 1,25× y 0,8×. Nunca suena solo (WCAG 1.4.2) y
  se corta al salir de la página. Los cambios de estado se anuncian al lector
  de pantalla con `aria-live`.
- **Sin audio** (Azure sin configurar, o falla): el botón dice «El audio con voz
  natural todavía no está disponible». Nunca cae a la voz del dispositivo
  (prueba e2e).
- Medición: evento anónimo `listen_play` (primera vez por ficha o ruta).

## Audioguía de rutas (fase 4a)

- El mismo componente, con **partes** (`ListenSection` en `src/lib/speech.ts`):
  la presentación (nombre, número de paradas y duración, descripción y aviso
  de verificación) y una parte por parada («Parada 2 de 3: Playa de Papudo»,
  su descripción completa y la nota de la ruta).
- «Siguiente» salta al comienzo de la próxima parada; «Anterior» vuelve al
  comienzo de la parada en curso y, si ya estaba ahí, a la anterior (como un
  reproductor de música).
- Mientras suena, la parada se resalta en la lista con `aria-current="step"`
  (un lector de pantalla lo anuncia como «paso actual») y su nombre se
  muestra bajo los controles. Al saltar, el lector anuncia la nueva parada.
- No se mueve la página sola: quien está leyendo otra parte no pierde su lugar.

## Límites conocidos (honestos)

- Una voz sintética puede pronunciar mal nombres locales (Pullally, Los
  Lilenes, chorrillanas): hay que escuchar los audios y, si hace falta,
  corregir con SSML (`<sub alias>` o `<phoneme>`) en `src/lib/tts/azure.ts`.
- El primer «Escuchar» de cada ficha tarda unos segundos (se genera el audio);
  los siguientes son inmediatos.
- Portugués: solo 8 de 21 fichas tienen texto propio; el resto cae al español.
- Volumen actual: ~8.000 caracteres en español (≈ 9 minutos de audio), similar
  en inglés. Pregrabar es barato; el costo real es mantenerlo al día.
