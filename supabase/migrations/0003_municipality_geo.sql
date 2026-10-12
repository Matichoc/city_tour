-- Núcleo geográfico. Un repo = una comuna, por eso `municipality` tiene una
-- sola fila (la clave booleana lo garantiza).

create table public.municipality (
  id boolean primary key default true check (id),
  name text not null,
  slug text not null unique,
  -- Centro aproximado del mapa (no es un dato oficial de ningún lugar).
  map_center_lat numeric(9, 6) check (map_center_lat between -90 and 90),
  map_center_lng numeric(9, 6) check (map_center_lng between -180 and 180),
  map_default_zoom smallint not null default 13,
  timezone text not null default 'America/Santiago',
  contact_email text,
  website text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.municipality_translations (
  locale public.locale not null,
  description text,
  translation_status public.translation_status,
  updated_at timestamptz not null default now(),
  primary key (locale),
  check ((locale = 'es') = (translation_status is null))
);

-- Localidades de la comuna. Coordenadas opcionales: no se inventan.
create table public.localities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);

create table public.locality_translations (
  locality_id uuid not null references public.localities (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  summary text,
  translation_status public.translation_status,
  updated_at timestamptz not null default now(),
  primary key (locality_id, locale),
  check ((locale = 'es') = (translation_status is null))
);

create trigger municipality_touch before update on public.municipality
  for each row execute function public.touch_updated_at();
create trigger localities_touch before update on public.localities
  for each row execute function public.touch_updated_at();
