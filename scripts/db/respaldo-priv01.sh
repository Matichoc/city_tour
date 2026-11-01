#!/usr/bin/env bash
# PRIV-01 · Paso previo a la limpieza: respaldo de SOLO LECTURA.
#
# Exporta a CSV lo que la limpieza va a tocar o depende de ello:
#   places_afectadas.csv       fichas con contacto dentro de import_snapshot
#   place_contacts.csv         contactos internos (la limpieza no los modifica)
#   place_import_private.csv   almacén privado (si la migración 0026 ya está)
# y escribe MANIFIESTO.txt con la cantidad de filas y el sha256 de cada archivo
# (solo números y hashes: sin datos personales).
#
# Los CSV TIENEN DATOS PERSONALES y el repositorio es público: el destino debe
# ser una carpeta privada y cifrada FUERA del repositorio (se rechaza lo contrario).
#
# Uso:
#   SUPABASE_DB_URL='postgres://…' scripts/db/respaldo-priv01.sh /ruta/privada/respaldo-AAAA-MM-DD
set -euo pipefail

DEST="${1:-}"
[[ -n "$DEST" ]] || { echo "Uso: $0 <carpeta-destino-fuera-del-repo>" >&2; exit 2; }
[[ -n "${SUPABASE_DB_URL:-}" ]] || { echo "Falta SUPABASE_DB_URL (cadena de conexión)." >&2; exit 2; }

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
DEST="$(realpath -m "$DEST")"
case "$DEST/" in
  "$REPO"/*) echo "Rechazado: $DEST está dentro del repositorio (público). Usa una carpeta privada fuera de él." >&2; exit 2 ;;
esac
mkdir -p "$DEST"
if [[ -n "$(ls -A "$DEST")" ]]; then
  echo "Rechazado: $DEST no está vacía (no se sobrescriben respaldos)." >&2; exit 2
fi

umask 077
# Solo lectura a nivel de sesión: aunque el script se equivocara, no puede escribir.
export PGOPTIONS="-c default_transaction_read_only=on"
psql_() { psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 "$@"; }

psql_ -At -c "select 'conexión OK · solo lectura: ' || current_setting('transaction_read_only')" >&2

# Filas reales de un CSV (un valor puede traer saltos de línea): sin encabezado.
filas_csv() {
  python3 -I - "$1" <<'PY'
import csv, sys
csv.field_size_limit(sys.maxsize)
print(sum(1 for _ in csv.reader(open(sys.argv[1], newline="", encoding="utf-8"))) - 1)
PY
}

copy() { # nombre, consulta
  psql_ -c "\\copy ($2) to '$DEST/$1' with (format csv, header true)"
}

copy places_afectadas.csv \
  "select id, slug, import_key, import_snapshot from public.places
   where import_snapshot ? 'contactName' or import_snapshot ? 'contactEmail' order by id"
copy place_contacts.csv "select * from public.place_contacts order by id"
if [[ "$(psql_ -At -c "select to_regclass('public.place_import_private') is not null")" == "t" ]]; then
  copy place_import_private.csv "select * from public.place_import_private order by place_id"
fi

{
  echo "Respaldo PRIV-01 · $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "archivo<TAB>filas<TAB>sha256"
  for f in "$DEST"/*.csv; do
    printf '%s\t%s\t%s\n' "$(basename "$f")" "$(filas_csv "$f")" "$(sha256sum "$f" | cut -d' ' -f1)"
  done
} > "$DEST/MANIFIESTO.txt"

echo "Respaldo escrito en: $DEST" >&2
cat "$DEST/MANIFIESTO.txt" >&2
"$(dirname "${BASH_SOURCE[0]}")/verificar-respaldo.sh" "$DEST"
