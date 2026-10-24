# Chile en Ruta — plan del producto (idea registrada, sin construir)

> **Estado:** idea registrada el 24-10-2026. No hay nada construido. «Chile en
> Ruta» es un **nombre de trabajo** (otras opciones: «Turismo en tu Ruta»,
> «Ruta en tu Mano»). Todo lo que sigue son propuestas para decidir.

## 1. Qué es y qué no es

**Chile en Ruta es una app móvil abierta y nacional** para viajar por Chile:
arma rutas entre ciudades con paradas intermedias y muestra qué hacer, dónde
comer y dónde dormir en el camino. Se **puebla con la participación de los
propios lugares turísticos, emprendedores y prestadores** de todo el país, que
se suman solos, más el aporte de los viajeros.

**Es un producto totalmente independiente de Turismo en tu Mano.**

| | **Turismo en tu Mano** | **Chile en Ruta** |
| --- | --- | --- |
| Para quién | La **municipalidad** (cliente) y sus visitantes | El **viajero** y los **oferentes** de todo Chile |
| Qué es | «[Comuna] en tu Mano»: guía de una comuna + panel municipal | **App móvil abierta** con rutas por todo Chile |
| Quién pone los datos | La municipalidad | Los propios negocios, emprendedores y lugares, más la comunidad |
| Cómo se vende | Por municipio | Aparte (modelo en la sección 7) |
| Repo | `Matichoc/city_tour` (Papudo) y uno por comuna | Repo propio |

Ninguno depende del otro. Más adelante podrían conectarse; por ejemplo, una
comuna con Turismo en tu Mano podría publicar sus datos también en Chile en
Ruta. Eso es opcional y no forma parte de este plan.

## 2. Qué resuelve (casos de uso)

**Para el viajero**
1. **Viaje con paradas intermedias.** «Voy de Santiago a La Serena: ¿dónde
   paro?». La app muestra lugares que valen la pena **a lo largo del camino** y
   cuánto cambia el viaje: tiempo en ruta + tiempo de la parada.
2. **Cada viaje, su ruta.** Origen y destino cualquiera (por ejemplo, Santiago
   → Talca con parada en Curicó), filtrando por intereses: patrimonio, comer,
   playa o naturaleza.
3. **Mochileando día a día.** Itinerario por días: cómo llegar, dónde comer,
   qué ver y dónde dormir.
4. **Ahora, cerca de ti.** «Son las 13:10, ¿dónde almuerzo cerca de mi ruta?»,
   «¿dónde duermo esta noche?».
5. **Guardar y compartir** el viaje.

**Para el oferente** (lugar turístico, emprendedor, alojamiento, guía,
artesano…)
6. **Sumarse solo y gratis**, en minutos y desde el celular: ficha, fotos,
   horarios, ubicación y contacto (WhatsApp, teléfono, web).
7. **Aparecer en las rutas** de los viajeros que pasan cerca.
8. Ver cuántas personas lo vieron o lo contactaron (estadísticas básicas).

## 3. Reglas de contenido (no cambian)

- **No inventar datos.** Cada ficha muestra quién la puso y su estado:

  | Estado | Significa |
  | --- | --- |
  | Registrado por el negocio | Lo cargó el propio oferente |
  | Verificado | Chile en Ruta confirmó identidad, ubicación y contacto |
  | Sugerido por la comunidad | Un viajero lo propuso; sin confirmar |
  | Desactualizado | Pasó cierto tiempo sin revisión |

- Fuente y fecha de la última actualización, siempre visibles.
- **Moderación antes de publicar** las fotos y los textos nuevos, con
  protección contra abuso: límites por persona, comprobación anti-robots y
  pruebas firmadas en el servidor. El repo `Matichoc/city_tour` ya resolvió
  esto para los comentarios; ver `docs/DISENO-ABUSE-01-02.md`.
- La ubicación del viajero se usa **solo con su consentimiento** y no se
  guardan coordenadas.
- Revisión legal antes de lanzar: términos de uso, responsabilidad por lo que
  publican los oferentes, y la nueva ley de protección de datos personales.

## 4. Qué hay que construir

### 4.1 Alta y gestión de oferentes
- Registro sin fricción: correo o teléfono con código, ficha guiada y fotos
  desde el celular.
- Panel del oferente para editar su ficha, ver estadísticas y renovar datos,
  con un aviso cuando la ficha queda desactualizada.
- Verificación escalonada: contacto confirmado, luego ubicación y luego, si
  se quiere, documento o visita.

### 4.2 Moderación y administración
- Cola de revisión de altas, fotos y sugerencias de la comunidad.
- Reportes de viajeros («cerrado», «dato incorrecto»).
- Registro de cambios (quién y cuándo).

### 4.3 Búsqueda a lo largo de una ruta
Lugares dentro de un **corredor** de N km alrededor del trayecto, ordenados
por el **desvío** (minutos extra) y por los intereses del viajero.

### 4.4 Ruteo entre ciudades
Servidor de ruteo **propio** (OSRM o Valhalla) con el extracto de Chile de
OpenStreetMap: tramos en auto y a pie, desvío de cada parada y tiempos
estimados. Los servicios públicos gratuitos son de uso justo y no sirven para
una app nacional.

### 4.5 Mapas y uso sin señal
Mapas de Chile en **PMTiles** autoalojados, sin cobro por vista, y **descarga
por región** para usar la app sin señal en carretera.

### 4.6 App móvil y web
- **Recomendado:** monorepo con
  - `apps/mobile`: React Native con **Expo**, la app del viajero y del
    oferente;
  - `apps/web`: Next.js, con la página pública, el panel del oferente (que
    también funciona en el navegador) y la administración;
  - `packages/core`: tipos, motor de itinerario y geometría compartidos.
- Base de datos: Supabase (Postgres + PostGIS para la búsqueda en el
  corredor), con RLS estricta.
- Cuentas **opcionales** para el viajero, solo para guardar y sincronizar
  viajes.

### 4.7 Fuera del primer alcance
- **Horarios de buses interurbanos:** no se conoce una fuente abierta nacional
  confiable. Evaluar GTFS donde exista.
- Reservas y pagos dentro de la app.

## 5. Cómo se puebla (crecimiento)

1. **Oferentes que se suman solos**: es la fuente principal, con difusión
   abierta en redes, gremios, cámaras de comercio y ferias.
2. **Aportes de los viajeros**: sugerir un lugar o avisar que algo cambió.
3. **Datos abiertos** (OpenStreetMap) para servicios básicos del camino,
   rotulados «sin verificar».
4. **Registros públicos de turismo** (por ejemplo, el registro de prestadores
   de SERNATUR): **evaluar** sus condiciones de uso antes de incorporarlos.
5. **Semilla por corredores**: partir con una ruta (por ejemplo, Santiago → La
   Serena) y poblarla bien antes de abrir otra.

## 6. Reutilizable desde `Matichoc/city_tour` (como referencia)

Es un repo público con piezas probadas que conviene copiar o adaptar, no
importar:

| Pieza | Ruta en `city_tour` |
| --- | --- |
| Ruteo a pie y en auto con interfaz intercambiable (`RouteProvider`) | `src/lib/routing/` |
| Recorrido en vivo: ajuste a la ruta, desvío y recálculo | `src/lib/live-nav.ts`, `src/components/trip/` |
| Motor de itinerario | `src/lib/itinerary-engine/` |
| Protección contra abuso en contenido de visitantes | `docs/DISENO-ABUSE-01-02.md`, `supabase/migrations/0027_*`–`0029_*` |
| Modelo de datos con verificación y fuentes | `docs/DATA-MODEL.md` |
| Idiomas es/en/pt | `src/messages/` |

## 7. Modelo de negocio (opciones a decidir)

| Opción | Cómo funciona | Ojo con |
| --- | --- | --- |
| A. Freemium para oferentes | Ficha gratis; pago por destacarse, estadísticas avanzadas o más fotos | Que lo pagado siempre se rotule como «destacado» |
| B. Premium para viajeros | Gratis lo básico; pago por descargas sin conexión, viajes ilimitados o modo mochilero | Competencia con apps de mapas gratuitas |
| C. Alianzas rotuladas | Rutas temáticas con patrocinio (regiones, gremios, marcas), siempre marcadas | No mezclar publicidad con recomendación |

## 8. Fases propuestas

| Fase | Qué |
| --- | --- |
| 0 | Decisiones (sección 9), marca (revisar disponibilidad en INAPI), dominio y esqueleto del repo con reglas, CI y validación |
| 1 | Alta de oferentes + moderación + catálogo con mapa y búsqueda por región |
| 2 | Ruteo entre ciudades y **paradas sugeridas en un corredor** (Santiago → La Serena) |
| 3 | App móvil para el viajero: buscar ruta, paradas, guardar y compartir el viaje |
| 4 | Descarga por región para usar sin señal + modo mochilero día a día + «ahora cerca de ti» |
| 5 | Más corredores y regiones; estadísticas para oferentes; modelo de negocio activo |

## 9. Decisiones pendientes

1. **Nombre** definitivo («Chile en Ruta», «Turismo en tu Ruta» u otro).
2. **Estructura**: monorepo con app + web + paquete común (recomendado) o
   repos separados.
3. **App**: Expo (recomendado) o PWA.
4. **Modelo de negocio**: A, B, C o una mezcla.
5. **Primer corredor** (propuesta: Santiago → La Serena).
6. **Nivel de verificación mínimo** para que una ficha aparezca en las rutas.
