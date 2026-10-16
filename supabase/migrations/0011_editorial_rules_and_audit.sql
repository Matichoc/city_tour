-- Reglas editoriales (a nivel de base de datos) y bitácora de auditoría.

-- 1) Solo un administrador publica/archiva o cambia la verificación a mano.
--    La verificación pasa por verify_entity(), que levanta `app.bypass_guard`.
--    Sin sesión de usuario (migraciones, seed, service_role) no se aplica.
create or replace function papudo.guard_editorial_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null
     or coalesce(current_setting('app.bypass_guard', true), '') = 'on'
     or papudo.has_role('admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.publication_status <> 'draft' or new.verification_status <> 'pending' then
      raise exception 'solo un administrador puede crear contenido publicado o verificado'
        using errcode = '42501';
    end if;
  elsif new.publication_status is distinct from old.publication_status then
    raise exception 'solo un administrador puede publicar o archivar'
      using errcode = '42501';
  elsif new.verification_status is distinct from old.verification_status
     or new.last_verified_at is distinct from old.last_verified_at then
    raise exception 'la verificación se cambia con verify_entity()'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- 2) El español es obligatorio: no se publica sin ficha en español.
create or replace function papudo.require_spanish_to_publish()
returns trigger
language plpgsql
as $$
declare
  v_tr_table text := tg_argv[0];
  v_fk text := tg_argv[1];
  v_ok boolean;
begin
  if new.publication_status = 'published'
     and (tg_op = 'INSERT' or old.publication_status is distinct from 'published') then
    execute format(
      'select exists (select 1 from papudo.%I where %I = $1 and locale = ''es'' and length(trim(name)) > 0)',
      v_tr_table, v_fk) into v_ok using new.id;
    if not v_ok then
      raise exception 'no se puede publicar sin traducción en español' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

-- 3) Si cambia el texto en español, las traducciones inglesas pasan a
--    "requiere revisión" automáticamente.
create or replace function papudo.flag_translations_for_review()
returns trigger
language plpgsql
as $$
begin
  execute format(
    'update papudo.%I set translation_status = ''needs_review''
       where %I = $1 and locale = ''en'' and translation_status is distinct from ''needs_review''',
    tg_table_name, tg_argv[0])
    using (to_jsonb(new) ->> tg_argv[0])::uuid;
  return new;
end;
$$;

do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('places', 'place_translations', 'place_id'),
      ('routes', 'route_translations', 'route_id'),
      ('organizations', 'organization_translations', 'organization_id'),
      ('events', 'event_translations', 'event_id')
    ) as t(parent, tr, fk)
  loop
    execute format(
      'create trigger %1$s_guard before insert or update on papudo.%1$s
         for each row execute function papudo.guard_editorial_fields()', r.parent);
    execute format(
      'create trigger %1$s_need_es before insert or update on papudo.%1$s
         for each row execute function papudo.require_spanish_to_publish(%2$L, %3$L)',
      r.parent, r.tr, r.fk);
    execute format(
      'create trigger %1$s_flag after update on papudo.%1$s
         for each row
         when (new.locale = ''es'' and
               (to_jsonb(old) - ''updated_at'') is distinct from (to_jsonb(new) - ''updated_at''))
         execute function papudo.flag_translations_for_review(%2$L)', r.tr, r.fk);
    execute format(
      'create trigger %1$s_touch before update on papudo.%1$s
         for each row execute function papudo.touch_updated_at()', r.tr);
  end loop;
end;
$$;

-- Triggers de updated_at para las traducciones restantes.
create trigger route_stop_translations_touch before update on papudo.route_stop_translations
  for each row execute function papudo.touch_updated_at();
create trigger locality_translations_touch before update on papudo.locality_translations
  for each row execute function papudo.touch_updated_at();
create trigger category_translations_touch before update on papudo.category_translations
  for each row execute function papudo.touch_updated_at();
create trigger tag_translations_touch before update on papudo.tag_translations
  for each row execute function papudo.touch_updated_at();
create trigger municipality_translations_touch before update on papudo.municipality_translations
  for each row execute function papudo.touch_updated_at();

-- 4) Bitácora de cambios editoriales.
create table papudo.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_key text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_row_idx on papudo.audit_log (table_name, row_key, created_at desc);

create or replace function papudo.audit_row()
returns trigger
language plpgsql
security definer
set search_path = papudo
as $$
declare
  j_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  j_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  j jsonb := coalesce(j_new, j_old);
  v_diff jsonb;
begin
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(n.key, jsonb_build_object('old', j_old -> n.key, 'new', n.value)), '{}')
      into v_diff
      from jsonb_each(j_new) n
      where n.key <> 'updated_at' and (j_old -> n.key) is distinct from n.value;
    if v_diff = '{}'::jsonb then
      return null;
    end if;
  else
    v_diff := j;
  end if;

  insert into papudo.audit_log (table_name, row_key, action, changed_by, diff)
  values (
    tg_table_name,
    coalesce(j ->> 'id', concat_ws(':',
      j ->> 'place_id', j ->> 'route_id', j ->> 'organization_id', j ->> 'event_id',
      j ->> 'route_stop_id', j ->> 'locale')),
    tg_op, auth.uid(), v_diff);
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'places', 'place_translations', 'place_hours', 'place_images', 'place_tags',
    'lodging_details', 'dining_details',
    'routes', 'route_translations', 'route_stops', 'route_stop_translations',
    'organizations', 'organization_translations', 'chamber_memberships',
    'events', 'event_translations', 'sources', 'profiles',
    'categories', 'tags', 'localities'
  ]
  loop
    execute format(
      'create trigger %1$s_audit after insert or update or delete on papudo.%1$s
         for each row execute function papudo.audit_row()', t);
  end loop;
end;
$$;
