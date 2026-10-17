-- SE EJECUTÓ UNA VEZ, a mano, el 2026-10-16 en el proyecto Supabase de
-- DESARROLLO (`city_tour`), antes de aplicar las migraciones 0001–0015.
-- No es una migración: no corre en `pnpm test:db` ni en proyectos nuevos.
-- Se guarda como registro de lo que se hizo (docs/SETUP-SUPABASE.md, sección C).
--
-- Ese proyecto traía el esquema de la app anterior (communes, admin_users,
-- sponsors, place_likes, PostGIS...) con tablas de igual nombre que las nuevas.
-- Este script lo mueve completo al esquema `legacy` sin borrar nada y deja una
-- lista de lo movido en `legacy._archivo`.

-- Paso 0: archivar el esquema antiguo en `legacy` sin borrar nada.
-- Mueve a `legacy` todo lo de `public` que no pertenece a una extensión
-- (tablas, vistas, secuencias, funciones, tipos). Los datos quedan intactos y
-- dejan de estar expuestos por la API (que solo publica `public`).
create schema if not exists legacy;

-- Registro de lo movido y de los triggers externos que se desactivan.
create table if not exists legacy._archivo (
  objeto text not null,
  detalle text,
  archivado_en timestamptz not null default now()
);

do $$
declare
  r record;
begin
  -- pg_trgm: el esquema nuevo la espera en `extensions`.
  if exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace
             where e.extname = 'pg_trgm' and n.nspname = 'public') then
    create schema if not exists extensions;
    alter extension pg_trgm set schema extensions;
    insert into legacy._archivo values ('extension pg_trgm', 'public -> extensions');
  end if;

  -- Triggers en auth.users y storage.objects que llaman funciones de public:
  -- se guardan y se eliminan (al mover la función dejarían de funcionar).
  for r in
    select t.tgname, c.relname, n.nspname, pg_get_triggerdef(t.oid) as def
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    where not t.tgisinternal
      and n.nspname in ('auth', 'storage')
      and p.pronamespace = 'public'::regnamespace
  loop
    insert into legacy._archivo values ('trigger ' || r.nspname || '.' || r.relname || '.' || r.tgname, r.def);
    execute format('drop trigger %I on %I.%I', r.tgname, r.nspname, r.relname);
  end loop;

  -- Políticas de storage.objects que usan funciones de public: idem.
  for r in
    select policyname, qual, with_check from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ~ 'public\.|is_admin' or coalesce(with_check, '') ~ 'public\.|is_admin'
           or policyname like 'place_images_%')
  loop
    insert into legacy._archivo values ('policy storage.objects.' || r.policyname,
      'using: ' || coalesce(r.qual, '-') || ' | check: ' || coalesce(r.with_check, '-'));
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;

  -- Tablas, vistas y vistas materializadas (las secuencias propias van con su tabla).
  for r in
    select c.relname, c.relkind from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and not exists (select 1 from pg_depend d where d.classid = 'pg_class'::regclass
                      and d.objid = c.oid and d.deptype = 'e')
  loop
    execute format(case r.relkind when 'v' then 'alter view public.%I set schema legacy'
                                  when 'm' then 'alter materialized view public.%I set schema legacy'
                                  when 'f' then 'alter foreign table public.%I set schema legacy'
                                  else 'alter table public.%I set schema legacy' end, r.relname);
    insert into legacy._archivo values ('relación public.' || r.relname, 'movida a legacy');
  end loop;

  -- Secuencias sueltas.
  for r in
    select c.relname from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'S'
      and not exists (select 1 from pg_depend d where d.classid = 'pg_class'::regclass
                      and d.objid = c.oid and d.deptype in ('e', 'a', 'i'))
  loop
    execute format('alter sequence public.%I set schema legacy', r.relname);
    insert into legacy._archivo values ('secuencia public.' || r.relname, 'movida a legacy');
  end loop;

  -- Funciones y procedimientos.
  for r in
    select p.oid::regprocedure::text as sig, p.prokind from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass
                      and d.objid = p.oid and d.deptype = 'e')
  loop
    execute format(case r.prokind when 'p' then 'alter procedure %s set schema legacy'
                                  when 'a' then 'alter aggregate %s set schema legacy'
                                  else 'alter function %s set schema legacy' end, r.sig);
    insert into legacy._archivo values ('función ' || r.sig, 'movida a legacy');
  end loop;

  -- Tipos (enums, dominios, compuestos sueltos).
  for r in
    select t.typname from pg_type t
    where t.typnamespace = 'public'::regnamespace
      and t.typtype in ('e', 'd', 'c', 'r')
      and (t.typtype <> 'c' or (select relkind from pg_class where oid = t.typrelid) = 'c')
      and not exists (select 1 from pg_depend d where d.classid = 'pg_type'::regclass
                      and d.objid = t.oid and d.deptype = 'e')
  loop
    execute format('alter type public.%I set schema legacy', r.typname);
    insert into legacy._archivo values ('tipo public.' || r.typname, 'movido a legacy');
  end loop;
end
$$;

-- El archivo no se expone por la API.
revoke all on schema legacy from anon, authenticated;
