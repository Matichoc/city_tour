-- Organizaciones: quién es (negocio, cámara de comercio, operador...).
-- Separado de `places` (dónde está). Una playa o un mirador no tienen organización.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  type public.org_type not null,
  slug text not null unique,
  legal_name text,
  rut text,
  phone text,
  email text,
  website text,
  instagram text,
  facebook text,
  publication_status public.publication_status not null default 'draft',
  verification_status public.verification_status not null default 'pending',
  last_verified_at timestamptz,
  status_changed_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_translations (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  short_description text,
  full_description text,
  translation_status public.translation_status,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (organization_id, locale),
  check ((locale = 'es') = (translation_status is null))
);

-- Socios de una cámara de comercio (chamber) o asociación.
create table public.chamber_memberships (
  chamber_id uuid not null references public.organizations (id) on delete cascade,
  member_id uuid not null references public.organizations (id) on delete cascade,
  since date,
  active boolean not null default true,
  primary key (chamber_id, member_id),
  check (chamber_id <> member_id)
);

-- Para la Fase 7 (portal por negocio). Vacía en el MVP.
create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organizations_type_idx on public.organizations (type);
create index organizations_pub_idx on public.organizations (publication_status);
create index organization_translations_name_trgm on public.organization_translations
  using gin (lower(name) extensions.gin_trgm_ops);

create trigger organizations_touch before update on public.organizations
  for each row execute function public.touch_updated_at();
create trigger organizations_status before insert or update on public.organizations
  for each row execute function public.touch_status_changed_at();
