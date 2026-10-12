---
name: pre-push
description: Corre el gate de validación completo (typecheck, lint, tests, build, format) antes de comitear o empujar cambios en este repo. Úsalo siempre antes de cualquier `git push`, y después de resolver un fallo de CI antes de volver a empujar.
---

# Gate de validación antes de push

Este proyecto exige estos 5 chequeos en verde antes de cualquier commit/push
(ver CLAUDE.md/AGENTS.md — es una regla dura de la sesión, no una sugerencia):

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build`
5. `pnpm format:check`

## Cómo correrlo

Ejecútalos en orden, uno a la vez (no en paralelo — `build` y `test` compiten
por CPU/memoria en el sandbox y los resultados se vuelven difíciles de leer
entrelazados). Si uno falla, detente ahí: diagnostica y arregla antes de
seguir con el siguiente. No tiene sentido correr `build` si `typecheck` ya
está en rojo.

- **`format:check` falla** → corre `pnpm format` (auto-fix con Prettier) y
  vuelve a correr `format:check` para confirmar. Nunca edites a mano solo
  para el formato — Prettier ya sabe la regla exacta de este repo.
- **`typecheck` o `lint` fallan** → son errores reales de código: arréglalos
  en el archivo que señala el error. No los silencies con `@ts-ignore` o un
  `eslint-disable` a menos que ese patrón ya exista en el archivo por una
  razón documentada.
- **`test` falla** → nunca borres ni saltees el test que falla para que
  pase. O el código quedó mal, o el test necesita actualizarse porque el
  comportamiento cambió a propósito — en ese segundo caso, dilo
  explícitamente al reportar, no lo dejes implícito.
- **`build` falla pero `typecheck` pasó** → suele ser algo que el
  build de producción atrapa y el chequeo de tipos no: límite
  Server/Client Component, o una imagen nueva bajo `public/` sin su
  prefijo en `images.localPatterns` (`next.config.ts` — bug real que ya
  pasó dos veces en este proyecto, ver `docs/DESIGN.md`).

## Cuándo usarlo

- Siempre antes de un `git commit` que vaya a un push a la rama de la
  sesión actual.
- Después de resolver un fallo de CI en la PR abierta, antes de volver a
  empujar el fix.

## Cómo reportar el resultado

Un resumen de una línea por chequeo (✅/❌), no el output completo de cada
comando — pega el error puntual solo cuando algo falló y hace falta
mostrarlo para explicar el fix.
