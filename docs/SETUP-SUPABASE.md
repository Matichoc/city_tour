# Base de datos: puesta en marcha

**Cómo usa la base el sitio.** Con `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY` definidas, el sitio lee lugares, eventos,
rutas y localidades de Supabase (solo lo publicado) y refresca cada 5 minutos.
Sin esas variables, o si la base falla o no tiene lugares publicados, usa el
contenido del repo (`src/content`). Así producción sigue funcionando igual
mientras no tenga base propia. Código: `src/lib/db/content-source.ts`.

Hay dos caminos. El **local** no cuesta nada y sirve para desarrollar.
El **alojado** hace falta para que el sitio desplegado en Vercel lea datos reales.

## A. Local (desarrollo) — requiere Docker

```bash
# 1) CLI de Supabase (una vez)
npm i -g supabase            # o: brew install supabase/tap/supabase

# 2) En la raíz del repo (una vez). Responde "n" a las preguntas de VS Code/IntelliJ.
supabase init                 # crea supabase/config.toml; NO toca las migraciones

# 3) Levantar Postgres + Auth + Storage + Studio en tu máquina
supabase start                # aplica supabase/migrations/* y supabase/seed.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/content.sql
                              # carga el contenido del sitio (DB URL de `supabase status`)

# 4) Ver URL y claves LOCALES
supabase status               # copia API URL y anon key a .env.local
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key de supabase status>
```

Reiniciar la base desde cero: `supabase db reset`. Studio: http://127.0.0.1:54323

Crear tu primer administrador (local):
1. En Studio → Authentication → Add user (correo + contraseña).
2. En Studio → SQL editor:
   ```sql
   insert into public.profiles (user_id, role, full_name)
   values ('<uuid del usuario>', 'admin', 'Tu nombre');
   ```

## B. Alojado (para Vercel)

Vercel no puede conectarse a una base que corre en tu computador. Para un sitio
desplegado con datos reales se necesita un proyecto Supabase en la nube:

```bash
supabase login
supabase link --project-ref <ref>
supabase db push              # aplica las migraciones
```

Sin CLI, todo se hace en el **SQL Editor** de Supabase, pegando los archivos en
este orden (cada paso en una ejecución aparte):

1. Las migraciones que falten de `supabase/migrations/`, en orden.
2. `supabase/seed.sql` (catálogo y municipio).
3. `supabase/content.sql` (lugares, eventos, rutas y localidades del sitio).

`seed.sql` y `content.sql` se pueden volver a ejecutar sin duplicar nada.
`0016` agrega el idioma `pt`, que Postgres no deja usar en la misma
transacción en que se crea: por eso va en una ejecución aparte de los pasos 2 y 3.

**`NEXT_PUBLIC_SUPABASE_URL` es la URL del proyecto, sin `/rest/v1/`:**
`https://<ref>.supabase.co`. La página *Integrations → Data API* de Supabase
muestra la dirección con `/rest/v1/` al final; ese final se quita. (El código
lo tolera, pero otras herramientas no.) Se encuentra en
*Project Settings → Data API* y la clave en *Project Settings → API Keys*
(`anon public` o `sb_publishable_…`).

Variables en Vercel (Settings → Environment Variables), tipo **Config** (no son
secretas: igual llegan al navegador):

| Variable | Production | Preview / Development |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | proyecto de producción (cuando exista) | proyecto de desarrollo |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ídem | ídem |
| `NEXT_PUBLIC_SITE_URL` | dominio público | opcional |

**Nunca** pongas `SUPABASE_SERVICE_ROLE_KEY` ni una clave `sb_secret_…` en
Vercel ni en variables `NEXT_PUBLIC_*`.

Mientras producción no tenga sus variables, Vercel despliega sin problema la
versión actual con el contenido del repo.

## C. Proyecto de desarrollo actual (`city_tour`)

Ese proyecto traía el esquema de una app anterior, con tablas de igual nombre
que las nuevas (`places`, `routes`, `tags`...). El 2026-10-16 se archivó
completo en el esquema `legacy` con
`supabase/manual/archivar-esquema-anterior.sql` (no borra nada; la lista de lo
movido está en `legacy._archivo`) y luego se aplicaron 0001–0015 y el seed.
Lo archivado ya no se expone por la API; se consulta desde el SQL Editor.

## Cambiar el contenido

Hasta que exista el panel municipal (Fase 2), el contenido se edita en
`src/content` y se lleva a la base así:

```bash
pnpm db:content     # regenera supabase/content.sql desde src/content
```

y se ejecuta `supabase/content.sql` en el SQL Editor. `pnpm test` falla si
`content.sql` quedó desactualizado.

## Probar las migraciones sin Supabase

`pnpm test:db` (requiere un Postgres local o `DATABASE_URL` de una base desechable).
Aplica las migraciones, el seed y `content.sql` (dos veces cada uno) y corre las
pruebas de permisos y de contenido.
