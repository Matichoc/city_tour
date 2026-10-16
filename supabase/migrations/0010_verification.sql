-- Fuentes, bitácora de verificación y cola de tareas.
-- Cada fila apunta a EXACTAMENTE una entidad (FKs reales, no entity_id suelto).

create table papudo.sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references papudo.places (id) on delete cascade,
  route_id uuid references papudo.routes (id) on delete cascade,
  organization_id uuid references papudo.organizations (id) on delete cascade,
  event_id uuid references papudo.events (id) on delete cascade,
  title text not null,
  url text,
  publisher text,
  published_date date,
  accessed_at date,
  notes text,
  created_at timestamptz not null default now(),
  check (num_nonnulls(place_id, route_id, organization_id, event_id) = 1)
);

create table papudo.verification_logs (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references papudo.places (id) on delete cascade,
  route_id uuid references papudo.routes (id) on delete cascade,
  organization_id uuid references papudo.organizations (id) on delete cascade,
  event_id uuid references papudo.events (id) on delete cascade,
  verified_by uuid references auth.users (id) on delete set null,
  previous_status papudo.verification_status,
  new_status papudo.verification_status not null,
  evidence_url text,
  notes text,
  created_at timestamptz not null default now(),
  check (num_nonnulls(place_id, route_id, organization_id, event_id) = 1)
);

-- Cola de cambios propuestos (por una persona o, en el futuro, un agente en
-- modo solo lectura). Nunca se publican solos: una persona aprueba.
create table papudo.verification_tasks (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references papudo.places (id) on delete cascade,
  route_id uuid references papudo.routes (id) on delete cascade,
  organization_id uuid references papudo.organizations (id) on delete cascade,
  event_id uuid references papudo.events (id) on delete cascade,
  reason text not null,
  proposed_change jsonb,
  proposed_by_kind text not null default 'user' check (proposed_by_kind in ('user', 'agent')),
  proposed_by uuid references auth.users (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(place_id, route_id, organization_id, event_id) = 1)
);

create index sources_place_idx on papudo.sources (place_id);
create index sources_route_idx on papudo.sources (route_id);
create index verification_logs_place_idx on papudo.verification_logs (place_id, created_at desc);
create index verification_tasks_open_idx on papudo.verification_tasks (status) where status = 'open';

-- Único camino para cambiar el estado de verificación: lo hace un
-- verificador o administrador, y siempre deja registro.
create or replace function papudo.verify_entity(
  p_entity text,
  p_id uuid,
  p_status papudo.verification_status,
  p_notes text default null,
  p_evidence_url text default null
)
returns void
language plpgsql
security definer
set search_path = papudo
as $$
declare
  v_table text;
  v_fk text;
  v_prev papudo.verification_status;
begin
  if not papudo.has_role('admin', 'verifier') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_table := case p_entity
    when 'place' then 'places'
    when 'route' then 'routes'
    when 'organization' then 'organizations'
    when 'event' then 'events'
    else null end;
  if v_table is null then
    raise exception 'unknown entity %', p_entity using errcode = '22023';
  end if;
  v_fk := p_entity || '_id';

  execute format('select verification_status from papudo.%I where id = $1', v_table)
    into v_prev using p_id;
  if v_prev is null then
    raise exception 'entity not found' using errcode = 'P0002';
  end if;

  perform set_config('app.bypass_guard', 'on', true);
  execute format(
    'update papudo.%I set verification_status = $2,
       last_verified_at = case when $2 = ''verified'' then now() else last_verified_at end
     where id = $1', v_table)
    using p_id, p_status;
  perform set_config('app.bypass_guard', 'off', true);

  execute format(
    'insert into papudo.verification_logs (%I, verified_by, previous_status, new_status, evidence_url, notes)
     values ($1, auth.uid(), $2, $3, $4, $5)', v_fk)
    using p_id, v_prev, p_status, p_evidence_url, p_notes;
end;
$$;

grant execute on function papudo.verify_entity(text, uuid, papudo.verification_status, text, text)
  to authenticated;
