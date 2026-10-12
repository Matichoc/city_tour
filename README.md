# Papudo en tu mano

Guía turística (PWA, mobile-first) y herramienta de gestión municipal para la
comuna de **Papudo**, Chile. Español primero, inglés opcional.

Next.js 16 · TypeScript · Tailwind 4 · next-intl · (Supabase desde la Fase 1)

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

> **Estado:** Fase 0. Los lugares son datos de **demostración**
> (`src/lib/demo-data.ts`), todos pendientes de verificación; algunos son
> fichas ficticias marcadas como tales. La base de datos llega en la Fase 1.

## Scripts

| Comando                        | Descripción                |
| ------------------------------ | -------------------------- |
| `pnpm dev` / `build` / `start` | Desarrollo / producción    |
| `pnpm typecheck` / `lint`      | Tipos y ESLint             |
| `pnpm test`                    | Pruebas unitarias (Vitest) |
| `pnpm test:e2e`                | Pruebas end-to-end         |
| `pnpm format`                  | Prettier                   |

## Ramas

`main` (producción) ← `develop` (pruebas) ← `feat/*`. Los PR van a `develop`.
