# Decisiones técnicas

## Mapa: `maplibre-gl` fijado en 5.x

`maplibre-gl` 6.x cambió cómo carga su worker y, con el build de Next.js 16
(Turbopack), el mapa falla con "Worker failed to load". Se fija `^5.24.0`, la
misma versión validada en `directorio_turistico`.

**Actualizar a 6.x** cuando haya una versión estable que funcione con el build de
producción. Criterio de aceptación: `pnpm build && pnpm start`, abrir
`/es/rutas/ruta-costera-papudo` y ver el mapa con sus pines y la línea de la ruta.
(Probar con `NEXT_PUBLIC_MAP_STYLE_URL` apuntando a un estilo local si no hay internet.)

## Contenido real, no demostración

Los lugares, pueblos y la ruta salen de `directorio_turistico` (`scripts/seed.ts`),
donde ya tenían fuente. Todo queda `pending` hasta verificarlo en terreno. La
ruta "Ruta costera de Papudo" conserva solo las paradas de la comuna de Papudo de
la ruta original "Papudo y Zapallar", sin inventar una duración.

## Contacto de la municipalidad

El sitio web (`munipapudo.cl`) lo entregó el usuario. Facebook, Instagram y
teléfono vienen del repo de referencia y están por confirmar con la municipalidad.

## Idioma

Primera visita siempre en español (`localeDetection: false`). El inglés es
opcional: si falta la traducción de un lugar, se muestra el español y se avisa.

## Analítica

Vercel Web Analytics (sin cookies, sin datos personales). Eventos propios en
`src/lib/analytics.ts`: `add_to_trip`, `add_route`, `navigate_click`, `share`,
`qr_visit` (con el `origen` del QR), `save_place`, `live_start` (recorrido en
vivo), `camera_start` (guía con cámara) y `cta_click` (botón de acción de un
comercio, con su `slug` y tipo). Nunca se envía la ubicación del
usuario: el GPS y la cámara se usan solo dentro del teléfono. Se activa en
Vercel → Analytics; sin activar, no envía nada.

## QR para negocios

`/es/qr?nombre=...` genera un afiche imprimible cuyo QR abre la guía con
`?origen=<nombre-normalizado>`, para saber qué local trae visitas (sin datos personales).

## Alineación con el PLADETUR (rama `feat/alineacion-pladetur`)

Fuente: PLADETUR de Papudo 2023–2027, iD (`docs/investigacion/`).

- **Categorías = productos del plan** (p. 136): balneario, recreación,
  deportes, cultura y patrimonio, gastronomía y ruralidad; alojamiento queda
  como servicio. Los nombres anteriores (`playas`, `naturaleza`,
  `actividades`) redirigen, así los enlaces y afiches QR ya compartidos siguen
  funcionando. La asignación de lugares es una propuesta y hay que validarla
  con el municipio (humedal urbano y Costanera → recreación; Santuario de
  Pullally y Salinas → ruralidad).
- **Agenda de eventos** (B2.4): `/eventos`, con eventos recurrentes y fuente.
  No se publican fechas de una edición concreta; se revisan cada trimestre.
- **Modo quiosco** (A1.6): `/quiosco`, para tablet en las oficinas de
  información. No se indexa, no guarda datos y vuelve al inicio tras ~75 s sin
  uso.
- **Portugués** (pp. 150 y 174): tercer idioma. La interfaz está traducida con
  IA y queda **por revisar por una persona**; el contenido de lugares, rutas y
  eventos cae a español con aviso, igual que el inglés.
- **QR para señalética** (A1.3): `/qr?lugar=<slug>` genera un afiche que lleva
  a la ficha del lugar con `?origen=hito-<slug>`, y cada ruta trae su QR para
  imprimir. Las visitas por QR se miden con el evento anónimo `qr_visit`.
- **Fase 2 (con Supabase):** encuesta de satisfacción, reporte para el Comité
  de Turismo y registro de prestadores. No se hacen sin base de datos.

## Contenido de ejemplo (demo) y estilo "con onda"

- **Fichas, eventos y opiniones de ejemplo** (`src/content/demo-content.ts`):
  son **ficticios** y existen solo para mostrar cómo se vería la guía. Siete
  fichas (una por producto) y dos eventos, con opiniones simuladas y
  respuestas del local. Reglas: todo lleva el rótulo «Ejemplo»; no tienen
  coordenadas, dirección, teléfono ni fuente real; **las opiniones simuladas
  solo se asocian a fichas ficticias, nunca a comercios reales** (hay un test);
  no se indexan (`noindex`) ni salen en el sitemap.
  Se ocultan todas con `NEXT_PUBLIC_SHOW_DEMO=0`: **hacerlo antes de abrir el
  sitio al público.**
- **Demostración de opiniones**: en las fichas y eventos de ejemplo el
  visitante puede escribir una opinión con estrellas. Se guarda solo en su
  dispositivo (localStorage). La versión real necesita cuentas, moderación y
  base de datos (Fase 2).
- **Tipografía**: Baloo 2 (títulos, redondeada y juvenil) y Pacifico (lemas
  sueltos, estilo letrero de playa), autoalojadas con `@fontsource` (sin
  llamadas a Google en cada visita).
- **Idioma**: selector desplegable (`<select>` nativo).

## Contenido desde Supabase, con respaldo en el repo

- El sitio lee lugares, eventos, rutas y localidades de Supabase cuando
  `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están definidas
  (`src/lib/db/content-source.ts`). Si faltan, si la base falla o si no tiene
  lugares publicados, usa `src/content`: el sitio nunca queda vacío y
  producción sigue igual mientras no tenga base propia.
- Se lee con `fetch` a la API REST (sin `@supabase/supabase-js`, que no hace
  falta para leer lo publicado) y se refresca cada 5 minutos (ISR, etiqueta
  `content`). Se envía solo el encabezado `apikey`, que sirve para la clave
  `anon` y para la nueva `sb_publishable_…`.
- Las páginas obtienen los datos con `await getData()`; las pruebas usan
  `createData(STATIC_CONTENT)`.
- Hasta que exista el panel municipal, `src/content` sigue siendo la fuente:
  `pnpm db:content` genera `supabase/content.sql` y una prueba avisa si quedó
  desactualizado.
- La base de desarrollo va solo en Preview/Development de Vercel; Production
  tendrá su propio proyecto Supabase.

## Enlaces temporales para las vistas previas

- Ambientes: `develop` (equipo; por ahora es la rama de producción en Vercel,
  cerrada), `demo` (para compartir por horas) y `main` (en espera hasta abrir
  el sitio al público). Las vistas previas se cierran con `SHARE_LINK_SECRET`
  (solo en Preview) y se abren con enlaces firmados: el del equipo es
  permanente (`?para=equipo`) y los demás vencen solos (4 h por defecto, máx.
  30 días). Se comparten por `papudo-dev.vercel.app` y
  `papudo-demo.vercel.app`, para que la dirección no lleve el nombre de la
  rama. El equipo usa la clave de Production (`develop`) y el `demo` la de
  Preview, así el `demo` se corta sin tocar el enlace del equipo. Guía: [`COMPARTIR-VISTA-PREVIA.md`](COMPARTIR-VISTA-PREVIA.md).
- Se hizo en el proxy y no con los *Shareable Links* de Vercel porque esos no
  vencen solos. La clave para crear enlaces se pide con la ventana de usuario y
  contraseña del navegador (HTTP Basic) para que no quede en la URL ni en los
  registros.

## Panel `/admin` (primera parte: ver y verificar)

- `/admin/ingresar`: correo y contraseña de Supabase Auth. Solo entra quien
  tiene perfil activo en `profiles` (admin, editor o verificador); los tokens
  van en cookies httpOnly limitadas a `/admin` y el proxy renueva el de acceso
  antes de que venza. Se usa la API REST con `fetch`, sin librerías.
- `/admin`: lugares, eventos y rutas con su estado de publicación y
  verificación (incluye borradores, por RLS de personal). `/admin/<tipo>/<id>`:
  fuentes, historial y formulario que llama a `verify_entity()` (solo admin y
  verificador; deja registro en `verification_logs`). Al guardar se invalida
  la caché del contenido (`revalidateTag("content", "max")`).
- El sitio público muestra el estado de verificación que viene de la base.
- `/admin` va sin prefijo de idioma (solo español) y queda detrás de la misma
  puerta de enlaces que el resto del sitio.
- Pestaña **Localidades** (pueblos y sectores, con cuántos lugares tiene cada
  uno, si tiene ubicación y su fuente), enlace «Ver en el sitio» en cada fila
  publicada y «Abrir el sitio» en la cabecera.
- **Vista previa**: la ficha publicada se ve dentro del panel en formato
  teléfono (un `iframe` del mismo sitio, que pasa por la misma puerta de
  enlaces). Los borradores no tienen vista previa porque el sitio público no
  los muestra.
- Pendiente (Fase 2): editar fichas, crear borradores, fotos, usuarios y roles.

## Comentarios de visitantes (reales)

- Se publican al enviarlos (sin cuenta), con nombre opcional, 1–5 estrellas y
  hasta 500 caracteres. Solo en fichas y eventos reales publicados; las de
  ejemplo siguen con la demostración local.
- Freno automático: filtro de groserías (`src/lib/profanity.ts`), campo
  trampa para robots y límite en la base (3 por hora y 10 por día por
  remitente; 30 por hora por ficha). El remitente se identifica con un hash
  con sal de IP y navegador (`REVIEWS_SALT`, o la clave de enlaces): nunca se
  guarda la IP y la huella no es legible por la API.
- La única entrada es `submit_review()`; la tabla no admite inserciones
  directas. En `/admin/comentarios` el personal oculta o vuelve a mostrar
  (admin y editor) y borra (solo admin); todo queda en `audit_log`. Los
  cambios se ven al instante en el sitio (`updateTag("reviews")`).
- Pendiente: respuesta del comercio a una opinión (cuando existan cuentas de
  negocio).

## Comercios: botón de acción, avisos e invitación (`/admin/comercios`)

- **Botón de acción** por local (WhatsApp, llamar, web, carta, reservas,
  Instagram): columnas `places.cta_kind`/`cta_value`, editables por admin y
  editor. WhatsApp y teléfono se arman desde el número (`ctaHref`); el resto
  exige `https://`. `content.sql` no toca estas columnas. Cada clic se mide
  con el evento anónimo `cta_click`.
- **Avisos destacados** (`notices`): título, texto, enlace y fecha de término
  (fin del día, hora de Chile). De un local, salen en su ficha; generales, en
  la portada. Se pausan, activan o borran; vencen solos (RLS y un segundo
  filtro por si la página quedó en caché).
- **Invitación a comercios** (`site_settings`, solo admin): se enciende o apaga
  y, con el enlace del formulario, el botón «Sumar mi comercio» va directo a
  él (explorador, fichas de negocios y `/negocios`).
- Los cambios se ven al instante (`updateTag` de `content`, `notices`,
  `settings`).

## Datos de comercios al día (cada 6 meses)

- `places.info_updated_at` (migración 0019): última vez que el comercio
  confirmó o actualizó sus datos. La registra el personal (admin, editor) con
  «Marcar actualizada hoy» en `/admin/comercios#actualizacion`; `content.sql`
  no la toca.
- Vence a los 6 meses y se avisa 30 días antes (`src/lib/freshness.ts`). El
  panel ordena primero los sin fecha y los vencidos, muestra un aviso en
  `/admin` con cuántos faltan y trae el mensaje listo para el comercio (con
  botón de WhatsApp si el local tiene ese botón de acción).
- La ficha pública muestra la fecha de la última verificación y, en los
  comercios, la de confirmación de datos; si pasaron más de 6 meses, avisa al
  visitante que revise horarios y precios antes de ir.
- Mientras el sitio esté cerrado, el enlace a la ficha que va en el mensaje
  solo abre con un enlace de acceso.

## Fotos y videos en los comentarios (migración 0020)

- Hasta 4 archivos por comentario (un solo video, de máx. 1 minuto), 25 MB
  cada uno; JPG, PNG, WebP, MP4, WebM o MOV.
- **Detector gratuito en el navegador**: NSFW.js (modelo MobileNetV2), sin
  cuenta ni costo y sin enviar nada a terceros. Se carga solo al elegir un
  archivo; en los videos revisa 8 cuadros y usa el peor. Bloquea el desnudo
  explícito (`Porn`/`Hentai`); «Sexy» no bloquea (trajes de baño en una guía
  de playas), pero marca el archivo como «Revisar con cuidado».
  Reglas en `src/lib/media-policy.ts`.
- Como el detector del navegador se puede saltar, **nada se publica solo**:
  los archivos van a un bucket privado (`review-media`) y quedan «por
  revisar» hasta que el personal los aprueba en `/admin/comentarios`
  (filtro «Fotos por revisar»). Rechazar o borrar el comentario borra el
  archivo. El sitio los muestra con enlaces firmados que solo se pueden crear
  para lo aprobado de comentarios visibles.
- Los visitantes solo suben a rutas que registró `attach_review_media()`
  (mismo remitente que el comentario, dentro de 15 minutos) y antes de 30
  minutos; `finish_review_media()` deja en revisión solo lo que llegó.
- Más adelante, con tráfico: un servicio en el servidor (Sightengine, Google
  Vision o AWS Rekognition) podría aprobar solo lo que pase su revisión.

## Datos de los comercios que se suman (migración 0021)

- El formulario «Suma tu comercio» (Google Forms → planilla) es la fuente de
  los comercios adheridos. Se cargan en `src/content` con su fuente («Datos
  entregados por el local», con fecha) y quedan `pending` hasta verificarlos
  en terreno. El nombre y el correo de quien responde **no** se publican ni se
  guardan en el repo.
- Horarios por temporada que se repiten cada año (`place_hours.from_month`,
  `to_month`, `holidays`; día 0 = domingo). La ficha los muestra como
  «Enero a febrero · Todos los días · 09:00–22:00» y aclara «Informado por el
  local». Sin horarios, sigue «Por confirmar».
- Instagram y enlace de Google Maps del local (`places.maps_url`): «Cómo
  llegar» usa la coordenada si existe; si no, el enlace de Maps; si no, una
  búsqueda por nombre y dirección.
- El botón de WhatsApp y la fecha de confirmación entran por `content.sql`
  solo si están vacíos; después mandan los cambios del panel.
- Primer comercio: Roots Salinas (17-10-2026).

## Paleta desde el logo municipal

Los tokens de color del sitio pasaron a los colores del logo en versión
pálida (detalle y contrastes en [`MARCA-REFERENCIA.md`](MARCA-REFERENCIA.md)).
El logo no se usa.

## Imágenes de los comercios (migración 0022)

- Logo, carta, fotos y promociones que entrega el local (autorizadas en el
  formulario) van, por ahora, en `public/lugares/<slug>/` como WebP
  re-codificado (sin metadatos: las fotos de celular traen la ubicación GPS).
  `content.sql` las registra en `place_images` con tipo, tamaño, texto
  alternativo en es/en/pt y crédito; solo reemplaza las rutas del repo
  («/...»), así las que se suban después desde el panel no se pisan.
- La ficha muestra el logo junto al nombre y una sección «Fotos y carta». Las
  promociones se rotulan «Publicidad del local» y los precios de la carta se
  advierten como sujetos a cambio. La ilustración de portada se mantiene hasta
  tener fotos del lugar.
- Registro SERNATUR: número y vigencia que informa el local, como texto (no se
  reproduce el sello oficial); avisa si venció. Se confirma al verificar.
- No se copian fotos de Google Maps: pertenecen a quien las subió. Solo se
  usan las que el local entregue.
