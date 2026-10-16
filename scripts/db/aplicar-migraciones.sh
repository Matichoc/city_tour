#!/usr/bin/env bash
# Aplica las migraciones de Papudo en un proyecto de Supabase (también uno
# compartido con otro sitio). No usa `supabase db push` a propósito: ese
# comando registra las versiones por número (0001, 0002…) y, si el proyecto ya
# tiene migraciones de otro sitio con los mismos números, se saltaría las de
# Papudo. Aquí el registro vive en `papudo.schema_migrations`.
#
# Uso:  SUPABASE_DB_URL='postgresql://…' bash scripts/db/aplicar-migraciones.sh
# Es seguro repetirlo: solo aplica las migraciones que faltan.
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL (cadena de conexión de la base)}"
PSQL=(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -c "create schema if not exists papudo; create table if not exists papudo.schema_migrations (name text primary key, applied_at timestamptz not null default now());"

for f in supabase/migrations/*.sql; do
  name=$(basename "$f")
  done=$("${PSQL[@]}" -tA -c "select 1 from papudo.schema_migrations where name = '$name'")
  if [[ "$done" == "1" ]]; then
    echo "· $name (ya aplicada)"
    continue
  fi
  echo "→ $name"
  "${PSQL[@]}" --single-transaction -f "$f" -c "insert into papudo.schema_migrations (name) values ('$name');"
done

echo "→ catálogo (seed)"
"${PSQL[@]}" -f supabase/seed.sql
echo "✔ Migraciones de Papudo aplicadas en el esquema papudo"
