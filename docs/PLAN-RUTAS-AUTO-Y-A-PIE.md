# Plan: recorridos en auto y a pie, por calles

Estado: **plan inicial, sin código**. Nace de la prueba en terreno del recorrido
en vivo (Papudo, Las Salinas, Pullally). Lo que funciona bien (mapa, GPS,
brújula, cámara a pie) **no se toca**: este plan lo extiende.

## 1. Resumen

Decisiones ya tomadas (versión 2 de este plan):

- **La ruta se arma sobre la marcha**, desde donde estás hasta la parada, por
  calles reales, y se **recalcula** si te desvías. **No** habrá rutas
  prehechas ni constructor de rutas en el panel.
- Cerca: a pie. Lejos: **auto y a pie**, como Google Maps, con auto sugerido.
- El camino se dibuja **por las calles** (nunca una diagonal) y la
  **flecha/brújula orienta por la calle**.
- En auto se ve **bien por dónde ir** en el mapa, y se puede abrir Google Maps
  o Waze para la navegación con voz.
- Se acepta que la ubicación viaje al servicio de rutas **solo al calcular la
  ruta**, con aviso claro y sin registro.
- Fase 0 aprobada y hecha (#31).

## 2. Lo que vimos y por qué pasa (verificado en el código)

| Lo que vimos en la prueba | Causa | Dónde |
| --- | --- | --- |
| "12 horas" a un lugar a 30 km | Los minutos se calculan solo **a pie** (4,5 km/h) sobre la distancia en línea recta; no existe otro modo | `src/lib/live-nav.ts` (`walkMinutes`) y `live-trip.tsx` |
| Solo ofrece ir caminando | "Abrir en Google Maps" siempre usa `travelmode=walking`; no hay selector de modo | `live-trip.tsx` (`walkingUrl`) |
| Línea diagonal recta "por encima de las casas" | El tramo hacia la próxima parada se dibuja como una línea entre dos puntos; no hay una ruta por calles | `live-trip.tsx` (`toNext`) |
| La flecha apunta en diagonal, no por donde se camina | El rumbo se calcula en línea recta al destino | `live-nav.ts` (`bearingDegrees`) |
| Tiempos del itinerario inconsistentes con el recorrido en vivo | El itinerario supone **40 km/h** en línea recta; el recorrido en vivo supone **4,5 km/h** | `itinerary-engine/build-itinerary.ts` vs `live-nav.ts` |

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
- Si te desvías de la calle, la ruta se **recalcula** sola.

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

**Qué cambia al calcular la ruta en vivo (y no precalcular):** cada persona que
use el recorrido genera consultas al servicio. Por eso el spike mide también el
**cupo y el costo reales** (¿alcanzan los planes gratuitos?) y se evalúa una
instancia propia de Valhalla u OSRM si no alcanzan. Se reduce el gasto con:
recalcular **solo si te desvías** más de ~40 m o cambia la parada (no en cada
lectura del GPS), caché por tramo con coordenadas redondeadas y un tope por
persona y por día.

**Sobre «usar las opciones de los mapas integrados»:** nuestro mapa (MapLibre
con OpenFreeMap) solo **dibuja**; no calcula rutas. Para dibujar el camino
dentro de la app necesitamos un servicio de rutas aparte. Para la **navegación
con voz giro a giro** se abre Google Maps, Waze o Apple Maps con el modo
correcto, que ya hacen eso muy bien.

Requisitos comunes:

- La llamada pasa por **nuestro servidor** (una ruta de Next), nunca desde el
  teléfono: así la clave no se expone, se puede cachear y se puede limitar el
  abuso (se alinea con el diseño de ABUSE-01/02).
- Se registran **cero datos personales** y se cachea por tramo redondeado.
- Atribución: «© OpenStreetMap contributors» y lo que pida el proveedor.
- **Privacidad (aceptada):** para trazar la ruta desde donde estás hay que
  enviar tu ubicación al servicio. Hoy la promesa es que no sale del teléfono.
  Se envía **solo cuando la persona pide la ruta** (y al recalcular si se
  desvía), con un aviso claro en ese momento, y se actualiza el texto de
  privacidad (`startLiveNote` y la política). Sin registrar nada.

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
   se **recalcula desde tu posición** (con límite de frecuencia, ver 4.2). Si
   no hay servicio, se vuelve a la línea recta avisándolo.
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

### 4.5 Cuando algo falla

| Situación | Qué hace la app |
| --- | --- |
| Sin internet | Línea recta, tiempos estimados por factor de rodeo, aviso visible; el botón para abrir en Google Maps sigue |
| Servicio de rutas caído o sin cupo | Igual que arriba, sin errores en pantalla |
| GPS impreciso | Se amplía la tolerancia al ajustar a la calle y no se recalcula de más |
| El usuario no da permiso de ubicación | Como hoy: puede ver la ruta entre paradas, sin seguimiento |

## 5. Fases

| Fase | Qué entrega | Pruebas | Esfuerzo* |
| --- | --- | --- | --- |
| **0. Arreglo inmediato** ✅ (#31) | Selector auto/a pie con tiempos **estimados por modo**, modo sugerido según distancia, Google Maps con el modo elegido | Unitarias y e2e | hecho |
| **1. Ruta por calles en vivo** | `RouteProvider`, **spike de 2 candidatos** (calidad en Papudo, cupo, costo), ruta de Next con caché, tope y aviso de privacidad, camino dibujado por calles para auto y a pie, tiempos y distancias reales, **recálculo al desviarte**, atribución | Unitarias con `fetch` simulado, caché, tope y fallback; e2e | 3–4 días |
| **2. Flecha por la calle** | Ajuste a la línea, punto adelantado, fuera de ruta, cámara a pie con el nuevo rumbo, demo caminando por la calle | Unitarias de geometría; e2e en demo; **prueba en terreno** | 2 días |
| **3. Itinerario por modo** | Estimador único de tiempos, orden óptimo por tiempo, modo por tramo (también usando la ruta real cuando exista) | Unitarias del motor | 2–3 días |
| **4. Manual y cierre** | Manual de administración al día, checklist de terreno, ajuste de umbrales | — | 1 día |

\* Estimaciones mías, de trabajo efectivo; el spike y la prueba en terreno
pueden moverlas.

Cada fase es **un PR aparte**, con bitácora, pruebas de regresión y sin cambiar
lo que ya funciona (mapa, GPS, brújula, cámara).

## 6. Pruebas

- **Unitarias:** reglas de modo y umbrales; tiempos por modo; geometría (ajuste
  a la línea, punto adelantado, fuera de ruta, distancia restante); cliente de
  rutas con respuestas simuladas, error, límite y sin red.
- **e2e (modo demostración):** aparece el selector; el camino sigue la calle;
  la flecha cambia al doblar.
- **Terreno (Papudo):** (1) parada a 200 m a pie; (2) parada a ~2 km; (3) Las
  Salinas ↔ Papudo en auto y a pie; (4) salirse de la calle y volver;
  (5) sin datos móviles; (6) iPhone y Android; (7) cámara a pie en una esquina.

## 7. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Calles de Papudo/Pullally mal o incompletas en OpenStreetMap | El spike lo mide primero; corregir el mapa abierto es posible y gratuito |
| Cupo o términos del servicio de rutas (ahora cada visita consulta) | Recálculo solo al desviarse, caché, tope por persona/día, interfaz intercambiable, instancia propia si hace falta |
| Costo si crece el uso | Medir en el spike antes de decidir; caché y topes |
| Privacidad de la ubicación | Envío solo al pulsar «Calcular ruta», aviso claro, sin registro |
| GPS impreciso en calles angostas | Tolerancias y recalculo limitado; se ajusta con pruebas en terreno |
| Abuso del servicio de rutas desde el sitio | Límite por IP/ventana y topes diarios; mismo enfoque de ABUSE-01/02 |

## 8. Decisiones

**Ya tomadas**

1. Empezar por la Fase 0. ✅
2. La ubicación puede viajar al servicio de rutas al calcular el camino, con
   aviso claro y sin registro.
3. Sin rutas prehechas: la ruta se arma y se recalcula sobre la marcha.
4. En auto se ve el camino en el mapa y se puede abrir Google Maps o Waze.

**Pendientes**

5. ¿Los umbrales de 1,5 km y 5 km te parecen bien para Papudo? (ya están en la
   Fase 0; se ajustan tras la prueba en terreno).
6. ¿Presupuesto para el servicio de rutas: solo gratuito, o hay margen para un
   plan pago o una instancia propia si el spike lo justifica?
7. ¿La navegación con voz queda en Google Maps/Waze (recomendado) o la
   quieres dentro de la app? (mucho más trabajo)

## 9. Fuera de alcance por ahora

Navegación giro a giro con voz dentro de la app, rutas prehechas por el equipo, rutas sin conexión, transporte público,
bicicleta, tráfico en tiempo real y reservas.
