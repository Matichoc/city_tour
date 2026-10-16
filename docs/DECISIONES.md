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
vivo) y `camera_start` (guía con cámara). Nunca se envía la ubicación del
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
