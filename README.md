# Papudo en tu mano

Guía turística (PWA, mobile-first) y herramienta de gestión municipal para la
comuna de **Papudo**, Chile. Español primero, inglés opcional.

Next.js 16 · TypeScript · Tailwind 4 · next-intl · Supabase

- Plan de trabajo: [`docs/PLAN.md`](docs/PLAN.md)
- Financiamiento y herramientas: [`docs/FINANCIAMIENTO.md`](docs/FINANCIAMIENTO.md)

## Ver el sitio

```bash
pnpm install
cp .env.example .env.local
pnpm dev        # http://localhost:3000  → redirige a /es
```

Abre en el celular con la misma red (`http://<tu-ip>:3000`) o con las
herramientas de dispositivo del navegador.

> **Estado:** Fase 1. El contenido (lugares, eventos, rutas) está en
> `src/content`, todo pendiente de verificación; algunas fichas son ficticias y
> están marcadas como «Ejemplo». Con las variables de Supabase en `.env.local`
> el sitio lo lee de la base; sin ellas, del repo
> ([`docs/SETUP-SUPABASE.md`](docs/SETUP-SUPABASE.md)).

## Scripts

| Comando                        | Descripción                                         |
| ------------------------------ | --------------------------------------------------- |
| `pnpm dev` / `build` / `start` | Desarrollo / producción                             |
| `pnpm typecheck` / `lint`      | Tipos y ESLint                                      |
| `pnpm test`                    | Pruebas unitarias (Vitest)                          |
| `pnpm test:e2e`                | Pruebas end-to-end                                  |
| `pnpm test:db`                 | Migraciones y permisos (Postgres local)             |
| `pnpm db:content`              | Regenera `supabase/content.sql` desde `src/content` |
| `pnpm format`                  | Prettier                                            |

## Ramas

`main` (producción) ← `develop` (pruebas) ← `feat/*`. Los PR van a `develop`.
