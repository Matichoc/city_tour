# Diseño técnico: comentarios y subida de archivos con privilegios mínimos

Estado: **implementado** en el código y en las migraciones `0027`, `0028` y
`0029`; **falta aplicarlo en producción** (ver «Despliegue en producción» al
final). Lo que cambió respecto del diseño original está en «Diferencias con el
diseño». Corresponde a los hallazgos
`ABUSE-01` (límites de envío de comentarios) y `ABUSE-02` (almacenamiento) de la
auditoría de seguridad. La alternativa elegida es la **B: privilegios mínimos
con prueba firmada (HMAC)**, sin usar la clave `service_role`.

## 1. El problema, en breve

Los comentarios y las fotos de visitantes entran por tres funciones de la base
de datos que cualquiera con la clave pública puede llamar:
`submit_review`, `attach_review_media` y `finish_review_media`. Los controles
que hoy protegen (filtro de groserías, campo trampa, cálculo de la huella del
remitente) viven en la aplicación, **no en la base**. La huella que limita los
envíos la elige quien llama a la función. Por eso los límites se pueden evitar
saltándose la aplicación, y los archivos pendientes (hasta 4 por comentario,
25 MB cada uno) pueden ocupar mucho espacio del plan gratuito de Supabase (1 GB).

Las migraciones están en un repositorio público, así que este punto se puede
descubrir leyéndolas; este documento no incluye pasos para aprovecharlo.

## 2. Lo que existe hoy (verificado en el código)

| Pieza | Hoy |
| --- | --- |
| `submit_review` (`0017`) | Valida ficha publicada y texto; límite de **3 por hora y 10 por día por huella** y **30 por hora por ficha**. La huella llega como parámetro. |
| `attach_review_media` (`0020`) | Registra hasta 4 archivos (máx. 1 video) de un comentario de los últimos 15 min con la misma huella; devuelve las rutas. |
| `finish_review_media` (`0020`) | Pasa a «pendiente» lo que de verdad llegó al bucket. |
| Subida a Storage | Enlace firmado que emite el servidor; la política `review_media_upload` solo deja subir a una ruta registrada, en estado `uploading` y de menos de 30 min. Bucket privado, 25 MB por archivo. |
| Huella del remitente | `sha256` de la sal, la IP y el `User-Agent`, en `src/lib/reviews-actions.ts`. La sal es `REVIEWS_SALT` y, si falta, `SHARE_LINK_SECRET` o vacía. |
| Moderación | Los comentarios se publican al enviarse; el personal los oculta. Las fotos y videos no se ven hasta que el personal los aprueba. |
| Limpieza | No hay: los registros `uploading` y sus archivos quedan para siempre. |

## 3. Objetivos y fuera de alcance

**Objetivos**

1. Que **solo nuestro servidor** pueda crear comentarios y registrar archivos,
   aunque la base siga aceptando llamadas con la clave pública.
2. Que una prueba capturada **no se pueda reutilizar** ni usar para otro
   contenido.
3. Límites de volumen que **no dependan de datos que controla el visitante**
   (huella, tamaños declarados, `User-Agent`).
4. Un tope de espacio y una limpieza de subidas abandonadas.
5. Que filtrar groserías y bots siga ocurriendo antes de aceptar el envío.

**Decidido:** los comentarios **se siguen publicando al enviarse** (no se ocultan
hasta aprobarlos), y el panel avisa al equipo que hay comentarios nuevos por
revisar (ver 5.8).

**Fuera de alcance:** cuentas de visitantes y avisos por correo o WhatsApp.

## 4. Alternativas

| | A. `service_role` | **B. Prueba firmada (elegida)** | C. Edge Function |
| --- | --- | --- | --- |
| Cómo | Se quita el permiso a `anon`; el servidor llama con la clave de servicio | La base exige una prueba firmada por el servidor | Una función en Supabase tiene la clave de servicio |
| Si se filtra el secreto | Acceso total a la base | Solo permite crear comentarios | Queda en Supabase, no en Vercel |
| Cambia la regla «nunca la clave de servicio en Vercel» | Sí | **No** | No |
| Esfuerzo | ~1 día | ~1,5–2 días | 2–3 días y más herramientas |

## 5. Diseño de la alternativa B

### 5.1 El secreto

- Un secreto largo y aleatorio, `REVIEW_GATE_SECRET`, vive en **dos lugares**:
  la variable privada de Vercel (solo servidor, sin `NEXT_PUBLIC`) y una tabla
  del esquema `private` de Supabase, que la API no expone y que solo leen las
  funciones `security definer`.
- Se carga **a mano** (tú lo escribes en el SQL Editor y en Vercel; nunca en un
  chat ni en el repositorio).
- Admite **dos secretos a la vez** (vigente y anterior) para rotarlo sin cortar
  el servicio.
- Si se filtra, el daño se limita a poder crear comentarios; no da lectura ni
  escritura general de la base.

### 5.2 La prueba (token)

El servidor, después de aplicar sus controles, firma:

```
payload = base64url({
  v: 1,
  act: "review" | "media" | "finish",   // para qué sirve
  sender: <huella>,                     // quién envía
  bind: <a qué contenido>,              // ver abajo
  exp: <ahora + 120 s>,                 // vencimiento corto
  nonce: <16 bytes aleatorios>          // uso único
})
token = payload + "." + base64url(HMAC-SHA256(secreto, payload))
```

- **`bind`:** para `review`, un hash de `entidad|slug|texto|nombre|estrellas`;
  para `media` y `finish`, el id del comentario. Una prueba capturada no sirve
  para otro texto ni para otro comentario.
- **Protección contra reutilización:** la función guarda el `nonce` en
  `private.used_proofs` (clave única). Si ya existe, rechaza («prueba usada»).
  Los nonces vencidos se borran con la limpieza periódica.
- **Vencimiento:** la función compara `exp` con el reloj de la base, con una
  tolerancia de ±30 s por diferencias de reloj entre Vercel y Supabase.
- La función verifica con `hmac()` (extensión `pgcrypto`, a confirmar en el
  proyecto) y compara la firma completa.

### 5.3 Funciones nuevas

- Se crean `submit_review_v2`, `attach_review_media_v2` y
  `finish_review_media_v2`, con un parámetro más (`p_proof`). Verifican la
  prueba **antes de cualquier otra cosa** y toman la huella **de la prueba**, no
  de un parámetro suelto.
- Se mantienen las funciones actuales hasta que el nuevo código esté
  desplegado; después se les quita el permiso y se eliminan. Así el despliegue
  no tiene corte (ver 6).

### 5.4 Límites que no dependen del visitante

| Límite | Valor propuesto (a ajustar) | Por qué es confiable |
| --- | --- | --- |
| Envíos por huella | 5 por hora, 15 por día | La huella viene firmada |
| Envíos por ficha | 10 por hora | Cuenta filas de la base |
| **Tope global de comentarios** | 150 por día | No depende de ninguna huella |
| **Tope global de archivos nuevos** | 100 por día | Cuenta filas de la base |
| **Tope de espacio pendiente** | 300 MB entre `uploading` y `pending` | Ver abajo |
| Por comentario | hasta 4 archivos, 1 video | Como hoy |

- **No se confía en el tamaño declarado.** El bucket deja subir hasta 25 MB
  aunque se haya declarado menos, así que, mientras un archivo está
  `uploading`, se cuenta con el **máximo del bucket**; en `pending`, con el
  tamaño real que registra Storage.
- **Huella:** `sha256` de la sal y la IP, **sin `User-Agent`** (cambiar de navegador no
  la cambia). La sal pasa a ser obligatoria (`REVIEWS_SALT` sin respaldo): si
  falta, el servidor rechaza el envío en vez de usar una sal vacía.
- **Cuando se alcanza un tope global:** los comentarios sin archivos siguen
  funcionando hasta su propio tope; los archivos se desactivan con un mensaje
  claro y sin error.
- Los valores viven en una tabla de configuración del esquema `private`, para
  ajustarlos sin migración.

### 5.5 Controles en el servidor (antes de firmar)

- Se mantienen el **campo trampa** y el **filtro de groserías** de
  `submitReview`.
- Se agrega **Cloudflare Turnstile** (gratis): el formulario envía el token y el
  servidor lo valida con Cloudflare antes de firmar. Variables
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`; si no están
  definidas, la validación se desactiva (como hoy).
- Como solo el servidor sabe firmar, **todo lo que llega a la base ya pasó por
  estos controles**.

### 5.6 Limpieza de subidas abandonadas

- Cada 15 min, una tarea de `pg_cron` (gratis) marca como vencidos los
  registros `uploading` de más de 1 hora y borra los nonces usados vencidos.
- Los **archivos** en Storage no se pueden liberar borrando filas de la base:
  hay que usar la API de Storage. Se propone un botón **«Limpiar subidas
  abandonadas»** en `/admin/comentarios` que borra esos archivos con el token
  del personal (la política ya permite borrar a administración y edición).
  Se confirma en pruebas que el espacio realmente se libera.

### 5.7 Rotación del secreto

1. Se agrega el secreto nuevo como vigente y se deja el anterior como
   «anterior».
2. Se cambia la variable en Vercel y se despliega.
3. Pasada una hora, se elimina el anterior.

### 5.8 Aviso de comentarios nuevos en el panel

Los comentarios siguen apareciendo en el sitio apenas se envían. Para que el
equipo se entere sin tener que revisar a ciegas, el panel muestra cuáles son
nuevos:

- **Aviso visible:** un contador junto a **Comentarios** en el menú del panel y
  en la portada del panel («3 comentarios nuevos por revisar»). Incluye las
  fotos y videos pendientes, que ya tienen su propio filtro.
- **Lista:** los comentarios sin revisar llevan la etiqueta **Nuevo** y hay un
  filtro **Por revisar**.
- **Cómo se revisa:** un botón **Marcar como revisado** (y **Marcar todos**).
  Ocultar, volver a mostrar o borrar un comentario también lo da por revisado.
- **Datos:** columna `reviewed_at` (y quién lo revisó) en `reviews`; los
  permisos para marcar son los de moderación (administración y edición). La
  migración marca como revisados los comentarios que ya existen, para que el
  contador parta en cero y no dé una falsa alarma.
- **Pruebas:** el contador cuenta solo lo no revisado y lo visible u oculto
  sin revisar; marcar revisado lo baja; un comentario nuevo lo sube; un visitante
  no puede marcar ni ver el estado.
- **Más adelante (no incluido):** aviso por correo o WhatsApp cuando llegue un
  comentario; requiere un servicio de envío.

## 6. Orden de despliegue (sin corte)

| Paso | Qué | Quién |
| --- | --- | --- |
| 1 | Migración A: esquema `private`, tablas, funciones `_v2`, sus permisos y los topes | tú, en el SQL Editor |
| 2 | Cargar el secreto en la tabla y en Vercel (`REVIEW_GATE_SECRET`, tipo secreto) | tú |
| 3 | Desplegar el código que firma y llama a las `_v2` (y Turnstile, si se activa) | fusión del PR |
| 4 | Verificar: un comentario normal, uno con foto, uno rechazado por groserías | tú |
| 5 | Migración B: quitar el permiso a las funciones antiguas y eliminarlas | tú |
| 6 | Activar la limpieza periódica y el botón de limpieza | tú / PR |

Reversión: el paso 1 es aditivo; mientras no se ejecute el paso 5, las funciones
antiguas siguen disponibles. Después del 5, volver atrás exige reponerlas
(script de reversión incluido en la migración).

### Qué debes configurar

- **Supabase:** pegar la migración A y la B; insertar el secreto en la tabla con
  una sentencia que te daré (el valor lo generas y escribes tú); activar
  `pg_cron` (Database → Extensions) si se usa la limpieza automática.
- **Vercel:** variable `REVIEW_GATE_SECRET` (tipo **Sensitive**, solo servidor)
  y, para Turnstile, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.
  También `REVIEWS_SALT` (obligatoria).
- **Cloudflare (decidido: se usa Turnstile):** en el panel de Cloudflare,
  *Turnstile → Add widget*, con el dominio del sitio, y copiar las dos claves
  (la del sitio es pública; la secreta va solo en Vercel).

## 7. Pruebas

Se escriben **primero** y deben fallar antes de la corrección.

**Base de datos (`tests/db`)**

1. Con la clave pública, las funciones antiguas dejan de ser ejecutables
   (después de la migración B).
2. `_v2` sin prueba, con firma inválida, con un campo alterado o vencida: rechazada.
3. La misma prueba usada dos veces: la segunda se rechaza.
4. Una prueba de otro texto o de otro comentario: rechazada.
5. Límites por huella, por ficha y **globales**; el tope de espacio cuenta el
   máximo del bucket para `uploading`.
6. Un archivo no se puede registrar para un comentario de otra huella.
7. Rotación: se acepta el secreto anterior mientras exista y deja de aceptarse
   al eliminarlo.
8. La limpieza marca vencidos los `uploading` viejos y borra nonces vencidos.
9. Se conservan las pruebas actuales de subida (ruta no registrada o vencida:
   rechazada).

**Unitarias**

10. Firma y verificación con **vectores de prueba compartidos**: el mismo
    token se valida en Node y en Postgres (evita que difieran en codificación).
11. La huella ignora el `User-Agent` y exige sal.
12. El servidor rechaza groserías, campo trampa y Turnstile inválido **antes**
    de firmar.

**e2e**

13. Un comentario normal y uno con foto siguen funcionando de punta a punta.
14. Un comentario nuevo hace aparecer el aviso en el panel y **Marcar como
    revisado** lo quita.

## 8. Riesgos, decisiones y alcance relacionado

| Tema | Detalle |
| --- | --- |
| Secreto en dos sistemas | Se mitiga con rotación con dos secretos y con que su filtración solo permite crear comentarios. |
| Reloj distinto entre Vercel y Supabase | Tolerancia de ±30 s y vencimiento de 120 s. |
| IP compartida (red móvil) | Los topes por huella son holgados; los topes globales no dependen de ella. |
| `pgcrypto` y `pg_cron` | Confirmar que están disponibles en el proyecto antes de empezar. |
| Pruebas existentes | Hay que adaptarlas con un ayudante que genere pruebas válidas. |
| `analytics_events` abiertos (`DB-01`) | No se usa en la aplicación. Quitar su política de inserción abierta es 1 h y puede ir en la migración B si lo apruebas. |

**Decididas**

- Los comentarios **se publican al enviarse**, y el panel avisa de los nuevos
  (5.8).
- **Se usa Turnstile** (ya hay cuenta de Cloudflare).

**Pendientes (se explican en lenguaje simple en la conversación)**

1. ¿Te parecen bien los valores de la sección 5.4, o los ajustamos?
2. ¿Apruebas el botón «Limpiar subidas abandonadas» en `/admin/comentarios`?
   (Son reservas de archivos que nadie terminó de subir; ver 5.6.)
3. ¿Incluimos quitar la política de inserción abierta de `analytics_events` en
   la migración B? (Es una tabla de estadísticas que la aplicación no usa y que
   hoy deja agregar filas a cualquiera; ver 8.)

**Estimación:** 2 a 2,5 días de desarrollo con pruebas (incluye el aviso en el panel), más unos 30 minutos de
pasos manuales tuyos (Supabase, Vercel y, si se activa, Cloudflare).

## 9. Qué no cambia

El formulario y el flujo para el visitante, el filtro de groserías, el campo
trampa, la revisión del personal de fotos y videos, las políticas de lectura y
las pruebas de base de datos que ya existen.

## 10. Diferencias con el diseño

- **Sin `pg_cron`:** no hace falta activarlo. La limpieza de nonces y el
  vencimiento de las reservas de archivos (más de 1 hora) ocurren dentro de las
  propias funciones, en cada envío.
- **Botón «Limpiar subidas abandonadas»:** borra de Storage los archivos de las
  reservas abandonadas y las deja registradas como descartadas. Aparece en
  `/admin/comentarios` solo si hay algo que limpiar.
- **Sin secreto no se publica:** si falta `REVIEW_GATE_SECRET` (o
  `REVIEWS_SALT`) en Vercel, el servidor no envía el comentario y lo avisa en
  los registros. Las funciones antiguas ya no existen (migración `0029`), así
  que el antiguo «modo de transición» se retiró del código.
- **Aviso en el panel:** contador junto a «Comentarios» y en la portada,
  etiqueta «Nuevo», filtro «Por revisar» y botones para marcar uno o todos.
  Moderar un comentario o un archivo también lo da por revisado.

## 11. Despliegue en producción (en este orden)

| Paso | Qué | Quién |
| --- | --- | --- |
| 1 | Aplicar `0027_review_gate.sql` y `0028_review_notice.sql` en el SQL Editor (aditivas; no cambian nada visible) | tú |
| 2 | Generar un secreto (`openssl rand -base64 48`) y cargarlo en la base con `supabase/manual/cargar-secreto-comentarios.sql` (reemplazando el valor de ejemplo, solo en el SQL Editor) | tú |
| 3 | En Vercel (Production, y Preview si se prueba ahí), tipo **Sensitive**: `REVIEW_GATE_SECRET` (el mismo valor) y `REVIEWS_SALT` (otro valor largo y aleatorio). Opcional: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` | tú |
| 4 | Fusionar el PR y esperar el despliegue | tú |
| 5 | Verificar en el sitio: un comentario normal, uno con foto, y que en `/admin` aparece el aviso de comentario nuevo | tú |
| 6 | Aplicar `0029_close_open_doors.sql` (cierra las funciones antiguas y la inserción abierta de `analytics_events`) | tú |
| 7 | Probar otra vez un comentario; si algo falla, `supabase/manual/revertir-0029.sql` | tú |

Si se aplicara `0029` antes de cargar el secreto y desplegar, los comentarios
dejarían de funcionar hasta completar los pasos 2 a 4.
