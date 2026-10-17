# Plan: mapudungun (`arn`) y rapa nui (`rap`)

Estado: **solo plan y planilla**. No hay código ni traducciones en la app todavía.

## Principio

Igual que con los datos turísticos: **no se inventa**. Nada se traduce con IA ni
con traductores automáticos para mostrarlo como oficial. Cada texto lo entrega
una persona hablante, y la app lo muestra como oficial solo cuando alguien lo
validó.

## Qué se pide a quien traduce

Archivo: [`docs/traduccion/textos-a-traducir.csv`](traduccion/textos-a-traducir.csv)
(99 filas; se abre en Excel o Google Sheets).

| Bloque | Filas | Qué es |
| --- | --- | --- |
| 1-interfaz | 77 | Botones, menús y títulos cortos de la app, y los 7 nombres de categoría. |
| 2-palabras | 17 | Palabras y saludos que la app aún no usa (hola, gracias, mar, playa, cerro…). Sirven para ver cómo se arma el idioma y armar el modelo. |
| 3-topónimos | 5 | Nombres propios (Papudo, Pullally, Las Salinas…). **No se traducen**: solo anotar si existe nombre originario, su significado y la fuente. |

Para cada fila se completan `mapudungun` y/o `rapa nui`, el `alfabeto_usado` y,
si hace falta, una nota (por ejemplo, «según el sector» o «no existe palabra,
se usa el préstamo»). Dejar vacío lo que no se sepa es válido y preferible a
adivinar.

Orden sugerido: primero el bloque 2 (es corto y muestra el estilo), luego el 1.

## Decisiones que toma la persona o comunidad, no el equipo técnico

- **Alfabeto del mapudungun** (Azümchefe, Raguileo o Unificado). Se elige uno y
  se deja escrito en `alfabeto_usado`.
- **Rapa nui**: uso de la oclusiva glotal (ʻ) y de los macrones.
- **Variedad o sector** cuando haya diferencias.
- **Crédito y pago**: quien traduce queda nombrado (si quiere) en la página
  Información. El trabajo se paga; entra en `docs/FINANCIAMIENTO.md`.
- Mapudungun es el idioma con más sentido para una guía de Papudo (región de
  Valparaíso). Rapa nui es más simbólico: se pide igual, pero puede ir después.

## Quién puede validar

Mapudungun: CONADI o programas de lengua de universidades de la zona sur
(por ejemplo UFRO, UC Temuco). Rapa nui: hablantes y organizaciones de Rapa
Nui. Son pistas para buscar; no hay contacto ni acuerdo con nadie aún.

## Cómo se implementará (cuando haya textos)

1. Agregar `arn` y `rap` en `src/i18n` y `src/messages/{arn,rap}.json`
   (códigos de tres letras: no existe código de dos).
2. Lo que falte cae a español (`fallback`): ninguna página queda rota.
3. Ajustar el test de paridad: es/en/pt siguen exigiendo todo; `arn`/`rap`
   aceptan traducción parcial.
4. Cada clave traducida lleva su estado `pending` / `validated` y la UI muestra
   «pendiente de validar por hablante» mientras no esté validada.
5. Selector de idioma: solo muestra el idioma cuando tiene un mínimo traducido.
6. Alcance: las fichas de comercios **no** se traducen (las escribe cada
   local y cambian seguido); solo la interfaz y las categorías.

## Qué no se hará

- Traducir con IA y publicarlo como si fuera oficial.
- Traducir nombres propios ni topónimos.
- Usar palabras originarias como decoración sin autorización de quien las aporta.

## Próximos pasos

1. Elegir a la persona o institución que traduce y acordar crédito y pago.
2. Enviar la planilla; recibirla completa o parcial.
3. Cargar los textos con estado `pending` y mostrarlos con su aviso.
4. Cuando una persona hablante valide, marcarlos `validated`.
