# Marca: colores tomados del logo municipal

> **No es un manual oficial.** El logo «MuniPapudo» se usa **solo como
> referencia de color**: el logo mismo no aparece en la guía (falta
> autorización y decidir cómo se presenta). Del sitio web municipal no se toma
> nada. Confirmar con la municipalidad si se oficializa.

![Paleta](marca/paleta-municipal.png)

## Colores del logo (medidos en el archivo, 17-10-2026)

Mediana de los píxeles de cada cuadro del logo que entregó el usuario.

| Color      | En el logo | Pálido (sitio) | Tinta (texto) | Uso en la guía                          |
| ---------- | ---------- | -------------- | ------------- | --------------------------------------- |
| Rojo       | `#FE0000`  | `#E58A86`      | `#A8403C`     | Patrimonio; tinta de avisos (`--earth`) |
| Turquesa   | `#00CCCB`  | `#6FCBCA`      | `#1B7070`     | Botones secundarios, enlaces (`--sea`)  |
| Amarillo   | `#FFCC00`  | `#F4D36E`      | `#8A6A14`     | Balneario; sol (`--sun`)                |
| Magenta    | `#FF0198`  | `#E98BBD`      | `#8A2F5E`     | Recreación; acción principal (`--coral`) |
| Azul noche | `#000132`  | `#22234A`      | `#22234A`     | Texto (`--foreground`)                  |

El lema del logo usa turquesa `#22CACA` y la flecha, magenta `#FC0398`.

Los tokens están en `src/app/globals.css`; los degradados de las tarjetas por
producto, en `src/components/ui/category-card.tsx`, y los pines del mapa, en
`src/lib/map-config.ts`. Los cuatro cuadros del logo se asocian a cuatro
productos (amarillo: mar y sol → balneario; magenta: árboles → recreación;
rojo: patrimonio; turquesa: campo → ruralidad). Deportes (azul), gastronomía
(naranja) y alojamiento (lila) son mezclas de esos colores. Los verdes de
campo (`--field`) se mantienen para «Verificado».

## Accesibilidad (WCAG AA, texto normal ≥ 4,5:1)

| Combinación                               | Contraste |
| ----------------------------------------- | --------- |
| Texto `#22234A` sobre arena `#FDF8EE`     | 14,1      |
| Texto secundario `#56587A` sobre blanco   | 6,8       |
| Blanco sobre turquesa `#1B7070`           | 5,6       |
| `#3B0A26` sobre magenta pálido `#E98BBD`  | 7,1       |
| Rojo tinta `#A8403C` sobre blanco         | 6,1       |
| Blanco sobre el pie de cada tarjeta       | 5,1 a 9,2 |

Los colores pálidos (y el amarillo y turquesa del logo) nunca van como texto
sobre blanco: solo fondos, bordes o decoración.

## Tipografía

El logo usa una sans geométrica redonda y gruesa para «MuniPapudo» y una
cursiva para el lema. La guía mantiene **Baloo 2** (títulos, de la misma
familia visual) y **Pacifico** (acentos sueltos, en lugar de la cursiva),
autoalojadas con `@fontsource`.
