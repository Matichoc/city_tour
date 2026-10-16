create table papudo.routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  duration_minutes integer check (duration_minutes > 0),
  distance_km numeric(6, 2) check (distance_km >= 0),
  difficulty papudo.difficulty_level,
  transport_mode papudo.transport_mode,
  route_type text,
  cover_image_path text,
  publication_status papudo.publication_status not null default 'draft',
  verification_status papudo.verification_status not null default 'pending',
  last_verified_at timestamptz,
  status_changed_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table papudo.route_translations (
  route_id uuid not null references papudo.routes (id) on delete cascade,
  locale papudo.locale not null,
  name text not null,
  short_description text,
  story text,
  safety_notes text,
  translation_status papudo.translation_status,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (route_id, locale),
  check ((locale = 'es') = (translation_status is null))
);

create table papudo.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references papudo.routes (id) on delete cascade,
  place_id uuid not null references papudo.places (id) on delete restrict,
  position integer not null check (position >= 0),
  recommended_minutes integer check (recommended_minutes > 0),
  optional boolean not null default false,
  -- Diferido para poder reordenar paradas dentro de una transacción.
  constraint route_stops_position_unique unique (route_id, position) deferrable initially deferred
);

create table papudo.route_stop_translations (
  route_stop_id uuid not null references papudo.route_stops (id) on delete cascade,
  locale papudo.locale not null,
  instructions text,
  narrative text,
  translation_status papudo.translation_status,
  updated_at timestamptz not null default now(),
  primary key (route_stop_id, locale),
  check ((locale = 'es') = (translation_status is null))
);

create index routes_pub_idx on papudo.routes (publication_status);
create index route_stops_place_idx on papudo.route_stops (place_id);

create trigger routes_touch before update on papudo.routes
  for each row execute function papudo.touch_updated_at();
create trigger routes_status before insert or update on papudo.routes
  for each row execute function papudo.touch_status_changed_at();
