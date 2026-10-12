@AGENTS.md

## Idioma

El usuario siempre se comunica en español y espera que **toda** respuesta de
Claude Code en este repo sea en español (chat, resúmenes, PR y commits).

## Proyecto

"Papudo en tu mano": guía turística y herramienta de gestión municipal para la
comuna de Papudo. Un repo = una comuna (otra comuna = otro repo). Plan en
`docs/PLAN.md`, financiamiento en `docs/FINANCIAMIENTO.md`.

## Ramas

`main` (producción) ← `develop` (pruebas/staging) ← ramas de trabajo
(`feat/...`, `claude/...`). Los PR van siempre a `develop`; `main` solo se toca
cuando el usuario lo decide.

## Reglas duras

- Antes de cada commit/push: skill `pre-push` (typecheck, lint, test, build, format).
- No inventar datos turísticos. Todo dato de demostración queda `pending` y
  la UI lo muestra así. Fuente y fecha de verificación para datos reales.
- Español primero: textos solo en `src/messages/{es,en}.json`, nunca fijos en componentes.
