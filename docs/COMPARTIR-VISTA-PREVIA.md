# Ambientes y enlaces para compartir

| Rama      | Dirección                      | Quién la ve                                   |
| --------- | ------------------------------ | --------------------------------------------- |
| `main`    | sitio público (producción)     | todo el mundo                                 |
| `develop` | `papudo-dev.vercel.app`        | el equipo, con un enlace largo (hasta 30 días) |
| `demo`    | `papudo-demo.vercel.app`       | quien reciba un enlace por horas              |

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
4. **Direcciones.** *Settings → Domains → Add*: `papudo-dev.vercel.app` →
   *Connect to an environment* / *Git branch*: `develop`; y
   `papudo-demo.vercel.app` → rama `demo`. Si un nombre está tomado, Vercel
   avisa; se elige otro y se actualiza esta tabla.

Las direcciones automáticas de Vercel (`<proyecto>-git-<rama>-<equipo>.vercel.app`)
siguen existiendo, pero llevan el nombre de la rama: para compartir se usan
solo las dos de la tabla.

## Crear un enlace

Abre en el navegador, sobre la dirección que quieras compartir:

```
https://papudo-demo.vercel.app/api/enlace?horas=4     ← para la gente
https://papudo-dev.vercel.app/api/enlace?dias=30      ← para el equipo
```

El navegador pide usuario y contraseña: el usuario puede ser cualquiera y la
contraseña es `SHARE_LINK_SECRET`. La página muestra el enlace y la hora en que
vence (hora de Chile). Va de 1 hora a 30 días; sin `horas` ni `dias`, son 4 horas.

Quien abre el enlace navega todo el sitio hasta esa hora (queda una cookie que
vence a la misma hora). Después, recargar muestra «Este enlace venció».

## Qué protege y qué no

- Sin enlace vigente no se ven las páginas. Un enlace no se puede alargar ni
  falsificar: lleva una firma HMAC-SHA256 hecha con la clave.
- Las imágenes y archivos sueltos (`/ilustraciones/...`, `robots.txt`) siguen
  accesibles si alguien conoce su dirección exacta.
- Mientras el enlace esté vigente, quien lo tenga puede reenviarlo, sacar
  capturas o guardar las páginas. Ningún sitio web puede impedirlo.
- Para cortar **todos** los enlaces antes de tiempo (los del equipo también),
  cambia `SHARE_LINK_SECRET` en Vercel y vuelve a desplegar `develop` y `demo`.

Código: `src/proxy.ts`, `src/lib/share-link.ts`, `src/app/api/enlace/route.ts`.
