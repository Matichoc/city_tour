-- Eventos y cartelera. Los vencidos no se borran: se ocultan por consulta.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  starts_at timestamptz not null,
  ends_at timestamptz,
  place_id uuid references public.places (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  free_entry boolean,
  url text,
  publication_status public.publication_status not null default 'draft',
  verification_status public.verification_status not null default 'pending',
  last_verified_at timestamptz,
  status_changed_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.event_translations (
  event_id uuid not null references public.events (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  description text,
  translation_status public.translation_status,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (event_id, locale),
  check ((locale = 'es') = (translation_status is null))
);

create index events_starts_idx on public.events (starts_at);
create index events_pub_idx on public.events (publication_status);

create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();
create trigger events_status before insert or update on public.events
  for each row execute function public.touch_status_changed_at();
