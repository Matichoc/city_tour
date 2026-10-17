#!/usr/bin/env bash
# Prueba las migraciones y las políticas RLS contra un Postgres desechable.
# Uso:  pnpm test:db
#   - Sin DATABASE_URL: usa el Postgres local (variables PG* por defecto) y crea la base `city_tour_test`.
#   - Con DATABASE_URL: usa esa base (debe ser DESECHABLE: se borra su esquema public).
set -euo pipefail
cd "$(dirname "$0")/../.."

if [[ -n "${DATABASE_URL:-}" ]]; then
  PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q)
else
  createdb city_tour_test 2>/dev/null || true
  PSQL=(psql -d city_tour_test -v ON_ERROR_STOP=1 -q)
fi

"${PSQL[@]}" -c "drop schema if exists public cascade; drop schema if exists auth cascade; drop schema if exists storage cascade; drop schema if exists extensions cascade; drop schema if exists tests cascade; create schema public;"
"${PSQL[@]}" -f tests/db/supabase_shim.sql
for f in supabase/migrations/*.sql; do
  echo "→ $f"
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f supabase/seed.sql
echo "→ seed idempotente"
"${PSQL[@]}" -f supabase/seed.sql
"${PSQL[@]}" -f tests/db/helpers.sql
for f in tests/db/*.test.sql; do [[ -e "$f" ]] || continue
  echo "→ $f"
  "${PSQL[@]}" -o /dev/null -f "$f"
done
echo "→ contenido del sitio (dos veces: debe ser idempotente)"
"${PSQL[@]}" -f supabase/content.sql
"${PSQL[@]}" -f supabase/content.sql
"${PSQL[@]}" -o /dev/null -f tests/db/content.check.sql
"${PSQL[@]}" -o /dev/null -f tests/db/reviews.check.sql
"${PSQL[@]}" -o /dev/null -f tests/db/business.check.sql
echo "✔ Base de datos: migraciones y pruebas OK"
