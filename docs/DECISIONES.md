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
