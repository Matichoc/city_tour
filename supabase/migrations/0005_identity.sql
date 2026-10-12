-- Identidad y roles del personal. Los visitantes NO tienen cuenta.
-- No hay trigger que cree perfiles solos: un administrador da de alta al
-- personal explícitamente (nadie se asigna un rol).

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- security definer: lee `profiles` sin depender de sus propias políticas RLS.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid() and active
$$;

create or replace function public.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = any (roles), false)
$$;

-- Personal municipal con acceso de lectura a todo (incluye borradores).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin', 'editor', 'verifier')
$$;

grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.has_role(public.app_role[]) to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
