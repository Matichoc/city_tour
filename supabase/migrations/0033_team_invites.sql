-- Equipo en tres niveles e invitaciones por enlace.
--
--   Superadmin (Matichoc)  → invita a los admin municipales (máximo 2).
--   Admin municipal         → hace todo lo municipal (publica, verifica,
--                             eventos, rutas) e invita a los locatarios (0031).
--   Locatario               → propone cambios a su ficha (0031).
--
-- El superadmin cuenta como admin en todos los permisos existentes. Los roles
-- de Edición y Verificación siguen en la base por compatibilidad, pero ya no se
-- invitan desde el panel.
--
-- Invitación: el superadmin genera un enlace (se guarda solo su huella, vence
-- a los 7 días). La persona lo abre, crea su cuenta con correo y contraseña
-- (Supabase le pide confirmar el correo) y, al entrar por primera vez al panel,
-- la invitación se activa y queda como admin municipal.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- 1) El superadmin pasa cualquier permiso de admin.
create or replace function public.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_app_role() = any (roles)
    or (public.current_app_role() = 'superadmin' and 'admin' = any (roles)),
    false
  )
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'superadmin', false)
$$;
grant execute on function public.is_superadmin() to anon, authenticated;

-- 2) Máximo de admin municipales activos.
create or replace function public.max_municipal_admins()
returns integer
language sql
immutable
as $$ select 2 $$;

create or replace function private.check_admin_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'admin' and new.active and (
    select count(*) from public.profiles
    where role = 'admin' and active and user_id <> new.user_id
  ) >= public.max_municipal_admins() then
    raise exception 'ya hay % admin municipales activos', public.max_municipal_admins()
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_admin_limit before insert or update on public.profiles
  for each row execute function private.check_admin_limit();

-- 3) Invitaciones.
create table private.staff_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  role public.app_role not null default 'admin' check (role = 'admin'),
  note text check (note is null or length(note) <= 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  claimed_email text,
  claimed_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  revoked_at timestamptz
);
alter table private.staff_invites enable row level security;
revoke all on private.staff_invites from public, anon, authenticated;

create or replace function private.invite_for(p_token text)
returns private.staff_invites
language sql
stable
security definer
set search_path = private, public, extensions
as $$
  select i.*
  from private.staff_invites i
  where p_token is not null
    and length(p_token) between 32 and 128
    and i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and i.used_at is null
    and i.revoked_at is null
    and i.expires_at > now()
  limit 1
$$;

-- Genera una invitación (solo superadmin). Devuelve el código una sola vez.
create or replace function public.create_staff_invite(p_note text default null)
returns text
language plpgsql
volatile
security definer
set search_path = private, public, extensions
as $$
declare
  v_token text;
  v_taken integer;
begin
  if not public.is_superadmin() then
    raise exception 'solo el superadmin invita al municipio' using errcode = '42501';
  end if;
  select
    (select count(*) from public.profiles where role = 'admin' and active)
    + (select count(*) from private.staff_invites
       where used_at is null and revoked_at is null and expires_at > now())
  into v_taken;
  if v_taken >= public.max_municipal_admins() then
    raise exception 'ya hay % admin municipales (o invitaciones abiertas)',
      public.max_municipal_admins() using errcode = '23514';
  end if;
  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into private.staff_invites (token_hash, note, created_by)
    values (encode(extensions.digest(v_token, 'sha256'), 'hex'),
            nullif(btrim(p_note), ''), auth.uid());
  return v_token;
end;
$$;

-- Para la página de la invitación: si el enlace sirve.
create or replace function public.staff_invite_info(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = private, public
as $$
declare
  v private.staff_invites;
begin
  v := private.invite_for(p_token);
  if v.id is null then
    return jsonb_build_object('valid', false);
  end if;
  return jsonb_build_object('valid', true, 'role', v.role, 'expires_at', v.expires_at);
end;
$$;

-- Al crear la cuenta: deja la invitación reservada para ese correo.
create or replace function public.claim_staff_invite(p_token text, p_email text)
returns boolean
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v private.staff_invites;
begin
  v := private.invite_for(p_token);
  if v.id is null or p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return false;
  end if;
  update private.staff_invites
    set claimed_email = lower(btrim(p_email)), claimed_at = now()
    where id = v.id;
  return true;
end;
$$;

-- Al entrar por primera vez (correo ya confirmado): activa la invitación.
create or replace function public.activate_staff_invite()
returns public.app_role
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_email text;
  v_name text;
  v private.staff_invites;
begin
  if auth.uid() is null then
    return null;
  end if;
  select lower(email), raw_user_meta_data ->> 'full_name'
    into v_email, v_name
    from auth.users
    where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then
    return null;
  end if;
  select * into v from private.staff_invites
    where claimed_email = v_email and used_at is null and revoked_at is null
      and expires_at > now()
    order by claimed_at desc
    limit 1;
  if v.id is null then
    return null;
  end if;
  insert into public.profiles (user_id, full_name, role, active)
    values (auth.uid(), left(nullif(btrim(v_name), ''), 120), v.role, true)
    on conflict (user_id) do update
      set role = excluded.role, active = true,
          full_name = coalesce(public.profiles.full_name, excluded.full_name);
  update private.staff_invites set used_by = auth.uid(), used_at = now()
    where id = v.id;
  return v.role;
end;
$$;

-- Invitaciones recientes (solo superadmin).
create or replace function public.list_staff_invites()
returns table (
  id uuid, note text, created_at timestamptz, expires_at timestamptz,
  claimed_email text, used_at timestamptz, revoked_at timestamptz
)
language plpgsql
stable
security definer
set search_path = private, public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'solo el superadmin' using errcode = '42501';
  end if;
  return query
    select i.id, i.note, i.created_at, i.expires_at, i.claimed_email, i.used_at, i.revoked_at
    from private.staff_invites i
    order by i.created_at desc
    limit 20;
end;
$$;

create or replace function public.revoke_staff_invite(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = private, public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'solo el superadmin' using errcode = '42501';
  end if;
  update private.staff_invites set revoked_at = now()
    where id = p_id and used_at is null and revoked_at is null;
end;
$$;

-- Equipo: quién tiene acceso al panel (con su correo). Lo ve el personal.
create or replace function public.team_members()
returns table (
  user_id uuid, email text, full_name text, role public.app_role,
  active boolean, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'solo el personal' using errcode = '42501';
  end if;
  return query
    select p.user_id, u.email::text, p.full_name, p.role, p.active, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.user_id
    where p.role <> 'org_manager'
    order by (p.role = 'superadmin') desc, p.active desc, p.created_at;
end;
$$;

-- Activar o quitar el acceso de alguien (solo superadmin, nunca a sí mismo).
create or replace function public.set_member_active(p_user uuid, p_active boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'solo el superadmin' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'no puedes quitarte el acceso a ti mismo' using errcode = '22023';
  end if;
  update public.profiles set active = p_active
    where user_id = p_user and role <> 'superadmin';
end;
$$;

revoke all on function public.create_staff_invite(text) from public, anon;
revoke all on function public.activate_staff_invite() from public, anon;
revoke all on function public.list_staff_invites() from public, anon;
revoke all on function public.revoke_staff_invite(uuid) from public, anon;
revoke all on function public.team_members() from public, anon;
revoke all on function public.set_member_active(uuid, boolean) from public, anon;
grant execute on function public.create_staff_invite(text) to authenticated;
grant execute on function public.activate_staff_invite() to authenticated;
grant execute on function public.list_staff_invites() to authenticated;
grant execute on function public.revoke_staff_invite(uuid) to authenticated;
grant execute on function public.team_members() to authenticated;
grant execute on function public.set_member_active(uuid, boolean) to authenticated;
grant execute on function public.staff_invite_info(text) to anon, authenticated;
grant execute on function public.claim_staff_invite(text, text) to anon, authenticated;
