-- PRIV-01: saca el nombre y el correo de contacto de places.import_snapshot.
-- NO es una migración: se ejecuta UNA VEZ, a mano, en el SQL Editor de Supabase,
-- y solo después de que se cumplan TODOS estos pasos (en este orden):
--   1. Aplicada la migración 0026 (tabla place_import_private).
--   2. Desplegado el código que lee/escribe el contacto en esa tabla.
--   3. Hecho y verificado el respaldo (scripts/db/respaldo-priv01.sh).
--   4. Nadie está importando desde la planilla mientras corre (dura segundos).
--
-- Qué hace, todo en UNA transacción (si algo falla, no queda nada a medias):
--   a) copia el contacto de cada snapshot a place_import_private (si ya hay
--      fila privada, la conserva: es la más reciente);
--   b) comprueba que cada ficha afectada tiene su fila privada;
--   c) quita las claves contactName/contactEmail de import_snapshot, sin
--      disparar los triggers de places (así no se copian a audit_log ni se
--      toca updated_at);
--   d) comprueba que no quedó ninguna.
-- Es idempotente: si se repite, no encuentra nada que limpiar.
-- Para deshacer: supabase/manual/restaurar-contacto-snapshot.sql o el script
-- scripts/db/restaurar-priv01.sh con el respaldo.

begin;
set local lock_timeout = '10s';

do $$
begin
  if to_regclass('public.place_import_private') is null then
    raise exception 'Falta la migración 0026 (place_import_private). No se hizo nada.';
  end if;
  raise notice 'Fichas con contacto en import_snapshot (antes): %',
    (select count(*) from public.places
     where import_snapshot ? 'contactName' or import_snapshot ? 'contactEmail');
end;
$$;

-- a) copiar al almacén privado
insert into public.place_import_private (place_id, contact)
select id,
       jsonb_build_object(
         'contactName', import_snapshot -> 'contactName',
         'contactEmail', import_snapshot -> 'contactEmail')
from public.places
where import_snapshot ? 'contactName' or import_snapshot ? 'contactEmail'
on conflict (place_id) do nothing;

-- b) verificar la copia antes de borrar nada
do $$
declare
  v_faltan integer;
begin
  select count(*) into v_faltan
  from public.places p
  where (p.import_snapshot ? 'contactName' or p.import_snapshot ? 'contactEmail')
    and not exists (select 1 from public.place_import_private x where x.place_id = p.id);
  if v_faltan > 0 then
    raise exception 'Faltan % copias privadas. Se cancela sin borrar nada.', v_faltan;
  end if;
end;
$$;

-- c) quitar las claves (sin triggers: no pasa por la bitácora)
alter table public.places disable trigger user;
update public.places
   set import_snapshot = import_snapshot - 'contactName' - 'contactEmail'
 where import_snapshot ? 'contactName' or import_snapshot ? 'contactEmail';
alter table public.places enable trigger user;

-- d) verificar el resultado
do $$
declare
  v_quedan integer;
  v_desact integer;
begin
  select count(*) into v_quedan from public.places
   where import_snapshot ? 'contactName' or import_snapshot ? 'contactEmail';
  if v_quedan > 0 then
    raise exception 'Quedaron % fichas con contacto. Se cancela.', v_quedan;
  end if;
  select count(*) into v_desact from pg_trigger
   where tgrelid = 'public.places'::regclass and not tgisinternal and tgenabled = 'D';
  if v_desact > 0 then
    raise exception 'Quedaron triggers de places desactivados. Se cancela.';
  end if;
  raise notice 'Fichas con contacto en import_snapshot (después): 0. Filas privadas: %',
    (select count(*) from public.place_import_private);
end;
$$;

commit;
