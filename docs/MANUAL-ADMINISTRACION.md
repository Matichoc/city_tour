# Manual del panel de administración

Para quien administra la guía «Papudo en tu Mano». Está escrito paso a paso y
solo describe lo que el panel hace hoy. Lo que aún no existe (por ejemplo,
las rutas por calles en auto o a pie) está en `docs/PLAN-RUTAS-AUTO-Y-A-PIE.md`.

## 1. Quién puede hacer qué

| Rol (como se ve en el panel) | Qué puede hacer |
| --- | --- |
| **Superadmin** | Todo lo de Administración, más invitar y quitar admins municipales en **Equipo** (sección 4). |
| **Administración** (admin municipal, máximo 2) | Todo lo municipal: publicar y archivar, verificar, eventos y rutas, comentarios, carga masiva, invitar locatarios (uno por uno o en lote) y aprobar sus propuestas. |
| **Edición** y **Verificación** | Roles antiguos: siguen funcionando para quien ya los tenía, pero ya no se invitan. |
| **Locatario** | No entra al panel. Propone cambios en **Mi local** con el enlace de su local (3.7). |

Los visitantes no tienen cuenta.

## 2. Entrar y salir

1. Abre `/admin` en el sitio (si no has entrado, te lleva a **Ingresar al panel**).
2. Escribe tu **correo** y **contraseña** y pulsa **Ingresar**.
3. Para terminar, pulsa **Salir**.

La sesión se cierra sola tras unas **4 horas sin usar el panel**. En un
computador compartido (por ejemplo, en la oficina municipal), pulsa siempre
**Salir** al terminar.

Si aparece «Correo o contraseña incorrectos, o tu cuenta no tiene acceso al
panel», revisa los datos; si están bien, tu cuenta aún no tiene rol o está
desactivada (ver sección 5).

## 3. Tareas del día a día

### 3.1 Ver el estado de las fichas
En **Fichas** hay pestañas: **Lugares**, **Eventos**, **Rutas** y
**Localidades**. Arriba ves el resumen (en total, verificados, pendientes,
desactualizados). Cada fila muestra:

- **Publicación:** Borrador, Publicado o Archivado.
- **Verificación:** Pendiente, Verificado o Desactualizado, y la última fecha.

Los cambios pueden tardar unos minutos en verse en el sitio público.

### 3.2 Verificar una ficha
1. En **Fichas**, abre el registro con **Editar**.
2. En **Cambiar estado de verificación**, elige el **Nuevo estado**.
3. En **Nota**, escribe qué revisaste y cómo; en **Enlace de evidencia**, una
   foto o documento si lo hay.
4. Pulsa **Guardar**. Queda en el **Historial de verificación**.

Si ves «Tu rol puede ver, pero no verificar», necesitas el rol de Verificación
o Administración.

### 3.3 Comercios: crear o editar una ficha
En **Comercios**:

- **Nuevo comercio:** crea la ficha. Si no la publicas, queda como **borrador**
  (solo administración publica).
- **Editar ficha, fotos y videos:** datos, horarios (también por temporada),
  logo, carta, fotos, promociones y videos, con su orden, texto y crédito.
- Las fichas editadas aquí **ya no las pisa** la carga automática del
  repositorio.

### 3.4 Importar comercios desde la planilla del formulario
1. En **Comercios → Importar planilla**, pega el **enlace de la planilla de
   Google** (debe estar compartida como «cualquier persona con el enlace puede
   ver») o sube el archivo **CSV**.
2. Pulsa **Revisar**. No guarda nada: muestra qué se crearía o cambiaría.
3. Cada comercio aparece con un estado:
   - **Nuevo:** se crea como borrador.
   - **Ya estaba en la guía:** se vincula sin cambiar sus datos.
   - **Cambió:** se actualiza solo lo que cambió en la planilla.
   - **Sin cambios:** no se toca.
4. Marca o desmarca los comercios y, si eres administración, decide si los
   nuevos se publican.
5. Pulsa **Importar lo seleccionado**.

El nombre y el correo de quien inscribió el comercio se guardan aparte y solo
los ve el personal.

### 3.5 Botón de acción, avisos e invitación
En **Comercios**:

- **Botón de acción en la ficha:** WhatsApp, teléfono o enlace. El número va
  con código de país (+56 9 …); los enlaces con `https://`.
- **Avisos destacados:** título, texto y fecha de término; se pueden **Pausar**,
  **Activar** o **Borrar**. Los de un local salen en su ficha; los generales, en
  la portada.
- **Invitación a comercios:** mostrar u ocultar el recuadro y el enlace del
  formulario (solo administración).
- **Actualización de datos (cada 6 meses):** marca **Actualizada hoy** cuando un
  comercio confirme sus datos; hay un mensaje listo para enviarle por WhatsApp.

### 3.6 Moderar comentarios y fotos
En **Comentarios**:

- Filtra por **Todos**, **Visibles**, **Ocultos** o **Fotos por revisar**.
- **Ocultar** / **Volver a mostrar** un comentario (administración y edición).
- **Borrar** es definitivo (solo administración).
- Las fotos y videos de visitantes **no se ven hasta que los apruebes**:
  **Aprobar** o **Rechazar**. Las marcadas «Revisar con cuidado» merecen una
  mirada atenta.

### 3.7 Locatarios: enlace del local y propuestas

Cada comercio puede proponer cambios a su ficha (descripción, horario,
dirección, botón principal, Instagram y sitio web) sin cuenta ni contraseña,
con un **enlace personal del local**. Nada se publica solo: el personal revisa
cada propuesta.

1. En **Comercios**, abre el local y baja a **Acceso del locatario**.
2. **Generar enlace**. Aparece una sola vez: cópialo o usa **Enviar por
   WhatsApp**, que deja el mensaje escrito. Si se pierde, genera otro (eso corta
   el anterior). Vence al año.
3. El locatario lo abre y llega a **Mi local** (`/local`), donde ve los datos
   actuales de su ficha, propone cambios y deja su nombre. Si ya tenía una
   propuesta pendiente, la nueva la reemplaza.
4. En **Propuestas** (con un número cuando hay pendientes) se ve cada cambio con
   lo que hay **ahora** y lo **propuesto**. **Aprobar y publicar** lo aplica a la
   ficha, la marca como «Datos confirmados por el local y validados por la
   Municipalidad» y registra la fecha de actualización. **Rechazar** no toca la
   ficha; la nota que escribas la ve el locatario.
5. Si cambió el horario, actualiza también las **temporadas** de la ficha: son
   las que calculan «Abierto ahora».
6. **Cortar acceso** deja sin efecto el enlace de inmediato (por ejemplo, si el
   local cambió de dueño).

Requiere la migración `0031_owner_access.sql` aplicada en Supabase.

## 4. Equipo: superadmin, admin municipal y locatarios

El acceso funciona en tres niveles, siempre por **enlace de invitación**:

| Nivel | Quién | Cómo entra | Qué hace |
| --- | --- | --- | --- |
| **Superadmin** | Matichoc (quien opera la plataforma) | Su cuenta en `/admin` | Todo lo del admin, más invitar y quitar admins municipales (**Equipo**). |
| **Admin municipal** | 1 o 2 personas del municipio | Invitación del superadmin | Publica y verifica fichas, rutas y eventos; carga masiva; invita a los locatarios y aprueba sus propuestas. |
| **Locatario** | El dueño o encargado de cada local | Enlace personal del local | Propone cambios a su ficha en **Mi local** (3.7). |

### 4.1 Invitar a un admin municipal (superadmin)
1. En el panel, **Equipo → Invitar a un admin municipal**. Escribe para quién es
   (opcional) y pulsa **Generar invitación**.
2. El enlace aparece **una sola vez**: cópialo o usa **Enviar por WhatsApp**.
   Vence en 7 días. Hay cupo para **2** admin municipales (cada invitación
   abierta ocupa uno hasta que se usa, vence o se revoca).
3. La persona abre el enlace, escribe su nombre, correo y una contraseña
   (mínimo 10 caracteres). Supabase le manda un correo para **confirmar** la
   cuenta.
4. Confirma el correo y entra a `/admin`: en ese **primer ingreso** queda como
   admin municipal. En **Equipo** la verás con su correo.
5. **Quitar acceso** la deja fuera de inmediato (y libera el cupo).

### 4.2 Invitar a los locatarios (admin o superadmin)
- **Uno por uno:** en cada comercio, **Acceso del locatario** (3.7).
- **En lote:** **Comercios → Enlaces en lote**. Marca los locales (por defecto,
  los que aún no tienen enlace), pulsa **Generar**, y envía cada enlace con
  **Enviar a su WhatsApp** (usa el número del botón del local, si lo tiene),
  **Copiar todos** o **Descargar planilla (CSV)**. Los enlaces se ven una sola
  vez; generar uno nuevo corta el anterior de ese local.

### 4.3 Carga masiva de comercios
1. **Comercios → Importar planilla** → **Descargar plantilla (CSV)**: tiene las
   columnas que el panel reconoce (nombre, rubro, localidad, dirección, frase,
   horario, WhatsApp o teléfono, redes o web, Google Maps, nombre y correo de
   contacto). Si la tabla del municipio tiene otros nombres de columna, cópialas
   a la plantilla.
2. Súbela (o pega el enlace de una planilla de Google compartida para ver) y
   pulsa **Revisar**: el panel muestra qué crearía o cambiaría **antes** de
   guardar. Las columnas que no reconoce aparecen aparte.
3. **Importar lo seleccionado**. Los nuevos quedan como borrador; el admin
   puede publicarlos en el mismo paso.
4. Después, **Enlaces en lote** para invitar a todos esos locales.

### 4.4 Configuración de Supabase (una vez, la hace el superadmin)
- **Authentication → URL Configuration → Redirect URLs:** agrega la dirección
  del sitio con `/**` (por ejemplo `https://papudo-dev.vercel.app/**` y, cuando
  exista, el dominio del municipio). Así el correo de confirmación vuelve al
  panel. No afecta a otros proyectos.
- **Authentication → Sign In / Providers:** «Allow new users to sign up» debe
  quedar **activado**: las invitaciones crean la cuenta así. Una cuenta sin
  invitación no recibe ningún permiso.
- **Authentication → Emails → Templates → Confirm signup:** asunto
  «Confirma tu cuenta del panel · Papudo en tu Mano» y, como cuerpo, el
  contenido de `supabase/templates/confirmacion.html`. **Ojo:** las plantillas
  valen para todo el proyecto de Supabase. Mientras se comparta con otro
  proyecto, sus usuarios también recibirían este correo: aplícalo cuando Papudo
  tenga su propio proyecto.
- **Remitente:** el correo sale como «Supabase Auth» hasta configurar un correo
  propio (**Authentication → Emails → SMTP Settings**, con Resend u otro). Ahí se
  pone el remitente «Papudo en tu Mano» y la dirección del dominio.
- Marcar al superadmin (una sola vez, en **SQL Editor**, con tu correo):

```sql
update public.profiles set role = 'superadmin'
where user_id = (select id from auth.users where email = 'TU-CORREO');
```

Los roles antiguos de **Edición** y **Verificación** siguen funcionando para
quien ya los tenía, pero ya no se invitan.

## 5. Si algo no funciona

| Qué ves | Qué hacer |
| --- | --- |
| «Correo o contraseña incorrectos, o tu cuenta no tiene acceso al panel» | Revisa los datos. Si están bien: falta el rol (4.2) o la cuenta está con `active = false` (4.4). |
| «No se pudo guardar. Revisa tu rol o intenta de nuevo» | Tu rol no permite esa acción (sección 1), o reintenta en un momento. |
| «No se pudo leer la base de datos» | Espera un momento y recarga. Si sigue, avisa al equipo técnico. |
| Cambié algo y el sitio no lo muestra | Pueden pasar unos minutos. Revisa que la ficha esté **Publicada**. |
| La importación muestra cambios raros | No importes. Avisa al equipo técnico. |

## 6. Compartir una vista previa con tiempo limitado

Ver `docs/COMPARTIR-VISTA-PREVIA.md`: se crea un enlace que vence solo
(`…/api/enlace?horas=4`), protegido con la clave del entorno.

## 7. Pendiente de este manual

- Las rutas en **auto o a pie** las arma la app sola, sobre la marcha, para
  cada visitante: no requieren administración. Se documentará cualquier ajuste
  que haga falta cuando estén hechas.
- Capturas de pantalla de cada paso.
