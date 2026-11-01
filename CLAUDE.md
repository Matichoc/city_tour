@AGENTS.md

## Idioma

El usuario siempre se comunica en español y espera que **toda** respuesta de
Claude Code en este repo sea en español (chat, resúmenes, PR y commits).

## Proyecto

"Papudo en tu mano": guía turística y herramienta de gestión municipal para la
comuna de Papudo. Un repo = una comuna (otra comuna = otro repo). Plan en
`docs/PLAN.md`, financiamiento en `docs/FINANCIAMIENTO.md`.

## Ramas

`main` ← `develop` ← ramas de trabajo (`feat/...`, `claude/...`). Los PR van
siempre a `develop`; `main` solo se toca cuando el usuario lo decide. Hasta que
haya financiamiento, `develop` es la rama de producción en Vercel (cerrada,
solo equipo) y `main` está en espera. `demo` es una copia de `develop` para
compartir por horas; se actualiza solo cuando el usuario lo pide. Ver
`docs/COMPARTIR-VISTA-PREVIA.md`.

## Reglas duras

- Antes de cada commit/push: skill `pre-push` (typecheck, lint, test, build, format).
- No inventar datos turísticos. Todo dato de demostración queda `pending` y
  la UI lo muestra así. Fuente y fecha de verificación para datos reales.
- Bitácora: al cerrar cada entrega, agregar su nota en
  `docs/bitacora-notas.json`, correr `pnpm bitacora` y subir `docs/BITACORA.md`
  en el mismo PR (versiones, días y horas de avance).
- Español primero: textos solo en `src/messages/{es,en}.json`, nunca fijos en componentes.
