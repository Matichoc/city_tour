# Base de datos: puesta en marcha

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
# el seed del catálogo: pegar supabase/seed.sql en el SQL editor
```

Variables en Vercel (Settings → Environment Variables):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
**Nunca** pongas `SUPABASE_SERVICE_ROLE_KEY` en variables `NEXT_PUBLIC_*`.

Mientras no haya proyecto alojado, Vercel despliega sin problema la versión actual
(datos de demostración, sin base de datos).

## Probar las migraciones sin Supabase

`pnpm test:db` (requiere un Postgres local o `DATABASE_URL` de una base desechable).
