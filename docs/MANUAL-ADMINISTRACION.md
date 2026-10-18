# Manual del panel de administración

Para quien administra la guía «Papudo en tu Mano». Está escrito paso a paso y
solo describe lo que el panel hace hoy. Lo que aún no existe (por ejemplo,
las rutas por calles en auto o a pie) está en `docs/PLAN-RUTAS-AUTO-Y-A-PIE.md`.

## 1. Quién puede hacer qué

| Rol (como se ve en el panel) | Qué puede hacer |
| --- | --- |
| **Administración** | Todo: publicar y archivar, borrar comentarios, configurar la invitación a comercios y la planilla de importación. |
| **Edición** | Crear y editar fichas, eventos y comercios **como borrador** (no publica ni archiva), ocultar o mostrar comentarios, y manejar avisos destacados. |
| **Verificación** | Ver todo y cambiar el estado de verificación. No edita contenido. |
| **Negocio** | No entra al panel. |

Los visitantes no tienen cuenta.

## 2. Entrar y salir

1. Abre `/admin` en el sitio (si no has entrado, te lleva a **Ingresar al panel**).
2. Escribe tu **correo** y **contraseña** y pulsa **Ingresar**.
3. Para terminar, pulsa **Salir**.

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

## 4. Dar acceso a otra persona

El panel **no tiene** pantalla de usuarios: el acceso se da en Supabase. Lo
hace una persona con acceso al proyecto **city_tour** de Supabase.

### 4.1 Crear a la persona
1. Entra a Supabase → proyecto **city_tour** → **Authentication → Users**.
2. Pulsa **Add user → Create new user**. Escribe su **correo** y una
   **contraseña temporal** y activa la opción de confirmar el correo
   automáticamente (**Auto Confirm User**).
3. Copia el **User UID** de la persona recién creada.

### 4.2 Darle un rol
Sin rol, la persona puede crear su cuenta pero **no entra al panel**. En **SQL
Editor** pega esto, cambiando el UID, el rol y el nombre:

```sql
insert into public.profiles (user_id, role, full_name)
values ('PEGA-AQUÍ-EL-UID', 'editor', 'Nombre Apellido');
```

Roles válidos: `admin`, `editor`, `verifier`. Usa siempre el **más bajo que
alcance** para su trabajo.

### 4.3 Entregar el acceso
1. Envíale la dirección `…/admin`, su correo y la contraseña temporal **por un
   canal privado** (no por un chat de grupo ni un correo compartido).
2. Hoy el panel **no tiene** pantalla para cambiar la contraseña: si hay que
   restablecerla, se hace desde **Authentication → Users** en Supabase (los
   nombres exactos del menú pueden variar según la versión).
3. Pídele que entre y revise que ve lo que corresponde a su rol (sección 1).

### 4.4 Cambiar el rol o quitar el acceso
```sql
-- Cambiar de rol
update public.profiles set role = 'verifier' where user_id = 'UID';

-- Quitar el acceso sin borrar a la persona (se puede revertir con true)
update public.profiles set active = false where user_id = 'UID';
```
Para eliminarla del todo: **Authentication → Users →** su fila **→ Delete user**.

### 4.5 Ver quién tiene acceso hoy
```sql
select u.email, p.full_name, p.role, p.active
from public.profiles p join auth.users u on u.id = p.user_id
order by p.role, u.email;
```

### 4.6 Buenas prácticas
- Que haya **al menos dos administradores**.
- **Una cuenta por persona**, sin compartir contraseñas.
- Quitar el acceso el mismo día que alguien deja el equipo.
- En Supabase, **Authentication → Sign In / Providers**, mantener **desactivado**
  «Allow new users to sign up»: nadie debería crear cuentas por su cuenta.
- El panel pide solo correo y contraseña; no hay segundo factor. Usa
  contraseñas largas y únicas.
- Nunca pegues claves ni cadenas de conexión en un chat.

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
