-- Visitantes: itinerarios compartibles por token y analítica anónima.
-- Sin cuentas, y sin guardar la ubicación precisa del usuario.

create table papudo.itineraries (
  id uuid primary key default gen_random_uuid(),
  -- 64 caracteres hexadecimales (~244 bits): no se puede adivinar.
  public_token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  starting_label text,
  start_locality_id uuid references papudo.localities (id) on delete set null,
  start_at timestamptz,
  available_minutes integer check (available_minutes > 0),
  transport_mode papudo.transport_mode,
  interests text[] not null default '{}',
  adults smallint not null default 1 check (adults >= 0),
  children smallint not null default 0 check (children >= 0),
  walking_level papudo.difficulty_level,
  budget_level text check (budget_level in ('free', 'low', 'medium', 'any')),
  locale papudo.locale not null default 'es',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

create table papudo.itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references papudo.itineraries (id) on delete cascade,
  place_id uuid not null references papudo.places (id) on delete cascade,
  position integer not null check (position >= 0),
  arrival_time timestamptz,
  departure_time timestamptz,
  travel_minutes integer check (travel_minutes >= 0),
  explanation text
);
create index itinerary_stops_itinerary_idx on papudo.itinerary_stops (itinerary_id, position);

create table papudo.analytics_events (
  id bigint generated always as identity primary key,
  name text not null check (name in (
    'place_view', 'route_open', 'itinerary_created', 'navigate_click',
    'contact_click', 'share', 'filter_use', 'search', 'qr_scan'
  )),
  properties jsonb not null default '{}'::jsonb check (octet_length(properties::text) <= 2000),
  locale papudo.locale,
  created_at timestamptz not null default now()
);
create index analytics_events_name_idx on papudo.analytics_events (name, created_at desc);

-- Lectura de un itinerario por su token (sin exponer la tabla).
create or replace function papudo.get_itinerary_by_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = papudo
as $$
  select to_jsonb(i) || jsonb_build_object(
    'stops',
    coalesce((
      select jsonb_agg(to_jsonb(s) order by s.position)
      from papudo.itinerary_stops s
      join papudo.places p on p.id = s.place_id and p.publication_status = 'published'
      where s.itinerary_id = i.id
    ), '[]'::jsonb)
  )
  from papudo.itineraries i
  where i.public_token = p_token and i.expires_at > now()
$$;

grant execute on function papudo.get_itinerary_by_token(text) to anon, authenticated;

-- Resúmenes para el panel de métricas. security invoker: aplica la RLS
-- (solo el personal lee analytics_events).
create or replace function papudo.analytics_totals(p_days integer default 30)
returns table (name text, total bigint)
language sql
stable
security invoker
set search_path = papudo
as $$
  select e.name, count(*) from papudo.analytics_events e
  where e.created_at >= now() - make_interval(days => p_days)
  group by e.name order by count(*) desc
$$;

create or replace function papudo.analytics_top(
  p_name text, p_key text, p_days integer default 30, p_limit integer default 10)
returns table (value text, total bigint)
language sql
stable
security invoker
set search_path = papudo
as $$
  select e.properties ->> p_key, count(*) from papudo.analytics_events e
  where e.name = p_name
    and e.created_at >= now() - make_interval(days => p_days)
    and e.properties ? p_key
  group by 1 order by count(*) desc limit p_limit
$$;

grant execute on function papudo.analytics_totals(integer) to authenticated;
grant execute on function papudo.analytics_top(text, text, integer, integer) to authenticated;
