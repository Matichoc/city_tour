-- «Mi local» con correo y código: el locatario entra escribiendo el correo que
-- la Municipalidad registró para su local; le llega un código de 6 dígitos
-- (Supabase Auth, OTP por correo) y queda con su sesión, sin contraseña y sin
-- enlace que venza. El enlace personal (0031) sigue funcionando igual.
--
-- El correo del locatario es un dato personal: va en el esquema privado y
-- solo el personal (admin o editor) lo ve o lo cambia.

create table private.owner_contacts (
  place_id uuid primary key references public.places (id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  updated_at timestamptz not null default now()
);
create index owner_contacts_email_idx on private.owner_contacts (email);
alter table private.owner_contacts enable row level security;
revoke all on private.owner_contacts from public, anon, authenticated;

comment on table private.owner_contacts is
  'Correo con el que el locatario entra a «Mi local» (código por correo).';

-- Correo de quien hace la consulta (sesión de Supabase Auth), en minúsculas.
create or replace function private.request_email()
returns text
language sql
stable
as $$
  select lower(nullif(btrim(coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email',
    current_setting('request.jwt.claim.email', true)
  )), ''))
$$;

-- ── Personal: registrar o quitar el correo del locatario ──

create or replace function public.set_owner_email(p_place uuid, p_email text)
returns void
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.has_role('admin', 'editor') then
    raise exception 'solo el personal registra correos' using errcode = '42501';
  end if;
  if not exists (select 1 from public.places where id = p_place and is_business) then
    raise exception 'el acceso es solo para comercios' using errcode = '22023';
  end if;
  if v_email = '' then
    delete from private.owner_contacts where place_id = p_place;
    return;
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception 'correo no válido' using errcode = '22023';
  end if;
  insert into private.owner_contacts (place_id, email) values (p_place, v_email)
  on conflict (place_id) do update set email = excluded.email, updated_at = now();
end;
$$;

create or replace function public.owner_email_of(p_place uuid)
returns text
language plpgsql
stable
security definer
set search_path = private, public
as $$
begin
  if not public.has_role('admin', 'editor') then
    raise exception 'solo el personal ve los correos' using errcode = '42501';
  end if;
  return (select email from private.owner_contacts where place_id = p_place);
end;
$$;

-- ── Lo común a las dos formas de entrar (enlace o correo) ──

-- Datos del local para «Mi local» (igual que owner_session de 0035).
create or replace function private.owner_session_for(p_place uuid)
returns jsonb
language sql
stable
security definer
set search_path = private, public
as $$
  select jsonb_build_object(
    'place_id', p.id,
    'slug', p.slug,
    'name', t.name,
    'published', p.publication_status = 'published',
    'current', jsonb_build_object(
      'short_description', t.short_description,
      'full_description', t.full_description,
      'hours_text', p.hours_text,
      'address', p.address,
      'cta_kind', p.cta_kind,
      'cta_value', p.cta_value,
      'instagram', p.instagram,
      'website', p.website
    ),
    'hours_rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day_of_week', h.day_of_week, 'opens_at', h.opens_at, 'closes_at', h.closes_at,
        'closed', h.closed, 'from_month', h.from_month, 'to_month', h.to_month,
        'holidays', h.holidays
      ) order by h.from_month nulls first, h.day_of_week)
      from public.place_hours h where h.place_id = p.id
    ), '[]'::jsonb),
    'last', (
      select jsonb_build_object(
        'status', r.status, 'changes', r.changes, 'created_at', r.created_at,
        'reviewed_at', r.reviewed_at, 'review_note', r.review_note
      )
      from public.place_change_requests r
      where r.place_id = p.id and r.status <> 'replaced'
      order by r.created_at desc
      limit 1
    )
  )
  from public.places p
  left join public.place_translations t on t.place_id = p.id and t.locale = 'es'
  where p.id = p_place
$$;

-- Guarda una propuesta (validación y freno al abuso de 0031).
create or replace function private.owner_submit_for(
  p_place uuid,
  p_changes jsonb,
  p_name text,
  p_note text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_id uuid;
begin
  if not private.owner_changes_ok(p_changes) then
    raise exception 'propuesta no válida' using errcode = '22023';
  end if;
  -- Freno al abuso: hasta 10 envíos por local al día.
  if (select count(*) from public.place_change_requests
      where place_id = p_place and created_at > now() - interval '1 day') >= 10 then
    raise exception 'demasiados envíos hoy' using errcode = '54000';
  end if;
  update public.place_change_requests set status = 'replaced'
    where place_id = p_place and status = 'pending';
  insert into public.place_change_requests (place_id, changes, submitter_name, note)
    values (p_place, p_changes, btrim(p_name), nullif(btrim(p_note), ''))
    returning id into v_id;
  return v_id;
end;
$$;

-- ── Con el enlace (igual que antes, usando lo común) ──

create or replace function public.owner_session(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_key private.owner_keys;
begin
  v_key := private.owner_key_for(p_token);
  if v_key.id is null then return null; end if;
  update private.owner_keys set last_used_at = now() where id = v_key.id;
  return private.owner_session_for(v_key.place_id);
end;
$$;

create or replace function public.submit_owner_proposal(
  p_token text,
  p_changes jsonb,
  p_name text,
  p_note text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_key private.owner_keys;
  v_id uuid;
begin
  v_key := private.owner_key_for(p_token);
  if v_key.id is null then
    raise exception 'enlace no válido o vencido' using errcode = '28000';
  end if;
  v_id := private.owner_submit_for(v_key.place_id, p_changes, p_name, p_note);
  update private.owner_keys set last_used_at = now() where id = v_key.id;
  return v_id;
end;
$$;

-- ── Con el correo (sesión de Supabase Auth) ──

-- Locales del correo con que se entró (puede tener más de uno).
create or replace function public.owner_my_places()
returns table (place_id uuid, slug text, name text)
language sql
stable
security definer
set search_path = private, public
as $$
  select p.id, p.slug, coalesce(t.name, p.slug)
  from private.owner_contacts c
  join public.places p on p.id = c.place_id
  left join public.place_translations t on t.place_id = p.id and t.locale = 'es'
  where private.request_email() is not null and c.email = private.request_email()
  order by 3
$$;

create or replace function private.owner_email_owns(p_place uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select private.request_email() is not null and exists (
    select 1 from private.owner_contacts
    where place_id = p_place and email = private.request_email()
  )
$$;

create or replace function public.owner_session_mine(p_place uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = private, public
as $$
begin
  if not private.owner_email_owns(p_place) then return null; end if;
  return private.owner_session_for(p_place);
end;
$$;

create or replace function public.submit_owner_proposal_mine(
  p_place uuid,
  p_changes jsonb,
  p_name text,
  p_note text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = private, public
as $$
begin
  if not private.owner_email_owns(p_place) then
    raise exception 'este correo no administra ese local' using errcode = '28000';
  end if;
  return private.owner_submit_for(p_place, p_changes, p_name, p_note);
end;
$$;

revoke all on function private.request_email() from public, anon, authenticated;
revoke all on function private.owner_session_for(uuid) from public, anon, authenticated;
revoke all on function private.owner_submit_for(uuid, jsonb, text, text) from public, anon, authenticated;
revoke all on function private.owner_email_owns(uuid) from public, anon, authenticated;
revoke all on function public.set_owner_email(uuid, text) from public, anon;
revoke all on function public.owner_email_of(uuid) from public, anon;
revoke all on function public.owner_my_places() from public, anon;
revoke all on function public.owner_session_mine(uuid) from public, anon;
revoke all on function public.submit_owner_proposal_mine(uuid, jsonb, text, text) from public, anon;
grant execute on function public.set_owner_email(uuid, text) to authenticated;
grant execute on function public.owner_email_of(uuid) to authenticated;
grant execute on function public.owner_my_places() to authenticated;
grant execute on function public.owner_session_mine(uuid) to authenticated;
grant execute on function public.submit_owner_proposal_mine(uuid, jsonb, text, text) to authenticated;
grant execute on function public.owner_session(text) to anon, authenticated;
grant execute on function public.submit_owner_proposal(text, jsonb, text, text) to anon, authenticated;
