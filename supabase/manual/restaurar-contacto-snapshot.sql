-- Deshace la limpieza de PRIV-01 a partir de place_import_private: vuelve a
-- poner contactName/contactEmail dentro de places.import_snapshot. Úsalo solo
-- si algo falló y no se puede esperar a restaurar desde el respaldo en CSV
-- (scripts/db/restaurar-priv01.sh, que devuelve el snapshot EXACTO original).
-- Al volver a exponer el contacto, deja la contención 0025 aplicada.
begin;
alter table public.places disable trigger user;
update public.places p
   set import_snapshot = p.import_snapshot || x.contact
  from public.place_import_private x
 where x.place_id = p.id and p.import_snapshot is not null;
alter table public.places enable trigger user;
commit;
