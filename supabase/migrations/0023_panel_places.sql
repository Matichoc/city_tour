-- Fichas creadas o editadas desde el panel, e importación desde la planilla
-- del formulario «Suma tu comercio».

-- 1) Horario tal como lo escribió el local (cuando no hay horario por
--    temporada). Se muestra textual con «Informado por el local».
alter table public.places
  add column hours_text text check (length(hours_text) <= 600),
  -- Si se creó o editó en el panel, content.sql (el repo) ya no la toca.
  add column managed_in_panel boolean not null default false,
  -- Importación: clave de la fila (nombre normalizado) y últimos valores
  -- importados, para cargar solo lo que cambió. Sin datos personales.
  add column import_key text unique,
  add column import_snapshot jsonb,
  add column imported_at timestamptz;

-- 2) Contacto de quien inscribió el comercio: dato personal, solo personal.
create table public.place_contacts (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  name text check (length(name) <= 120),
  email text check (length(email) <= 200),
  phone text check (length(phone) <= 40),
  source text not null default 'formulario',
  created_at timestamptz not null default now(),
  unique (place_id, email)
);
alter table public.place_contacts enable row level security;
create policy place_contacts_staff_read on public.place_contacts for select
  using (public.is_staff());
create policy place_contacts_write on public.place_contacts for all
  using (public.has_role('admin', 'editor'))
  with check (public.has_role('admin', 'editor'));
revoke all on public.place_contacts from anon;

create trigger place_contacts_audit after insert or update or delete on public.place_contacts
  for each row execute function public.audit_row();

-- 3) Última planilla usada para importar comercios (la fija un administrador).
alter table public.site_settings
  add column import_sheet_url text
    check (import_sheet_url ~ '^https://docs\.google\.com/spreadsheets/');
