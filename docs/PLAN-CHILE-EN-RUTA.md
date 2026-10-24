# Chile en Ruta — plan de la segunda app (idea registrada, sin construir)

> **Estado:** idea registrada el 24-10-2026. No hay nada construido. «Chile en
> Ruta» es un **nombre de trabajo** (otras opciones: «Turismo en tu Ruta»,
> «Ruta en tu Mano»). Todo lo que sigue son propuestas para decidir.

## 1. Dos productos, una misma base

| | **Turismo en tu Mano** (lo que existe) | **Chile en Ruta** (la idea nueva) |
| --- | --- | --- |
| Para quién | La **municipalidad** (cliente) y sus visitantes | El **viajero** de todo Chile |
| Qué es | «[Comuna] en tu Mano»: guía web/PWA de **una comuna** + panel municipal | **App móvil** que conecta comunas y arma rutas por todo Chile |
| Ejemplos | Papudo en tu Mano, Petorca, Cabildo, Zapallar, Rancagua, Chiloé… | Santiago → La Serena con parada en La Ligua; Santiago → Talca con parada en Curicó |
| Cómo se vende | Suscripción o proyecto por municipio (ver `FINANCIAMIENTO.md`) | Aparte, como app propia (modelo por definir, sección 7) |
| Repo | Un repo = una comuna (este repo es Papudo) | Repo propio (sección 9) |

**Turismo en tu Mano no cambia:** se sigue vendiendo comuna por comuna y el
foco actual (Papudo y la provincia de Petorca) se mantiene. Cada comuna que se
suma aporta **datos verificados** (lugares, rutas, eventos, fuentes y fechas
de verificación). Chile en Ruta **consume esos datos**: entre más comunas haya
con Turismo en tu Mano, mejor es Chile en Ruta. Ese es el efecto red entre los
dos productos.

## 2. Qué resuelve (casos de uso)

1. **Viaje con paradas intermedias.** «Voy de Santiago a La Serena: ¿dónde
   paro?». La app muestra lugares que valen la pena **a lo largo del camino**
   (por ejemplo, la Ruta del Diablo en Petorca o la costa de Papudo) y cuánto
   cambia el viaje: tiempo en ruta + tiempo de la parada.
2. **Cada viaje, su ruta.** Origen y destino cualquiera (Santiago → Talca con
   parada en Curicó), con intereses (patrimonio, comer, playa, naturaleza).
3. **Mochileando día a día.** Itinerario por días: cómo llegar, dónde comer,
   qué ver y dónde dormir, con la ruta de cada tramo.
4. **Ahora, cerca de ti.** Situaciones del día a día: «son las 13:10, ¿dónde
   almuerzo cerca de mi ruta?», «¿dónde duermo esta noche?».
5. **Compartir y guardar el viaje**, como ya se hace con «Mi recorrido» en
   Turismo en tu Mano.

## 3. Qué ya existe en este repo y se puede reutilizar

| Pieza | Dónde está | Cómo sirve a Chile en Ruta |
| --- | --- | --- |
| Modelo de datos con verificación y fuentes | `docs/DATA-MODEL.md`, `src/content/types.ts`, `supabase/migrations/` | Base del **contrato de datos común** entre comunas |
| Rutas por calles a pie y en auto | `src/lib/routing/` (`RouteProvider`, OSRM) | Misma interfaz; cambia el servidor (sección 4.3) |
| Recorrido en vivo: ajuste a la ruta, desvío y recálculo | `src/lib/live-nav.ts`, `src/components/trip/` | Navegación de cada tramo |
| Motor de itinerario | `src/lib/itinerary-*` | Base del itinerario por días |
| Idiomas es/en/pt | `src/messages/` | Igual |
| Reglas de contenido (no inventar, `pending`, fuente y fecha) | `CLAUDE.md`, `docs/PLAN.md` §8 | Se mantienen tal cual |
| Consentimiento antes de enviar la ubicación | `src/lib/routing/client.ts` | Mismo criterio de privacidad |

## 4. Qué falta (lo nuevo)

### 4.1 Contrato y «feed» de datos por comuna
Cada instancia de Turismo en tu Mano publica un **feed público y versionado**
(JSON/GeoJSON) solo con lo **publicado**: lugares, rutas y eventos, con su
estado de verificación, fuente, fecha y licencia. Es lo que permite «sumar
catastros» sin copiar bases a mano. Además sirve a las municipalidades como
**datos abiertos**, así que suma valor a Turismo en tu Mano aunque Chile en
Ruta no exista todavía.

### 4.2 Agregador nacional
- Ingesta de los feeds de cada comuna y de otras fuentes (sección 5).
- Índice por región y comuna, deduplicación y **búsqueda a lo largo de una
  ruta**: lugares dentro de un corredor de N km alrededor del trayecto,
  ordenados por desvío (minutos extra) e interés.
- Nunca mezcla dato verificado con no verificado sin mostrarlo.

### 4.3 Ruteo entre ciudades
El servicio público de FOSSGIS que hoy usa Papudo es de **uso justo** y no
sirve para una app nacional. Se necesita un **servidor de ruteo propio**
(OSRM o Valhalla) con el extracto de Chile de OpenStreetMap, que calcule:
tramos auto/a pie, desvío de cada parada y tiempos estimados. La interfaz
`RouteProvider` de este repo ya permite cambiar de proveedor.

### 4.4 Mapas y uso sin señal
Mapas de Chile en **PMTiles** autoalojados (sin cobro por vista) y **descarga
por región** para usar sin señal en carretera. Hoy Turismo en tu Mano no tiene
modo sin conexión: en Chile en Ruta sería parte del núcleo.

### 4.5 App móvil
- **Recomendado:** React Native con **Expo** (TypeScript, se comparte lógica
  con este repo: tipos, motor de itinerario, geometría), con presencia en
  App Store y Google Play y descargas sin conexión.
- Alternativa: PWA (más barata, pero peor en tiendas y en uso sin señal).
- Cuentas **opcionales** solo para guardar y sincronizar viajes.

### 4.6 Fuera del primer alcance
- **Buses interurbanos:** no se conoce una fuente abierta nacional confiable
  de horarios. Evaluar GTFS donde exista; mientras, no se muestran horarios.
- Reservas y pagos.

## 5. Fuentes de datos (en orden de confianza)

1. **Comunas con Turismo en tu Mano**: datos verificados por la
   municipalidad (la fuente principal).
2. **Catastros municipales o regionales existentes**, con acuerdo de uso.
3. **Datos abiertos** (OpenStreetMap) para servicios básicos del camino,
   rotulados «sin verificar».
4. **Registros públicos de turismo** (por ejemplo, el registro de prestadores
   de SERNATUR): **evaluar** condiciones de uso antes de incorporarlos.

## 6. Reglas que no cambian

- No inventar datos turísticos; lo no verificado se muestra como pendiente.
- Fuente y fecha de verificación visibles.
- Ubicación solo con consentimiento, sin guardar coordenadas.
- Revisión legal antes de lanzar (ver `docs/REVISION-LEGAL.md`), incluida la
  nueva ley de protección de datos personales.

## 7. Modelo de negocio (opciones a decidir)

| Opción | Cómo funciona | Ojo con |
| --- | --- | --- |
| A. Gratis, financiada por Turismo en tu Mano | Las comunas adheridas aparecen con datos verificados y destacados | Que el viajero entienda por qué unas comunas tienen más información |
| B. Freemium | Gratis lo básico; pago por descargas sin conexión, viajes ilimitados o modo mochilero | Precio y competencia con apps de mapas gratuitas |
| C. Alianzas rotuladas | Rutas temáticas con patrocinio (regiones, gremios, marcas locales), siempre marcadas como patrocinadas | No mezclar publicidad con recomendación |

## 8. Fases propuestas

| Fase | Qué | Dónde |
| --- | --- | --- |
| 0 | Decisiones: nombre, marca (revisar disponibilidad en INAPI), dominio, modelo de negocio | — |
| 1 | Contrato de datos común + **feed público** en Turismo en tu Mano | Este repo (útil desde ya) |
| 2 | Prototipo de ruteo entre ciudades con **un corredor** (Santiago → La Serena), usando como paradas reales los datos de Papudo y de la provincia de Petorca | Repo nuevo |
| 3 | App móvil mínima: buscar ruta, paradas sugeridas en el corredor, guardar y compartir el viaje | Repo nuevo |
| 4 | Descarga por región para usar sin señal + modo mochilero día a día | Repo nuevo |
| 5 | Más comunas y regiones; transporte público donde exista GTFS | Ambos |

## 9. Decisiones pendientes (para ti)

1. **Nombre** definitivo («Chile en Ruta», «Turismo en tu Ruta» u otro).
2. **Repo**: uno nuevo para la app (recomendado) o un monorepo con paquetes
   compartidos.
3. **Tecnología**: Expo (recomendado) o PWA.
4. **Modelo de negocio**: A, B, C o una mezcla.
5. **Primer corredor** para el prototipo (propuesta: Santiago → La Serena).

## 10. Material ya hecho

Para el video de Turismo en tu Mano se armaron escenas de **concepto** (viaje
Santiago → La Serena con parada en La Ligua, Santiago → Talca con parada en
Curicó, mochilero día a día, «ahora cerca de ti»), rotuladas como simulación.
Quedaron fuera del video municipal y del repo, y sirven como base visual para
presentar Chile en Ruta.
