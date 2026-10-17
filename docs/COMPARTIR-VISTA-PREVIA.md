# Ambientes y enlaces para compartir

| Rama      | Dirección (con dominio propio)   | Quién la ve                                  |
| --------- | -------------------------------- | -------------------------------------------- |
| `main`    | `<dominio>` (producción)         | todo el mundo                                |
| `develop` | `equipo.<dominio>`               | el equipo, con su enlace permanente          |
| `demo`    | `demo.<dominio>`                 | quien reciba un enlace por horas             |

Sin dominio propio sirven `papudo-dev.vercel.app` y `papudo-demo.vercel.app`,
pero llevan el nombre del servicio. Un dominio `.cl` se compra en NIC Chile
(nic.cl) y se conecta en Vercel; los subdominios no cuestan extra.

`develop` y `demo` son vistas previas de Vercel cerradas con `SHARE_LINK_SECRET`:
sin un **enlace vigente** se ve «Este enlace venció». `demo` se actualiza solo
cuando se decide mostrar algo nuevo (se lleva `develop` a `demo`), así lo que
se comparte no cambia a mitad de una presentación.

## Configuración en Vercel (una vez)

1. **Rama de producción = `main`.** *Settings → Environments → Production →
   Branch Tracking*: `main`.
2. **Clave.** *Settings → Environment Variables*: `SHARE_LINK_SECRET`, tipo
   **Secret**, solo en **Preview**. (Las variables de Supabase van en
   *All Pre-Production Environments*.)
3. **Sin inicio de sesión de Vercel.** *Settings → Deployment Protection*:
   *Require Log In* desactivado; la clave del paso 2 pasa a ser la puerta.
4. **Direcciones.** *Settings → Domains → Add*: el dominio propio →
   *Production*; `equipo.<dominio>` → *Git branch* `develop`; `demo.<dominio>`
   → *Git branch* `demo`. Vercel indica qué registros DNS poner en NIC Chile.

Las direcciones automáticas de Vercel (`<proyecto>-git-<rama>-<equipo>.vercel.app`)
siguen existiendo, pero llevan el nombre de la rama: para compartir se usan
solo las dos de la tabla.

## Crear un enlace

Abre en el navegador, sobre la dirección que quieras compartir:

```
https://demo.<dominio>/api/enlace?horas=4        ← para la gente (vence solo)
https://equipo.<dominio>/api/enlace?para=equipo  ← para el equipo (no vence)
```

El navegador pide usuario y contraseña: el usuario puede ser cualquiera y la
contraseña es `SHARE_LINK_SECRET`. La página muestra el enlace y, si es por
horas, cuándo vence (hora de Chile). Va de 1 hora a 30 días (`horas` o `dias`);
sin nada, son 4 horas.

El enlace del equipo se crea una vez y se guarda: no vence. Abrirlo deja la
sesión abierta 400 días en ese navegador; volver a abrirlo la renueva.

Quien abre el enlace navega todo el sitio hasta esa hora (queda una cookie que
vence a la misma hora). Después, recargar muestra «Este enlace venció».

## Qué protege y qué no

- Sin enlace vigente no se ven las páginas. Un enlace no se puede alargar ni
  falsificar: lleva una firma HMAC-SHA256 hecha con la clave.
- Las imágenes y archivos sueltos (`/ilustraciones/...`, `robots.txt`) siguen
  accesibles si alguien conoce su dirección exacta.
- Mientras el enlace esté vigente, quien lo tenga puede reenviarlo, sacar
  capturas o guardar las páginas. Ningún sitio web puede impedirlo.
- El enlace del equipo no vence: si se filtra, cambia `SHARE_LINK_SECRET` en
  Vercel, vuelve a desplegar `develop` y `demo` y crea uno nuevo. Eso corta
  todos los enlaces, también los por horas.

Código: `src/proxy.ts`, `src/lib/share-link.ts`, `src/app/api/enlace/route.ts`.
