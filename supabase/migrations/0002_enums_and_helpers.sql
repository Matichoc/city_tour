-- Tipos enumerados y funciones genéricas de trigger.

create type public.locale as enum ('es', 'en');
create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.verification_status as enum ('pending', 'verified', 'outdated');
-- Estado de una traducción NO española. El español es la fuente y no tiene estado.
create type public.translation_status as enum ('draft', 'needs_review', 'reviewed');
create type public.org_type as enum (
  'municipality', 'chamber', 'business', 'operator', 'association', 'public_service'
);
create type public.app_role as enum ('admin', 'editor', 'verifier', 'org_manager');
create type public.difficulty_level as enum ('low', 'medium', 'high');
create type public.transport_mode as enum ('walk', 'bike', 'car', 'mixed');
create type public.setting_kind as enum ('indoor', 'outdoor', 'both');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Guarda cuándo cambió por última vez el estado de publicación.
create or replace function public.touch_status_changed_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.publication_status is distinct from old.publication_status then
    new.status_changed_at = now();
    if new.publication_status = 'published' and new.published_at is null then
      new.published_at = now();
    end if;
  end if;
  return new;
end;
$$;
