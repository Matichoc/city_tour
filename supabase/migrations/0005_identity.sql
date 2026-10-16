-- Identidad y roles del personal. Los visitantes NO tienen cuenta.
-- No hay trigger que cree perfiles solos: un administrador da de alta al
-- personal explícitamente (nadie se asigna un rol).

create table papudo.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role papudo.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on papudo.profiles
  for each row execute function papudo.touch_updated_at();

-- security definer: lee `profiles` sin depender de sus propias políticas RLS.
create or replace function papudo.current_app_role()
returns papudo.app_role
language sql
stable
security definer
set search_path = papudo
as $$
  select role from papudo.profiles where user_id = auth.uid() and active
$$;

create or replace function papudo.has_role(variadic roles papudo.app_role[])
returns boolean
language sql
stable
security definer
set search_path = papudo
as $$
  select coalesce(papudo.current_app_role() = any (roles), false)
$$;

-- Personal municipal con acceso de lectura a todo (incluye borradores).
create or replace function papudo.is_staff()
returns boolean
language sql
stable
security definer
set search_path = papudo
as $$
  select papudo.has_role('admin', 'editor', 'verifier')
$$;

grant execute on function papudo.current_app_role() to anon, authenticated;
grant execute on function papudo.has_role(papudo.app_role[]) to anon, authenticated;
grant execute on function papudo.is_staff() to anon, authenticated;
