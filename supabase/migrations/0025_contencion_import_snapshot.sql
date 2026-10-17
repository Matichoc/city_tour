-- PRIV-01 (contención): el público no puede leer places.import_snapshot.
--
-- Esa columna guarda los últimos valores importados desde la planilla «Suma tu
-- comercio» y, hasta ahora, incluía el nombre y el correo de quien inscribió el
-- comercio. La política RLS de `places` deja leer las filas publicadas, y la
-- columna iba incluida. Aquí se le quita el SELECT al rol anónimo solo sobre
-- esa columna: el sitio público ya lee `places` con una lista explícita de
-- columnas (src/lib/db/content-source.ts), así que no cambia nada visible.
--
-- No borra ni modifica datos. Se revierte con:
--   grant select on public.places to anon;
-- (está también en supabase/manual/revertir-0025.sql)
--
-- Los permisos por columna no se heredan: si una migración futura agrega una
-- columna pública a `places`, debe hacer `grant select (columna) on
-- public.places to anon`. tests/db/privacy.check.sql avisa si se olvida.
--
-- Pendiente (no cubierto aquí): el rol `authenticated` conserva el SELECT
-- porque el personal también usa ese rol; se resuelve con 0026 (el contacto sale
-- del snapshot) y con la limpieza de los datos antiguos.

do $$
declare
  v_cols text;
begin
  select string_agg(format('%I', attname), ', ' order by attnum) into v_cols
  from pg_attribute
  where attrelid = 'public.places'::regclass
    and attnum > 0 and not attisdropped
    and attname <> 'import_snapshot';

  revoke select on public.places from anon;
  execute format('grant select (%s) on public.places to anon', v_cols);
end;
$$;

comment on column public.places.import_snapshot is
  'Últimos valores importados (para cargar solo lo que cambió). Sin lectura pública (0025). No debe guardar datos personales: el contacto va en place_import_private (0026).';
