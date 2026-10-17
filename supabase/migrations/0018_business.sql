-- Comercios: botón de acción en la ficha, avisos destacados con vencimiento
-- y configuración del sitio (invitación a sumarse). Todo se edita en /admin.

-- 1) Botón de acción de la ficha («Reserva por WhatsApp», «Ver carta»...).
--    content.sql no toca estas columnas: lo editado en el panel se conserva.
alter table public.places
  add column cta_kind text
    check (cta_kind in ('whatsapp', 'phone', 'website', 'menu', 'booking', 'instagram')),
  add column cta_value text check (length(trim(cta_value)) between 3 and 300),
  add constraint places_cta_pair check ((cta_kind is null) = (cta_value is null)),
  add constraint places_cta_url check (
    cta_kind is null or cta_kind in ('whatsapp', 'phone') or cta_value ~ '^https?://'
  );

-- 2) Avisos destacados. Con place_id: aparecen en la ficha del local; sin él,
--    son avisos generales (portada). Se muestran solo dentro de su vigencia.
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places (id) on delete cascade,
  title text not null check (length(trim(title)) between 3 and 80),
  body text check (length(body) <= 280),
  link_url text check (link_url ~ '^https?://'),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index notices_place_idx on public.notices (place_id);
create index notices_window_idx on public.notices (ends_at) where active;

alter table public.notices enable row level security;
create policy notices_read on public.notices for select using (
  public.is_staff()
  or (active and now() between starts_at and ends_at and (
    place_id is null
    or exists (select 1 from public.places p where p.id = place_id and p.publication_status = 'published')
  ))
);
create policy notices_write on public.notices for all
  using (public.has_role('admin', 'editor'))
  with check (public.has_role('admin', 'editor'));

-- 3) Configuración del sitio (una sola fila): invitación a comercios.
create table public.site_settings (
  id boolean primary key default true check (id),
  business_form_url text check (business_form_url ~ '^https?://'),
  business_invite boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (true) on conflict do nothing;

alter table public.site_settings enable row level security;
create policy site_settings_read on public.site_settings for select using (true);
create policy site_settings_admin_write on public.site_settings for update
  using (public.has_role('admin')) with check (public.has_role('admin'));
revoke insert, delete on public.site_settings from anon, authenticated;

create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- Bitácora.
create trigger notices_audit after insert or update or delete on public.notices
  for each row execute function public.audit_row();
create trigger site_settings_audit after insert or update or delete on public.site_settings
  for each row execute function public.audit_row();
