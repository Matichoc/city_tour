#!/usr/bin/env bash
# PRIV-01 · Recuperación: devuelve import_snapshot a su valor EXACTO anterior a
# la limpieza, a partir del respaldo (places_afectadas.csv), y repone los
# contactos internos que falten. Solo restaura lo respaldado; no borra nada.
#
# Por defecto es un ENSAYO: hace todo dentro de una transacción, muestra los
# conteos y la deshace (ROLLBACK). Con --aplicar confirma los cambios.
#
# Uso:
#   SUPABASE_DB_URL='postgres://…' scripts/db/restaurar-priv01.sh /ruta/respaldo [--aplicar]
set -euo pipefail

DIR="${1:-}"; MODO="${2:-}"
[[ -n "$DIR" && -d "$DIR" ]] || { echo "Uso: $0 <carpeta-del-respaldo> [--aplicar]" >&2; exit 2; }
[[ -n "${SUPABASE_DB_URL:-}" ]] || { echo "Falta SUPABASE_DB_URL." >&2; exit 2; }
[[ -z "$MODO" || "$MODO" == "--aplicar" ]] || { echo "Opción desconocida: $MODO" >&2; exit 2; }
DIR="$(cd "$DIR" && pwd -P)"

"$(dirname "${BASH_SOURCE[0]}")/verificar-respaldo.sh" "$DIR"
FIN="rollback"; [[ "$MODO" == "--aplicar" ]] && FIN="commit"

psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 <<SQL
begin;
set local lock_timeout = '10s';

create temp table b_places (id uuid, slug text, import_key text, import_snapshot jsonb) on commit drop;
\\copy b_places from '$DIR/places_afectadas.csv' with (format csv, header true)

create temp table b_contacts on commit drop as select * from public.place_contacts with no data;
\\copy b_contacts from '$DIR/place_contacts.csv' with (format csv, header true)

alter table public.places disable trigger user;
update public.places p set import_snapshot = b.import_snapshot
  from b_places b where b.id = p.id;
alter table public.places enable trigger user;

insert into public.place_contacts select * from b_contacts
  on conflict do nothing;

do \$\$
declare v_mal integer;
begin
  select count(*) into v_mal from b_places b
   where not exists (select 1 from public.places p
                     where p.id = b.id and p.import_snapshot is not distinct from b.import_snapshot);
  if v_mal > 0 then raise exception 'No coinciden % fichas tras restaurar.', v_mal; end if;
  raise notice 'Fichas restauradas y verificadas: %', (select count(*) from b_places);
  raise notice 'Contactos internos respaldados: % · ahora en la base: %',
    (select count(*) from b_contacts), (select count(*) from public.place_contacts);
end;
\$\$;
$FIN;
SQL
[[ "$FIN" == "rollback" ]] && echo "ENSAYO: no se cambió nada. Repite con --aplicar para confirmar." >&2 || echo "Restauración aplicada." >&2
