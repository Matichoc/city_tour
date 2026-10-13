# Revisión de QA — 2026-10-13

Auditoría automática (axe WCAG 2 A/AA, errores de consola, desbordes móviles, enlaces
internos, metadatos) sobre 21 páginas en español e inglés, más revisión manual de flujos.

## Hallazgos y estado

| # | Severidad | Hallazgo | Estado |
| - | --------- | -------- | ------ |
| 1 | Alta | **Al abrir un enlace compartido de "Mi recorrido" se reemplazaba sin aviso el recorrido guardado** (el efecto leía el estado vacío del primer render). | Corregido: si hay un recorrido guardado distinto, se pregunta. Prueba e2e. |
| 2 | Alta | Contraste: el botón activo ES/EN mostraba texto oscuro sobre turquesa (2,7:1) por un color de tema que se perdió. | Corregido. |
| 3 | Media | Contraste del texto color tierra en avisos (4,2:1 < 4,5:1). | Corregido (#94500f, 5,1:1). |
| 4 | Media | Página 404 en inglés, sin diseño ni salida; rutas desconocidas bajo `/es` sin 404 propio. | Corregido: 404 localizado + catch-all. |
| 5 | Media | Sin página de error: un fallo dejaba la pantalla en blanco. | Corregido: `error.tsx` con reintento. |
| 6 | Media | Pines del mapa con botón anidado dentro de un elemento con rol (axe `nested-interactive`). | Corregido; los lugares siguen en la lista accesible. |
| 7 | Media | Las categorías vacías (alojamiento, gastronomía, actividades) decían "Pronto": se veía sin terminar. | Ahora invitan a sumar negocios y llevan a "Para negocios". |
| 8 | Baja | Sin datos estructurados para Google. | Agregado JSON-LD (TouristDestination, Beach/TouristAttraction, TouristTrip). |
| 9 | Baja | Sin medición: la municipalidad no podría mostrar resultados. | Vercel Web Analytics + eventos anónimos (agregar al recorrido, cómo llegar, compartir, QR, contacto de negocios). |
| 10 | Info | Errores de red de los tiles del mapa en el entorno de pruebas. | No es un bug: el entorno no tiene internet. |

Sin enlaces internos rotos (75 revisados), sin desbordes horizontales en móvil, sin errores
de JavaScript, `lang`, títulos y canonical correctos en todas las páginas.

## Pruebas nuevas

- e2e: 404 localizado, recorrido compartido (no pisa / carga solo), flujo a "Para negocios",
  generador de QR, y **axe sin fallas graves** en 8 páginas.
- CI: nuevo job `e2e` (Playwright + axe) en cada PR.

## Pendiente (no se arregla con código)

- Contenido: solo 7 lugares. Ver `docs/INVESTIGACION.md` (24 candidatos por validar).
- Las tres playas comparten ilustración.
- Activar Web Analytics en Vercel (Analytics → Enable) para ver las métricas.
- Definir el contacto para inscribir negocios (`NEXT_PUBLIC_BUSINESS_CONTACT`).
