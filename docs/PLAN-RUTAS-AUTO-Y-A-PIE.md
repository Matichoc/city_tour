# Plan: recorridos en auto y a pie, por calles

Estado: **plan inicial, sin código**. Nace de la prueba en terreno del recorrido
en vivo (Papudo, Las Salinas, Pullally). Lo que funciona bien (mapa, GPS,
brújula, cámara a pie) **no se toca**: este plan lo extiende.

## 1. Resumen

1. Hoy todo es **a pie y en línea recta**. Un lugar a 30 km se presenta como una
   caminata de muchas horas.
2. Queremos que, según la distancia, la app ofrezca **auto y a pie** (como
   Google Maps) y, cuando se está cerca, vaya directo a pie.
3. El camino debe seguir **las calles**, no una diagonal sobre las casas, y la
   **flecha/brújula debe orientar por esa calle**.
4. Las **rutas que arma el equipo** podrán ser en auto, a pie o mixtas, con sus
   tiempos calculados según el modo.
5. Se hace por fases chicas; la primera arregla lo más confuso sin servicios
   externos.

## 2. Lo que vimos y por qué pasa (verificado en el código)

| Lo que vimos en la prueba | Causa | Dónde |
| --- | --- | --- |
| "12 horas" a un lugar a 30 km | Los minutos se calculan solo **a pie** (4,5 km/h) sobre la distancia en línea recta; no existe otro modo | `src/lib/live-nav.ts` (`walkMinutes`) y `live-trip.tsx` |
| Solo ofrece ir caminando | "Abrir en Google Maps" siempre usa `travelmode=walking`; no hay selector de modo | `live-trip.tsx` (`walkingUrl`) |
| Línea diagonal recta "por encima de las casas" | El tramo hacia la próxima parada se dibuja como una línea entre dos puntos; no hay una ruta por calles | `live-trip.tsx` (`toNext`) |
| La flecha apunta en diagonal, no por donde se camina | El rumbo se calcula en línea recta al destino | `live-nav.ts` (`bearingDegrees`) |
| Tiempos del itinerario inconsistentes con el recorrido en vivo | El itinerario supone **40 km/h** en línea recta; el recorrido en vivo supone **4,5 km/h** | `itinerary-engine/build-itinerary.ts` vs `live-nav.ts` |
| Las rutas del equipo no distinguen auto/a pie en pantalla | La tabla `routes` ya tiene `transport_mode` (`walk`, `bike`, `car`, `mixed`), pero **ninguna pantalla lo usa**; y el panel solo edita fichas de lugares completas, las rutas se cargan desde el repositorio (`content.sql`) | `0002_enums_and_helpers.sql`, `0008_routes.sql`, `src/app/admin/` |

La app dice hoy «Tu ubicación no sale de tu teléfono» (`startLiveNote`). Eso
importa para el diseño (ver 4.2).

## 3. Qué queremos lograr (criterios de éxito)

- A más de ~5 km de la parada, se muestran **dos opciones** con tiempo y
  distancia: auto y a pie. El auto es la sugerida.
- A menos de ~1,5 km, se sugiere a pie y se mantiene la cámara a pie.
- El camino dibujado **sigue las calles**; el tramo ya recorrido se ve gris.
- La flecha apunta hacia **donde hay que caminar por la calle**, no hacia el
  destino en línea recta.
- Los tiempos usan el modo elegido y dicen que son estimados.
- Sin internet o si el servicio de rutas falla, **la app sigue funcionando como
  hoy** (línea recta, avisándolo).
- Una ruta armada por el equipo declara su modo y sus tiempos salen de él.

## 4. Diseño

### 4.1 Modos y cuándo se ofrece cada uno

Reglas en un solo archivo de constantes (fáciles de ajustar tras probar en
terreno):

| Distancia a la parada (en línea recta) | Se ofrece | Sugerido |
| --- | --- | --- |
| hasta ~1,5 km | a pie (cámara a pie disponible); auto como alternativa | a pie |
| entre ~1,5 y ~5 km | a pie y auto, ambos con tiempo | a pie, salvo que el tiempo a pie supere ~45 min |
| más de ~5 km | auto y a pie, a pie con aviso de tiempo | auto |

- Las cifras de arriba son una propuesta inicial; se calibran con pruebas en
  Papudo.
- **Cámara a pie**: solo en modo a pie. En auto se muestra el mapa y el tramo,
  sin la flecha de la cámara.
- **Navegación giro a giro con voz** queda **fuera de alcance**: para eso se
  ofrece abrir Google Maps, Waze o Apple Maps con el modo correcto
  (`travelmode=driving` / `walking`).
- Bicicleta y "mixto" existen en la base de datos; se dejan para una fase
  posterior.

### 4.2 Rutas por calles: el motor de rutas

Necesitamos, para un origen y un destino: **geometría** (la línea por calles),
**distancia** y **duración**, por modo (a pie / auto).

| Opción | Cómo | A favor | En contra / a verificar |
| --- | --- | --- | --- |
| Google Maps / Mapbox (APIs de rutas) | pago por uso | muy buena calidad | sus términos suelen exigir mostrar el resultado en su propio mapa; nosotros usamos MapLibre + OpenFreeMap. Verificar antes de descartar o usar |
| OpenRouteService (API) | clave gratuita con cupo | a pie y auto, basado en OpenStreetMap | cupo diario y términos: **verificar vigentes** |
| Valhalla (instancia pública o propia) | basado en OpenStreetMap | a pie, auto y bici; variantes de ruta | la instancia pública es de uso justo, sin garantía; propia implica costo y mantención |
| OSRM público de demostración | — | simple | no es para producción |

**Recomendación:** definir una interfaz `RouteProvider` (origen, destino, modo →
geometría, distancia, duración) y hacer una **prueba corta (spike) con dos
candidatos** usando rutas reales de la comuna (p. ej. Las Salinas ↔ Papudo ↔
Pullally y la ruta costera). Se decide con datos: calidad en calles de Papudo,
cupo, términos y costo. Cambiar de proveedor después debe ser solo
configuración.

Requisitos comunes:

- La llamada pasa por **nuestro servidor** (una ruta de Next), nunca desde el
  teléfono: así la clave no se expone, se puede cachear y se puede limitar el
  abuso (se alinea con el diseño de ABUSE-01/02).
- Se registran **cero datos personales** y se cachea por tramo redondeado.
- Atribución: «© OpenStreetMap contributors» y lo que pida el proveedor.
- **Privacidad (decisión tuya):** para trazar la ruta desde donde estás hay que
  enviar tu ubicación al servicio. Hoy la promesa es que no sale del teléfono.
  Propuesta: enviarla **solo cuando la persona pulsa «Calcular ruta»**, mostrar
  un aviso claro en ese momento y actualizar el texto de privacidad. Las rutas
  entre paradas del equipo se precalculan y no usan ubicación de nadie (ver 4.5).

### 4.3 La flecha y la brújula siguen la calle

Con la línea por calles, el rumbo se calcula hacia un **punto adelantado sobre
la calle**, no hacia el destino:

1. **Ajustar** tu posición a la línea más cercana (con tolerancia a la
   imprecisión del GPS).
2. Tomar el punto que está unos **15–25 m más adelante** sobre la línea (más
   lejos si vas rápido; en una esquina, el siguiente vértice).
3. Flecha = rumbo hacia ese punto menos hacia dónde apunta el teléfono (lo que
   ya existe en `relativeBearing`).
4. **Fuera de ruta:** si te alejas >30–40 m de la línea durante unos segundos,
   se recalcula desde tu posición (con límite de frecuencia). Si no hay
   servicio, se vuelve a la línea recta avisándolo.
5. **Llegada:** se mantiene el radio actual (35 m) hacia la parada.
6. La cámara a pie usa el mismo rumbo.

Son funciones puras (ajustar a la línea, punto adelantado, distancia restante,
fuera de ruta) en `live-nav.ts`: se prueban sin teléfono. El **modo
demostración** pasa a caminar por la calle, para probar la flecha en pantalla
sin salir de casa.

### 4.4 Tiempos y orden de las paradas

- Un solo estimador de tiempos por **modo**, usado por el itinerario y por el
  recorrido en vivo (hoy hay dos criterios distintos).
- Con ruta calculada: se usa su distancia y duración reales.
- Sin ruta (offline o falla): línea recta con un **factor de rodeo** (a pie
  ≈ 1,3; auto ≈ 1,4, a calibrar) y velocidades distintas por modo. Siempre con
  la etiqueta «estimado».
- El orden óptimo de paradas (`optimize-order.ts`) pasa de distancia en línea
  recta a **tiempo según el modo**, cuando hay datos; si no, sigue como hoy.
- Cada tramo del itinerario puede tener su modo (p. ej. auto hasta el sector y
  a pie por el pueblo).

### 4.5 Rutas armadas por el equipo

Hoy el panel no arma rutas. Se propone un **constructor de rutas** en `/admin`:

1. Elegir las paradas (lugares) y su orden.
2. Elegir el modo de la ruta (auto, a pie o mixta) y, si es mixta, el modo de
   cada tramo.
3. El sistema **calcula una vez** cada tramo (geometría, distancia, duración),
   lo muestra en un mapa de vista previa y lo **guarda**. Los visitantes no
   llaman al servicio de rutas para las rutas publicadas: es más rápido, gratis
   y no usa ubicación de nadie.
4. El equipo puede ajustar el tiempo sugerido y recalcular si cambia una parada.
5. Publicar (solo administración, como el resto).

### 4.6 Datos (migración futura `0027`, no aplicada)

- `route_stops`: agregar `leg_mode` (`walk` | `car`) para el tramo que llega a
  esa parada, por defecto el de la ruta.
- Tabla `route_legs` (por ruta y tramo): modo, geometría codificada, distancia,
  duración, proveedor y fecha de cálculo. Lectura pública solo de rutas
  publicadas; escritura admin/editor.
- Todo aditivo, con prueba de base de datos y sin tocar lo existente.

### 4.7 Cuando algo falla

| Situación | Qué hace la app |
| --- | --- |
| Sin internet | Línea recta, tiempos estimados por factor de rodeo, aviso visible; el botón para abrir en Google Maps sigue |
| Servicio de rutas caído o sin cupo | Igual que arriba, sin errores en pantalla |
| GPS impreciso | Se amplía la tolerancia al ajustar a la calle y no se recalcula de más |
| El usuario no da permiso de ubicación | Como hoy: puede ver la ruta entre paradas, sin seguimiento |

## 5. Fases

| Fase | Qué entrega | Pruebas | Esfuerzo* |
| --- | --- | --- | --- |
| **0. Arreglo inmediato (sin servicios externos)** | Selector auto/a pie con tiempos **estimados por modo**; el modo sugerido según distancia; «Abrir en Google Maps» con el modo elegido; deja de decir "12 horas" a pie para lo lejano | Unitarias de reglas y tiempos; e2e del selector | 1 día |
| **1. Rutas por calles** | `RouteProvider`, spike de 2 candidatos, ruta de Next con caché y límite, línea por calles en el mapa, tiempos reales, atribución | Unitarias con `fetch` simulado y fallback; e2e | 2–3 días |
| **2. Flecha por la calle** | Ajuste a la línea, punto adelantado, fuera de ruta, cámara a pie con el nuevo rumbo, demo sobre la calle | Unitarias de geometría; e2e en demo; **prueba en terreno** | 2 días |
| **3. Itinerario por modo** | Estimador único, orden óptimo por tiempo, modo por tramo | Unitarias del motor | 2–3 días |
| **4. Constructor de rutas en el panel** | Pantalla, tramos precalculados, migración 0027, vista previa | BD + unitarias + e2e del panel | 3–4 días |
| **5. Manual y cierre** | Manual de administración al día, checklist de terreno, ajuste de umbrales | — | 1 día |

\* Estimaciones mías, de trabajo efectivo; la prueba en terreno y las
decisiones de abajo pueden moverlas.

Cada fase es **un PR aparte**, con bitácora, pruebas de regresión y sin cambiar
lo que ya funciona (mapa, GPS, brújula, cámara).

## 6. Pruebas

- **Unitarias:** reglas de modo y umbrales; tiempos por modo; geometría (ajuste
  a la línea, punto adelantado, fuera de ruta, distancia restante); cliente de
  rutas con respuestas simuladas, error, límite y sin red.
- **Base de datos:** migración 0027 (permisos, lectura solo de lo publicado).
- **e2e (modo demostración):** aparece el selector; el camino sigue la calle;
  la flecha cambia al doblar.
- **Terreno (Papudo):** (1) parada a 200 m a pie; (2) parada a ~2 km; (3) Las
  Salinas ↔ Papudo en auto y a pie; (4) salirse de la calle y volver;
  (5) sin datos móviles; (6) iPhone y Android; (7) cámara a pie en una esquina.

## 7. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Calles de Papudo/Pullally mal o incompletas en OpenStreetMap | El spike lo mide primero; corregir el mapa abierto es posible y gratuito |
| Cupo o términos del servicio de rutas | Caché, precálculo de rutas del equipo, interfaz intercambiable |
| Costo si crece el uso | Precálculo + caché; medir antes de pagar |
| Privacidad de la ubicación | Envío solo al pulsar «Calcular ruta», aviso claro, sin registro |
| GPS impreciso en calles angostas | Tolerancias y recalculo limitado; se ajusta con pruebas en terreno |
| Abuso del servicio de rutas desde el sitio | Límite por IP/ventana y topes diarios; mismo enfoque de ABUSE-01/02 |

## 8. Decisiones que necesito de ti

1. ¿Empezamos por la **Fase 0** (arreglo inmediato, sin servicios externos)?
2. ¿Aceptas que, **al pulsar «Calcular ruta»**, la ubicación viaje a nuestro
   servidor y al proveedor de rutas, con aviso y sin registro? Si prefieres que
   nunca salga del teléfono, la ruta por calles solo existiría entre paradas ya
   precalculadas.
3. ¿Auto como **visualización + abrir Google Maps/Waze** (recomendado) o
   quieres navegación con voz dentro de la app (mucho más trabajo)?
4. ¿Qué rutas del equipo existen hoy o quieres armar primero? ¿Alguna **mixta**
   (auto hasta un sector y a pie después)?
5. ¿Los umbrales de 1,5 km y 5 km te parecen bien para Papudo?
6. ¿Presupuesto: solo gratuito, o hay margen para un proveedor pago si el
   spike lo justifica?

## 9. Fuera de alcance por ahora

Navegación giro a giro con voz, rutas sin conexión, transporte público,
bicicleta, tráfico en tiempo real y reservas.
