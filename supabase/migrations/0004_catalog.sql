-- Catálogo: categorías (con subcategorías) y etiquetas.

create table papudo.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references papudo.categories (id) on delete restrict,
  slug text not null unique,
  icon text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table papudo.category_translations (
  category_id uuid not null references papudo.categories (id) on delete cascade,
  locale papudo.locale not null,
  name text not null,
  description text,
  translation_status papudo.translation_status,
  updated_at timestamptz not null default now(),
  primary key (category_id, locale),
  check ((locale = 'es') = (translation_status is null))
);

create table papudo.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table papudo.tag_translations (
  tag_id uuid not null references papudo.tags (id) on delete cascade,
  locale papudo.locale not null,
  name text not null,
  translation_status papudo.translation_status,
  updated_at timestamptz not null default now(),
  primary key (tag_id, locale),
  check ((locale = 'es') = (translation_status is null))
);

create trigger categories_touch before update on papudo.categories
  for each row execute function papudo.touch_updated_at();
