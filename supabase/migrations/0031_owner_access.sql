-- Locatarios: enlace personal del local y propuestas de cambio que valida la
-- municipalidad.
--
-- El personal (admin o editor) genera en el panel un enlace único para un
-- comercio y se lo manda al locatario por WhatsApp o correo. Con ese enlace,
-- sin cuenta ni contraseña, el locatario propone cambios a su ficha (textos,
-- horario, contacto). Nada se publica solo: el personal revisa la propuesta y,
-- al aprobarla, se aplica a la ficha y queda «validada».
--
-- Del enlace solo se guarda la huella (SHA-256): si alguien lee la base, no
-- puede entrar. Generar uno nuevo corta el anterior. Vence al año.
-- Sin clave de servicio: todo pasa por funciones con permisos propios.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.owner_keys (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 year',
  revoked_at timestamptz,
  last_used_at timestamptz
);
create index owner_keys_active_idx on private.owner_keys (place_id)
  where revoked_at is null;
alter table private.owner_keys enable row level security;
revoke all on private.owner_keys from public, anon, authenticated;

create type public.proposal_status as enum (
  'pending', 'approved', 'rejected', 'replaced'
);

create table public.place_change_requests (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  status public.proposal_status not null default 'pending',
  -- Solo los campos que el locatario cambió (ver private.owner_changes_ok).
  changes jsonb not null check (jsonb_typeof(changes) = 'object'),
  submitter_name text not null
    check (length(btrim(submitter_name)) between 2 and 80),
  note text check (note is null or length(note) <= 1000),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or length(review_note) <= 1000)
);
create index place_change_requests_status_idx
  on public.place_change_requests (status, created_at desc);
-- Una sola propuesta pendiente por local: la nueva reemplaza a la anterior.
create unique index place_change_requests_one_pending
  on public.place_change_requests (place_id) where status = 'pending';

comment on table public.place_change_requests is
  'Cambios a la ficha propuestos por el locatario; el personal los aprueba o rechaza.';

alter table public.place_change_requests enable row level security;
-- Solo el personal las ve. Nadie escribe directo: van por las funciones.
create policy place_change_requests_staff_read
  on public.place_change_requests for select using (public.is_staff());
revoke insert, update, delete on public.place_change_requests
  from anon, authenticated;

-- Campos que el locatario puede proponer, con su largo máximo.
create or replace function private.owner_field_limits()
returns table (field text, max_len int)
language sql
immutable
as $$
  values
    ('short_description', 200), ('full_description', 3000),
    ('hours_text', 600), ('address', 200), ('cta_kind', 20),
    ('cta_value', 300), ('instagram', 100), ('website', 300)
$$;

-- Valida una propuesta: solo campos permitidos, textos (o null) y sin pasarse.
create or replace function private.owner_changes_ok(p_changes jsonb)
returns boolean
language plpgsql
immutable
set search_path = private, public
as $$
declare
  v_key text;
  v_value jsonb;
  v_max int;
begin
  if p_changes is null or jsonb_typeof(p_changes) <> 'object'
     or p_changes = '{}'::jsonb then
    return false;
  end if;
  for v_key, v_value in select * from jsonb_each(p_changes) loop
    select max_len into v_max from private.owner_field_limits() where field = v_key;
    if v_max is null then return false; end if;
    if jsonb_typeof(v_value) = 'null' then continue; end if;
    if jsonb_typeof(v_value) <> 'string' or length(v_value #>> '{}') > v_max then
      return false;
    end if;
  end loop;
  if p_changes ? 'cta_kind' and jsonb_typeof(p_changes -> 'cta_kind') = 'string'
     and (p_changes ->> 'cta_kind') not in
       ('whatsapp', 'phone', 'website', 'menu', 'booking', 'instagram') then
    return false;
  end if;
  -- El botón va con su valor (o se quitan los dos).
  if (p_changes ? 'cta_kind') <> (p_changes ? 'cta_value') then
    return false;
  end if;
  return true;
end;
$$;

-- Enlace vigente para un código, o nada. El código nunca se guarda tal cual.
create or replace function private.owner_key_for(p_token text)
returns private.owner_keys
language sql
stable
security definer
set search_path = private, public, extensions
as $$
  select k.*
  from private.owner_keys k
  where p_token is not null
    and length(p_token) between 32 and 128
    and k.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and k.revoked_at is null
    and k.expires_at > now()
  limit 1
$$;

-- ── Personal: generar, cortar y ver el enlace de un local ──

create or replace function public.create_owner_key(p_place uuid)
returns text
language plpgsql
volatile
security definer
set search_path = private, public, extensions
as $$
declare
  v_token text;
begin
  if not public.has_role('admin', 'editor') then
    raise exception 'solo el personal genera enlaces de locatario'
      using errcode = '42501';
  end if;
  if not exists (select 1 from public.places where id = p_place and is_business) then
    raise exception 'el enlace es solo para comercios' using errcode = '22023';
  end if;
  update private.owner_keys set revoked_at = now()
    where place_id = p_place and revoked_at is null;
  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into private.owner_keys (place_id, token_hash, created_by)
    values (p_place, encode(extensions.digest(v_token, 'sha256'), 'hex'), auth.uid());
  return v_token;
end;
$$;

create or replace function public.revoke_owner_keys(p_place uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_count integer;
begin
  if not public.has_role('admin', 'editor') then
    raise exception 'solo el personal corta enlaces de locatario'
      using errcode = '42501';
  end if;
  update private.owner_keys set revoked_at = now()
    where place_id = p_place and revoked_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.owner_key_status(p_place uuid)
returns table (created_at timestamptz, expires_at timestamptz, last_used_at timestamptz)
language plpgsql
stable
security definer
set search_path = private, public
as $$
begin
  if not public.is_staff() then
    raise exception 'solo el personal' using errcode = '42501';
  end if;
  return query
    select k.created_at, k.expires_at, k.last_used_at
    from private.owner_keys k
    where k.place_id = p_place and k.revoked_at is null and k.expires_at > now()
    order by k.created_at desc
    limit 1;
end;
$$;

-- ── Locatario: ver su ficha y proponer cambios (con su enlace) ──

-- Lo que el locatario ve de su local: los datos actuales y su última propuesta.
create or replace function public.owner_session(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_key private.owner_keys;
  v_result jsonb;
begin
  v_key := private.owner_key_for(p_token);
  if v_key.id is null then return null; end if;
  update private.owner_keys set last_used_at = now() where id = v_key.id;

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
  into v_result
  from public.places p
  left join public.place_translations t on t.place_id = p.id and t.locale = 'es'
  where p.id = v_key.place_id;
  return v_result;
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
  if not private.owner_changes_ok(p_changes) then
    raise exception 'propuesta no válida' using errcode = '22023';
  end if;
  -- Freno al abuso: hasta 10 envíos por local al día.
  if (select count(*) from public.place_change_requests
      where place_id = v_key.place_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'demasiados envíos hoy' using errcode = '54000';
  end if;
  update public.place_change_requests set status = 'replaced'
    where place_id = v_key.place_id and status = 'pending';
  insert into public.place_change_requests (place_id, changes, submitter_name, note)
    values (v_key.place_id, p_changes, btrim(p_name), nullif(btrim(p_note), ''))
    returning id into v_id;
  update private.owner_keys set last_used_at = now() where id = v_key.id;
  return v_id;
end;
$$;

-- ── Personal: aprobar (se aplica a la ficha) o rechazar ──

create or replace function public.review_owner_proposal(
  p_id uuid,
  p_approve boolean,
  p_note text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  r public.place_change_requests;
  c jsonb;
begin
  if not public.has_role('admin', 'editor') then
    raise exception 'solo el personal revisa propuestas' using errcode = '42501';
  end if;
  select * into r from public.place_change_requests where id = p_id for update;
  if r.id is null or r.status <> 'pending' then
    raise exception 'la propuesta ya no está pendiente' using errcode = '22023';
  end if;

  if p_approve then
    c := r.changes;
    update public.places set
      hours_text = case when c ? 'hours_text' then nullif(btrim(c ->> 'hours_text'), '') else hours_text end,
      address = case when c ? 'address' then nullif(btrim(c ->> 'address'), '') else address end,
      cta_kind = case when c ? 'cta_kind' then nullif(btrim(c ->> 'cta_kind'), '') else cta_kind end,
      cta_value = case when c ? 'cta_value' then nullif(btrim(c ->> 'cta_value'), '') else cta_value end,
      instagram = case when c ? 'instagram' then nullif(btrim(c ->> 'instagram'), '') else instagram end,
      website = case when c ? 'website' then nullif(btrim(c ->> 'website'), '') else website end,
      owner_validated = true,
      info_updated_at = now(),
      managed_in_panel = true
    where id = r.place_id;
    if c ? 'short_description' or c ? 'full_description' then
      update public.place_translations set
        short_description = case when c ? 'short_description'
          then nullif(btrim(c ->> 'short_description'), '') else short_description end,
        full_description = case when c ? 'full_description'
          then nullif(btrim(c ->> 'full_description'), '') else full_description end
      where place_id = r.place_id and locale = 'es';
    end if;
  end if;

  update public.place_change_requests set
    status = case when p_approve then 'approved' else 'rejected' end::public.proposal_status,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = nullif(btrim(p_note), '')
  where id = p_id;
end;
$$;

revoke all on function public.create_owner_key(uuid) from public, anon;
revoke all on function public.revoke_owner_keys(uuid) from public, anon;
revoke all on function public.owner_key_status(uuid) from public, anon;
revoke all on function public.review_owner_proposal(uuid, boolean, text) from public, anon;
grant execute on function public.create_owner_key(uuid) to authenticated;
grant execute on function public.revoke_owner_keys(uuid) to authenticated;
grant execute on function public.owner_key_status(uuid) to authenticated;
grant execute on function public.review_owner_proposal(uuid, boolean, text) to authenticated;
grant execute on function public.owner_session(text) to anon, authenticated;
grant execute on function public.submit_owner_proposal(text, jsonb, text, text)
  to anon, authenticated;
