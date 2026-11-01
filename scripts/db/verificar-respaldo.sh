#!/usr/bin/env bash
# PRIV-01 · Verifica un respaldo: que cada archivo del MANIFIESTO exista y que
# su sha256 y su cantidad de filas coincidan. No se conecta a ninguna base.
# Uso: scripts/db/verificar-respaldo.sh /ruta/privada/respaldo-AAAA-MM-DD
set -euo pipefail
DIR="${1:?Uso: $0 <carpeta-del-respaldo>}"
[[ -f "$DIR/MANIFIESTO.txt" ]] || { echo "No hay MANIFIESTO.txt en $DIR" >&2; exit 1; }
python3 -I - "$DIR" <<'PY'
import csv, hashlib, os, sys
csv.field_size_limit(sys.maxsize)
d = sys.argv[1]
bad = 0
n = 0
for line in open(os.path.join(d, "MANIFIESTO.txt"), encoding="utf-8").read().splitlines()[2:]:
    if not line.strip():
        continue
    name, rows, sha = line.split("\t")
    path = os.path.join(d, name)
    n += 1
    if not os.path.isfile(path):
        print(f"FALTA   {name}"); bad += 1; continue
    got_sha = hashlib.sha256(open(path, "rb").read()).hexdigest()
    got_rows = sum(1 for _ in csv.reader(open(path, newline="", encoding="utf-8"))) - 1
    if got_sha != sha or got_rows != int(rows):
        print(f"DIFIERE {name}: filas {got_rows}/{rows}, sha {'igual' if got_sha == sha else 'distinto'}"); bad += 1
    else:
        print(f"OK      {name}: {got_rows} filas")
if n == 0:
    print("El manifiesto no lista archivos."); bad += 1
sys.exit(1 if bad else 0)
PY
