-- Alinea el esquema con el contenido que ya publica el sitio (src/content):
-- portugués, eventos recurrentes, fichas de ejemplo, fuentes de localidades,
-- portada de rutas y las categorías del PLADETUR. Ver docs/DATA-MODEL.md.

-- 1) Portugués como tercer idioma (PLADETUR pp. 150 y 174). Sigue la misma
--    regla que el inglés: opcional y con estado de traducción.
alter type public.locale add value if not exists 'pt';

-- Si cambia el español, TODAS las traducciones pasan a "requiere revisión".
create or replace function public.flag_translations_for_review()
returns trigger
language plpgsql
as $$
begin
  execute format(
    'update public.%I set translation_status = ''needs_review''
       where %I = $1 and locale <> ''es'' and translation_status is distinct from ''needs_review''',
    tg_table_name, tg_argv[0])
    using (to_jsonb(new) ->> tg_argv[0])::uuid;
  return new;
end;
$$;

-- 2) Categorías = productos del PLADETUR. Minutos de visita ESTIMADOS para el
--    motor de recorridos. Las categorías del esquema anterior que no usa
--    ningún lugar se eliminan (los slugs viejos redirigen en la app).
alter table public.categories
  add column default_visit_minutes integer not null default 60
    check (default_visit_minutes >= 0);

delete from public.categories c
where c.parent_id is not null
  and c.slug in ('hoteles', 'cabanas', 'hostales', 'camping')
  and not exists (select 1 from public.places p where p.category_id = c.id);

delete from public.categories c
where c.slug in ('playas', 'naturaleza', 'actividades', 'comercio-local', 'miradores',
                 'ferias-mercados', 'servicios')
  and not exists (select 1 from public.places p where p.category_id = c.id)
  and not exists (select 1 from public.categories s where s.parent_id = c.id);

-- 3) Lugares: ficha de EJEMPLO (ficticia, se rotula y no se indexa) y negocio local.
alter table public.places
  add column is_demo boolean not null default false,
  add column is_business boolean not null default false,
  -- Orden editorial en listados (portada, explorador).
  add column sort_order integer not null default 0;

-- 4) Eventos recurrentes: no se publica la fecha de una edición concreta, solo
--    el mes (y el día si es fijo) o la temporada. `starts_at` queda para
--    ediciones con fecha confirmada.
alter table public.events
  alter column starts_at drop not null,
  add column category_id uuid references public.categories (id) on delete restrict,
  add column locality_id uuid references public.localities (id) on delete set null,
  add column recurrence_month smallint check (recurrence_month between 1 and 12),
  add column recurrence_day smallint check (recurrence_day between 1 and 31),
  add column season text check (season in ('summer')),
  add column featured boolean not null default false,
  add column is_demo boolean not null default false,
  -- Clave de una ilustración del repo (src/content/images.ts).
  add column illustration text,
  add column sort_order integer not null default 0,
  add constraint events_day_needs_month check (recurrence_day is null or recurrence_month is not null);

create index events_category_idx on public.events (category_id);
create index events_locality_idx on public.events (locality_id);

-- 5) Localidades: fuente del resumen.
alter table public.localities
  add column source_url text,
  add column source_label text;

-- 6) Fuentes en orden (la primera es la principal).
alter table public.sources
  add column sort_order smallint not null default 0;

-- 7) Rutas: orden en listados y texto alternativo de la portada, por idioma.
alter table public.routes
  add column sort_order integer not null default 0;
alter table public.route_translations
  add column cover_alt text;
