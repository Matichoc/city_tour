# Ambientes y enlaces para compartir

Mientras no haya financiamiento, **`develop` es la rama de producción en
Vercel** y está cerrada: solo la ve el equipo. `main` queda en espera y pasará
a ser el sitio público cuando se decida abrirlo.

| Rama      | Dirección                                            | Quién la ve                         |
| --------- | ---------------------------------------------------- | ----------------------------------- |
| `develop` | `papudo-dev.vercel.app` (y el dominio de producción) | el equipo, con su enlace permanente |
| `demo`    | `papudo-demo.vercel.app`                             | quien reciba un enlace por horas    |
| `main`    | — (en espera)                                        | nadie por ahora                     |

Sin un **enlace vigente** se ve «Este enlace venció». `demo` se actualiza solo
cuando se decide mostrar algo nuevo (se lleva `develop` a `demo`), así lo que
se comparte no cambia a mitad de una presentación.

## Configuración en Vercel (una vez)

1. **Rama de producción = `develop`** (*Settings → Environments → Production →
   Branch Tracking*). Se cambia a `main` el día que se abra el sitio.
2. **Clave del equipo.** *Settings → Environment Variables*:
   `SHARE_LINK_SECRET`, tipo **Secret**, solo en **Production** (`develop`).
3. **Clave del demo.** Otra `SHARE_LINK_SECRET` con **otro valor**, solo en
   **Preview** (`demo` y demás vistas previas). Vercel no admite dos variables
   con el mismo nombre en el mismo entorno; separarlas por entorno permite
   cortar el `demo` sin tocar al equipo.
4. **Supabase.** Para que `develop` lea la base de datos, las variables
   `NEXT_PUBLIC_SUPABASE_*` deben estar en **All Environments** (Production
   incluido).
5. **Sin inicio de sesión de Vercel.** *Settings → Deployment Protection*:
   *Require Log In* desactivado; las claves pasan a ser la puerta.
6. **Direcciones.** *Settings → Domains → Add*: `papudo-dev.vercel.app` →
   **Production**; `papudo-demo.vercel.app` → *Git branch* `demo`.

Las direcciones automáticas de Vercel (`<proyecto>-git-<rama>-<equipo>.vercel.app`)
siguen existiendo, pero llevan el nombre de la rama: para compartir se usan
solo las de la tabla.

## Abrir el sitio al público (cuando haya financiamiento)

Llevar `develop` a `main`, cambiar *Branch Tracking* a `main`, quitar la
`SHARE_LINK_SECRET` de **Production** (el sitio queda abierto) y volver a
desplegar. `develop` pasa a ser una vista previa y queda cerrada con la clave
de **Preview**.

## Crear un enlace

Abre en el navegador, sobre la dirección que quieras compartir:

```
https://papudo-demo.vercel.app/api/enlace?horas=4       ← para la gente (vence solo)
https://papudo-dev.vercel.app/api/enlace?para=equipo    ← para el equipo (no vence)
```

El navegador pide usuario y contraseña: el usuario puede ser cualquiera y la
contraseña es la `SHARE_LINK_SECRET` de esa dirección: la de **Preview** para
`papudo-demo` y la de **Production** para `papudo-dev`. La página muestra el enlace y, si es por
horas, cuándo vence (hora de Chile). Va de 1 hora a 30 días (`horas` o `dias`);
sin nada, son 4 horas.

El enlace del equipo se crea una vez y se guarda: no vence. Abrirlo deja la
sesión abierta 400 días en ese navegador; volver a abrirlo la renueva.

Quien abre el enlace navega todo el sitio hasta esa hora (queda una cookie que
vence a la misma hora). Después, recargar muestra «Este enlace venció».

## Abrir y cerrar el `demo`

- **Abrir:** crea un enlace con las horas que quieras (`?horas=2`, `?horas=8`,
  `?dias=3`). Cada enlace vence solo; puedes crear varios con distinta
  duración.
- **Cerrar antes de tiempo:** cambia la `SHARE_LINK_SECRET` de **Preview** en
  Vercel y vuelve a desplegar `demo`. Todos los enlaces del `demo` dejan de
  funcionar al instante; el del equipo sigue igual.
- **Dejarlo cerrado:** basta con no crear enlaces. Sin un enlace vigente,
  `papudo-demo.vercel.app` solo muestra «Este enlace venció».

## Qué protege y qué no

- Sin enlace vigente no se ven las páginas. Un enlace no se puede alargar ni
  falsificar: lleva una firma HMAC-SHA256 hecha con la clave.
- Las imágenes y archivos sueltos (`/ilustraciones/...`, `robots.txt`) siguen
  accesibles si alguien conoce su dirección exacta.
- Mientras el enlace esté vigente, quien lo tenga puede reenviarlo, sacar
  capturas o guardar las páginas. Ningún sitio web puede impedirlo.
- El enlace del equipo no vence: si se filtra, cambia la `SHARE_LINK_SECRET`
  de **Production**, vuelve a desplegar `develop` y crea uno nuevo.

Código: `src/proxy.ts`, `src/lib/share-link.ts`, `src/app/api/enlace/route.ts`.
