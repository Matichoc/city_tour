# Imágenes del sitio: prompts para crearlas con GPT

## Reglas (para no engañar al visitante)

1. **Ilustración, no foto.** Las imágenes hechas con IA se presentan siempre como
   ilustración (el sitio las marca así). **Nunca** como "foto real" de un lugar.
2. **Sin texto dentro de la imagen.** La portada anterior traía letras ("ZAPALLAR",
   "LOS MOLLES") que no corresponden a una ruta solo de Papudo y no se pueden
   corregir. Los textos van en el sitio, en español y en inglés.
3. **Sin lugares inventados.** Para fichas de lugares reales, lo ideal es la foto real
   (propia o con licencia). La ilustración sirve como fondo de categoría o de ruta.
4. **Formato:** `.webp`, ≤ 300 KB. Horizontal 4:3 (1600×1200) o 16:9 (1600×900).
5. **Consistencia:** usar el mismo bloque de estilo (abajo) en todos los prompts.

## Bloque de estilo (pegar al final de cada prompt)

> Estilo: ilustración editorial plana con textura suave de papel, trazos limpios,
> sin texto ni letras, sin logotipos, sin personas con rostro reconocible.
> Paleta: turquesa profundo #0b7285, turquesa vivo #1fb6c9, arena #fdf8ee,
> dunas #ecd29a, coral/atardecer #ff7a59, sol #ffb454, verde campo #4a7a37 y
> #2f5233. Luz cálida de atardecer. Composición con aire para colocar texto encima.

## Prompts

### 1. Portada de ruta: "Ruta costera de Papudo" (1600×1200)
`public/rutas/ruta-costera-papudo.webp`
> Vista aérea baja de una bahía de la costa central de Chile al atardecer: una playa
> larga de arena clara con olas suaves, un paseo peatonal junto al mar, un pueblo
> pequeño con techos bajos, y detrás lomas de campo verde y dunas. Al fondo a la
> izquierda un humedal con una laguna tranquila y aves (garzas, gaviotas).
> Sin letreros ni texto.

### 2. Humedal y dunas — "Salinas de Pullally" (1600×900)
`public/ilustraciones/humedal-pullally.webp`
> Humedal costero al amanecer: laguna de aguas calmas con reflejos, juncos, aves
> acuáticas (perrito, pilpilén, gaviota garuma), dunas bajas de arena dorada y el
> mar al fondo con una línea de espuma. Pequeño bote de pescador amarrado a un
> muelle de madera. Aire de calma.

### 3. Playa resguardada — "Playa Chica" (1600×900)
`public/ilustraciones/playa-chica.webp`
> Cala pequeña y resguardada con aguas turquesa tranquilas, rocas a ambos lados,
> arena clara, algunos quitasoles y toallas de colores, un velero a lo lejos.
> Mediodía luminoso.

### 4. Campo y cerros (1600×900)
`public/ilustraciones/campo-papudo.webp`
> Paisaje de campo de la zona central de Chile cerca de la costa: lomas suaves con
> pastizales dorados y verdes, un camino de tierra, un cerco de madera, árboles
> nativos (espino, quillay) y una bruma marina baja entrando desde el mar.

### 5. Paseo costero al atardecer (1600×900)
`public/ilustraciones/paseo-costanera.webp`
> Paseo peatonal junto a la playa al atardecer, con barandas, faroles encendidos,
> familias caminando de espaldas, puestos de artesanía pequeños y el sol bajo sobre
> el mar. Ambiente cálido.

### 6. Plaza del pueblo (1600×900)
`public/ilustraciones/plaza.webp`
> Plaza central de un pueblo costero chileno de día: árboles grandes, bancas,
> una feria artesanal con toldos de colores, gente conversando, techos bajos y
> cerros verdes de fondo.

### 7. Imagen para compartir en redes / WhatsApp (1200×630)
`public/og/portada.png`
> Composición horizontal con el sol bajo sobre el mar, olas en capas turquesa,
> una playa y lomas de campo en la parte inferior. Gran espacio libre arriba a la
> izquierda para superponer el nombre "Papudo en tu mano" desde el sitio.

### 8. Íconos de categoría (6 piezas, 512×512, fondo transparente)
`public/ilustraciones/cat-<slug>.webp` — repetir con cada tema:
> Ícono ilustrado simple y redondeado de **[olas y sol | hoja y colina | arco de
> iglesia pequeña | cuchillo y tenedor con un pescado | cama con techo | persona
> caminando con mochila]** sobre círculo suave, 2–3 colores de la paleta, sin texto.

### 9. Estados vacíos (3 piezas, 800×600)
- "Aún no hay lugares" (alojamiento, gastronomía): una mesa vacía junto al mar con un
  letrero en blanco (sin texto) y gaviotas curiosas.
- "Tu recorrido está vacío": una mochila abierta y un mapa doblado sobre la arena.
- "Mapa no disponible": una brújula sobre la arena con una ola que la roza.

### 10. Ícono de la aplicación (PWA) (1024×1024)
`public/icons/icon-1024.png`
> Ícono de app cuadrado: sol naranja sobre ola turquesa en dos capas, fondo turquesa
> profundo, esquinas rectas (el sistema las redondea), sin texto.

## Después de generarlas

1. Guardar en las rutas indicadas y optimizar a `.webp` (≤ 300 KB).
2. Avisarme y las conecto: portada de la ruta, fondo de cada categoría y la imagen de
   compartir (Open Graph).
3. Marcar en el sitio "Ilustración generada con IA" en cada imagen.

## Estado de las ilustraciones

| # | Pieza | Estado | Dónde se usa |
| - | ----- | ------ | ------------ |
| 1 | Portada ruta costera | Entregada | `public/rutas/ruta-costera-papudo.webp`: ruta, portada y vista al compartir |
| 2 | Humedal | Entregada | `public/ilustraciones/humedal.webp`: Laguna y Salinas de Pullally, categoría "Campo y naturaleza", pueblos Pullally y Las Salinas |
| 5 | Paseo costero | Entregada | `paseo-costanera.webp`: Costanera, categoría Actividades, pueblo Papudo |
| 6 | Plaza | Entregada | `plaza.webp`: Plaza de Papudo y categoría Patrimonio |
| 9a | Terraza sin letrero (estado vacío) | Entregada | `hostales.webp`: Alojamiento y Gastronomía sin lugares |
| 3 | Playa | Entregada | `playa.webp`: categoría Playas (las tres playas) |
| 4 | Campo y cerros | Pendiente | |
| 7 | Imagen para compartir 1200×630 | Pendiente (hoy se usa la portada de la ruta) | |
| 8 | Íconos de categoría | Pendiente (hoy íconos SVG propios) | |
| 9b, 9c | Estados vacíos "recorrido vacío" y "mapa no disponible" | Pendiente | |
| 10 | Ícono de la app (PWA) | Pendiente (hoy `src/app/icon.svg`) | |

### Escenas SVG generadas por código (octubre 2026)

`scripts/illustrations/generate.py` genera 14 escenas vectoriales originales en
`public/ilustraciones/*.svg` (`python3 scripts/illustrations/generate.py`): caleta,
cabalgata, surf, parador, casas, cocinería, mariscos, huerta, cabañas, música, feria,
buque, procesión y fondas. Son escenas genéricas, no retratos de un lugar real; se
muestran siempre con "Ilustración IA". Se usan en las fichas y eventos de ejemplo, y
en la caleta, la Fiesta de San Pedro, el Combate Naval, la FIP y las Fiestas Patrias.

Cada ilustración se muestra con el rótulo discreto "Ilustración IA". Las fotos reales
de cada lugar, cuando existan, reemplazan a la ilustración de su ficha.
