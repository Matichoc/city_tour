-- Lugares. Los booleanos son nullable a propósito: null = "no se sabe",
-- distinto de false = "no tiene". Nunca se inventa un valor.

create table public.places (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  locality_id uuid references public.localities (id) on delete set null,
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  address text,
  price_level smallint check (price_level between 0 and 4),
  estimated_visit_minutes integer check (estimated_visit_minutes > 0),
  difficulty public.difficulty_level,
  phone text,
  email text,
  website text,
  instagram text,
  parking boolean,
  bathrooms boolean,
  wheelchair_accessible boolean,
  child_friendly boolean,
  pet_friendly boolean,
  reservation_required boolean,
  setting public.setting_kind,
  publication_status public.publication_status not null default 'draft',
  verification_status public.verification_status not null default 'pending',
  last_verified_at timestamptz,
  status_changed_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);

create table public.place_translations (
  place_id uuid not null references public.places (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  short_description text,
  full_description text,
  recommendations text,
  safety_notes text,
  accessibility_notes text,
  mobile_coverage_notes text,
  translation_status public.translation_status,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (place_id, locale),
  check ((locale = 'es') = (translation_status is null))
);

-- Varias filas por día permiten horario partido y temporadas (valid_from/until).
create table public.place_hours (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  notes text,
  valid_from date,
  valid_until date,
  check (closed or (opens_at is not null and closes_at is not null)),
  check (valid_from is null or valid_until is null or valid_from <= valid_until)
);

create table public.place_images (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  storage_path text not null,
  alt_text text not null check (length(trim(alt_text)) > 0),
  credit text,
  position integer not null default 0
);

create table public.place_tags (
  place_id uuid not null references public.places (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (place_id, tag_id)
);

create table public.lodging_details (
  place_id uuid primary key references public.places (id) on delete cascade,
  lodging_type text check (lodging_type in ('hotel', 'cabin', 'hostel', 'camping', 'apartment', 'other')),
  rooms integer check (rooms >= 0),
  capacity_people integer check (capacity_people >= 0),
  sernatur_registered boolean,
  sernatur_code text,
  checkin_time time,
  checkout_time time,
  amenities text[] not null default '{}'
);

create table public.dining_details (
  place_id uuid primary key references public.places (id) on delete cascade,
  cuisine_types text[] not null default '{}',
  takes_reservations boolean,
  serves_vegetarian boolean,
  price_range smallint check (price_range between 1 and 4)
);

create index places_category_idx on public.places (category_id);
create index places_locality_idx on public.places (locality_id);
create index places_org_idx on public.places (organization_id);
create index places_pub_idx on public.places (publication_status);
create index places_verified_idx on public.places (last_verified_at);
create index place_hours_place_idx on public.place_hours (place_id);
create index place_images_place_idx on public.place_images (place_id, position);
create index place_translations_name_trgm on public.place_translations
  using gin (lower(name) extensions.gin_trgm_ops);

create trigger places_touch before update on public.places
  for each row execute function public.touch_updated_at();
create trigger places_status before insert or update on public.places
  for each row execute function public.touch_status_changed_at();
