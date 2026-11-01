-- PRIV-01 (solución): el contacto de la importación va en una tabla privada.
--
-- `places.import_snapshot` puede leerse en público (filas publicadas) y hasta
-- ahora guardaba también el nombre y el correo de quien inscribió el comercio.
-- Desde esta migración el código guarda ese contacto aquí, solo visible para el
-- personal, y `import_snapshot` queda únicamente con datos del comercio.
--
-- Es aditiva: no modifica `places` ni borra nada. Los valores antiguos que aún
-- estén dentro de `import_snapshot` se siguen leyendo (la importación los usa
-- como respaldo) hasta que se ejecute la limpieza manual:
--   supabase/manual/limpiar-contacto-snapshot.sql  (con respaldo previo).
--
-- Sin trigger de auditoría a propósito: copiaría el contacto a `audit_log`.

create table public.place_import_private (
  place_id uuid primary key references public.places (id) on delete cascade,
  -- {"contactName": ..., "contactEmail": ...} de la última importación.
  contact jsonb not null default '{}'::jsonb
    check (jsonb_typeof(contact) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.place_import_private enable row level security;
create policy place_import_private_staff_read on public.place_import_private for select
  using (public.is_staff());
create policy place_import_private_write on public.place_import_private for all
  using (public.has_role('admin', 'editor'))
  with check (public.has_role('admin', 'editor'));
revoke all on public.place_import_private from anon;
