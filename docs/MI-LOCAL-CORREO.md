# «Mi local» con correo y código

Desde la migración `0036_owner_email.sql`, el locatario puede entrar a «Mi
local» con su **correo y un código de 6 dígitos**, sin contraseña y sin un
enlace que venza. El enlace personal del local (0031) sigue funcionando igual:
son dos formas de entrar a lo mismo.

## Cómo funciona

1. En el panel, en la ficha del comercio → **Acceso del locatario**, el
   municipio escribe el **correo del locatario** y lo guarda.
2. El locatario abre `/local/ingresar`, escribe ese correo y pide el código.
3. Supabase Auth le manda un correo con el código. Lo escribe y queda dentro.
4. La sesión dura 30 días en ese dispositivo (se renueva sola). Con un correo
   registrado en varios locales, elige cuál actualizar.
5. Lo que propone pasa igual que siempre por la revisión del municipio.

El correo del locatario es un dato personal: vive en `private.owner_contacts`
y solo el personal (admin o editor) lo ve o lo cambia.

## Antes de usarlo (una vez, en Supabase)

1. **Correr las migraciones** `0035_owner_hours.sql` y `0036_owner_email.sql`
   en el SQL Editor, en ese orden.
2. **Plantillas de correo** (Authentication → Email Templates): en
   **Magic Link** y en **Confirm signup**, poner el código en el texto, por
   ejemplo:

   ```html
   <h2>Tu código para entrar a «Mi local»</h2>
   <p>Escribe este código en Papudo en tu Mano:</p>
   <p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
   <p>Vence en unos minutos. Si no lo pediste, ignora este correo.</p>
   ```

   Sin `{{ .Token }}`, el correo llega con un enlace en vez del código.
3. **Correo propio (SMTP)**: el correo de prueba de Supabase manda muy pocos
   correos por hora. Para usarlo con los locales hay que configurar un SMTP
   (Authentication → Emails → SMTP Settings), por ejemplo Resend o el correo
   del dominio. Mientras no esté, sirve para probar con uno o dos correos.
4. Revisar que **«Allow new users to sign up»** esté activo (el código crea la
   cuenta del locatario la primera vez). Esas cuentas no tienen ningún rol:
   no pueden entrar al panel.

## Archivos

- Base: `supabase/migrations/0036_owner_email.sql` (y pruebas en
  `tests/db/owner.check.sql`).
- App: `src/lib/owner/email.ts` (código y sesión), `src/lib/owner/current.ts`
  (enlace o correo), `src/app/local/ingresar/` (pantallas),
  `src/app/local/renovar/route.ts` (renueva la sesión).
- Panel: `src/components/admin/owner-access.tsx` (campo del correo).
