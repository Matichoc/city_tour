# Compartir una vista previa por tiempo limitado

Las vistas previas de Vercel (rama `develop` y ramas de trabajo) se pueden
cerrar al público y abrir solo con **enlaces que vencen solos** (por defecto,
4 horas). Producción no se ve afectada.

## Activarlo (una vez)

1. **Clave.** Inventa una clave larga (por ejemplo, 5 palabras al azar). En
   Vercel → *Settings → Environment Variables* → *Add*: `SHARE_LINK_SECRET`,
   tipo **Secret**, solo en **Preview**. Vuelve a desplegar `develop`.
2. **Protección de Vercel.** En *Settings → Deployment Protection*, desactiva
   *Vercel Authentication* para las vistas previas; si no, quien abra el
   enlace verá primero la pantalla de inicio de sesión de Vercel. La clave del
   paso 1 pasa a ser la puerta.

Desde ese momento, quien entre a una vista previa sin enlace vigente ve
«Este enlace venció».

## Crear un enlace

Abre en el navegador (cambia la dirección por la de tu vista previa):

```
https://citytour-git-develop-matichoc.vercel.app/api/enlace?horas=4
```

El navegador pide usuario y contraseña: el usuario puede ser cualquiera y la
contraseña es la clave del paso 1. La página muestra el enlace y la hora en que
vence (hora de Chile). `horas` va de 1 a 72; sin `horas`, son 4.

Quien abre el enlace puede navegar todo el sitio hasta esa hora (queda una
cookie que vence a la misma hora). Después, recargar muestra «Este enlace venció».

## Qué protege y qué no

- Sin enlace vigente no se ven las páginas. Un enlace no se puede alargar ni
  falsificar: lleva una firma HMAC-SHA256 hecha con la clave.
- Las imágenes y archivos sueltos (`/ilustraciones/...`, `robots.txt`) siguen
  accesibles si alguien conoce su dirección exacta.
- Mientras el enlace esté vigente, quien lo tenga puede reenviarlo, sacar
  capturas o guardar las páginas. Ningún sitio web puede impedirlo.
- Para cortar **todos** los enlaces antes de tiempo, cambia `SHARE_LINK_SECRET`
  en Vercel y vuelve a desplegar.

Código: `src/proxy.ts`, `src/lib/share-link.ts`, `src/app/api/enlace/route.ts`.
