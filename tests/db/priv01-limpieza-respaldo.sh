#!/usr/bin/env bash
# PRIV-01: prueba de punta a punta, sobre la base DESECHABLE de pruebas, del
# respaldo → limpieza → restauración. Nunca usa SUPABASE_DB_URL del entorno.
# Uso (lo llama tests/db/run.sh):  bash tests/db/priv01-limpieza-respaldo.sh <url-de-la-base-de-pruebas>
set -euo pipefail
cd "$(dirname "$0")/../.."
URL="${1:?falta la URL de la base de pruebas}"
export SUPABASE_DB_URL="$URL"          # pisa cualquier valor real del entorno
Q() { psql "$URL" -X -At -v ON_ERROR_STOP=1 -c "$1"; }
ok() { echo "ok  $1"; }
fail() { echo "FALLA [$1]" >&2; exit 1; }
eq() { [[ "$2" == "$3" ]] && ok "$1" || { echo "FALLA [$1]: esperado '$3', obtenido '$2'" >&2; exit 1; }; }

WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
BK="$WORK/respaldo"

# ── Datos de prueba: dos fichas con contacto en el snapshot (formato antiguo),
#    una sin contacto, y un contacto interno.
psql "$URL" -X -q -v ON_ERROR_STOP=1 <<'SQL'
insert into public.places (slug, category_id, is_business, managed_in_panel, import_key, import_snapshot)
select s.slug, c.id, true, true, s.slug, s.snap::jsonb
from public.categories c,
  (values
    ('prv-uno',  '{"name":"Uno","hoursText":"10 a 20","contactName":"Ana","contactEmail":"ana@prueba.test"}'),
    ('prv-dos',  '{"name":"Dos","contactName":null,"contactEmail":null}'),
    ('prv-tres', '{"name":"Tres","hoursText":"9 a 18"}')
  ) as s(slug, snap)
where c.slug = 'alojamiento';
insert into public.place_contacts (place_id, name, email)
  select id, 'Ana', 'ana@prueba.test' from public.places where slug = 'prv-uno';
SQL
HASH_ANTES="$(Q "select md5(string_agg(id::text || import_snapshot::text, ',' order by id)) from public.places where slug like 'prv-%'")"
AUDIT_ANTES="$(Q "select count(*) from public.audit_log")"

# ── 1) Respaldo
bash scripts/db/respaldo-priv01.sh "$BK" >/dev/null 2>&1 || fail "el respaldo falló"
eq "el respaldo incluye solo las fichas con contacto (2)" \
  "$(awk -F'\t' '$1=="places_afectadas.csv"{print $2}' "$BK/MANIFIESTO.txt")" 2
eq "el respaldo incluye los contactos internos" \
  "$(awk -F'\t' '$1=="place_contacts.csv"{print $2}' "$BK/MANIFIESTO.txt")" "$(Q 'select count(*) from public.place_contacts')"
bash scripts/db/verificar-respaldo.sh "$BK" >/dev/null && ok "el respaldo se verifica" || fail "verificación"
[[ "$(stat -c %a "$BK/places_afectadas.csv")" == "600" ]] && ok "los CSV quedan solo para su dueño (600)" || fail "permisos"

# Rechazos de seguridad
if SUPABASE_DB_URL="$URL" bash scripts/db/respaldo-priv01.sh "$PWD/respaldos-prueba" >/dev/null 2>&1; then
  rm -rf "$PWD/respaldos-prueba"; fail "debía rechazar una carpeta dentro del repo"
else ok "rechaza guardar el respaldo dentro del repositorio"; fi
[[ ! -e "$PWD/respaldos-prueba" ]] || { rm -rf "$PWD/respaldos-prueba"; fail "creó una carpeta dentro del repo"; }
if bash scripts/db/respaldo-priv01.sh "$BK" >/dev/null 2>&1; then fail "debía rechazar una carpeta con contenido"
else ok "no sobrescribe un respaldo existente"; fi
cp "$BK/places_afectadas.csv" "$WORK/copia.csv"
echo "x" >> "$BK/places_afectadas.csv"
if bash scripts/db/verificar-respaldo.sh "$BK" >/dev/null 2>&1; then fail "debía detectar un archivo alterado"
else ok "detecta un respaldo alterado"; fi
cp "$WORK/copia.csv" "$BK/places_afectadas.csv"
bash scripts/db/verificar-respaldo.sh "$BK" >/dev/null && ok "el respaldo vuelve a verificarse" || fail "verificación"

# ── 2) Limpieza
psql "$URL" -X -q -v ON_ERROR_STOP=1 -f supabase/manual/limpiar-contacto-snapshot.sql >/dev/null 2>&1 || fail "la limpieza falló"
eq "no queda contacto en ningún import_snapshot" \
  "$(Q "select count(*) from public.places where import_snapshot ? 'contactName' or import_snapshot ? 'contactEmail'")" 0
eq "el contacto quedó en el almacén privado" \
  "$(Q "select contact ->> 'contactEmail' from public.place_import_private p join public.places s on s.id = p.place_id where s.slug = 'prv-uno'")" "ana@prueba.test"
eq "lo demás del snapshot se conserva" \
  "$(Q "select import_snapshot ->> 'hoursText' from public.places where slug = 'prv-uno'")" "10 a 20"
eq "la ficha sin contacto no se tocó" \
  "$(Q "select import_snapshot::text from public.places where slug = 'prv-tres'")" '{"name": "Tres", "hoursText": "9 a 18"}'
eq "la limpieza no escribió en la bitácora (audit_log)" "$(Q 'select count(*) from public.audit_log')" "$AUDIT_ANTES"
eq "los triggers de places quedaron activos" \
  "$(Q "select count(*) from pg_trigger where tgrelid = 'public.places'::regclass and not tgisinternal and tgenabled = 'D'")" 0
eq "los contactos internos no cambiaron" "$(Q 'select count(*) from public.place_contacts')" "$(awk -F'\t' '$1=="place_contacts.csv"{print $2}' "$BK/MANIFIESTO.txt")"
psql "$URL" -X -q -v ON_ERROR_STOP=1 -f supabase/manual/limpiar-contacto-snapshot.sql >/dev/null 2>&1 && ok "la limpieza es idempotente" || fail "segunda ejecución"

# ── 3) Recuperación
bash scripts/db/restaurar-priv01.sh "$BK" >/dev/null 2>&1 || fail "el ensayo de restauración falló"
eq "el ensayo no cambia nada" \
  "$(Q "select count(*) from public.places where import_snapshot ? 'contactEmail'")" 0
bash scripts/db/restaurar-priv01.sh "$BK" --aplicar >/dev/null 2>&1 || fail "la restauración falló"
eq "la restauración devuelve los snapshots exactos" \
  "$(Q "select md5(string_agg(id::text || import_snapshot::text, ',' order by id)) from public.places where slug like 'prv-%'")" "$HASH_ANTES"

# Si ya hay una fila privada más reciente, la limpieza la conserva.
Q "update public.place_import_private set contact = '{\"contactEmail\":\"nuevo@prueba.test\"}' where place_id = (select id from public.places where slug='prv-uno')" >/dev/null
psql "$URL" -X -q -v ON_ERROR_STOP=1 -f supabase/manual/limpiar-contacto-snapshot.sql >/dev/null 2>&1 || fail "limpieza con fila privada previa"
eq "la limpieza no pisa un contacto privado más reciente" \
  "$(Q "select contact ->> 'contactEmail' from public.place_import_private p join public.places s on s.id = p.place_id where s.slug = 'prv-uno'")" "nuevo@prueba.test"

# Limpieza de los datos de prueba
Q "delete from public.places where slug like 'prv-%'" >/dev/null
echo "✔ PRIV-01: respaldo, limpieza y restauración verificados"
