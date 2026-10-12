-- Vistas de reporte para la municipalidad. security_invoker: respetan la RLS
-- de quien consulta; las de gestión devuelven filas solo al personal.

create view public.v_report_catalog
with (security_invoker = true) as
select
  c.slug as category,
  count(p.id) filter (where public.is_staff()) as total,
  count(p.id) filter (where p.publication_status = 'published' and public.is_staff()) as published,
  count(p.id) filter (where p.verification_status = 'verified' and public.is_staff()) as verified
from public.categories c
left join public.places p on p.category_id = c.id
group by c.slug;

-- Registros sin verificar o con verificación vieja (> 90 días).
create view public.v_report_stale
with (security_invoker = true) as
select 'place'::text as entity, id, slug, last_verified_at, verification_status
  from public.places
  where public.is_staff() and publication_status <> 'archived'
    and (last_verified_at is null or last_verified_at < now() - interval '90 days')
union all
select 'organization', id, slug, last_verified_at, verification_status
  from public.organizations
  where public.is_staff() and publication_status <> 'archived'
    and (last_verified_at is null or last_verified_at < now() - interval '90 days')
union all
select 'route', id, slug, last_verified_at, verification_status
  from public.routes
  where public.is_staff() and publication_status <> 'archived'
    and (last_verified_at is null or last_verified_at < now() - interval '90 days')
union all
select 'event', id, slug, last_verified_at, verification_status
  from public.events
  where public.is_staff() and publication_status <> 'archived'
    and (last_verified_at is null or last_verified_at < now() - interval '90 days');

-- Estado de traducciones al inglés (para el panel de traducciones).
create view public.v_report_translations
with (security_invoker = true) as
select 'place'::text as entity, p.id, p.slug,
       coalesce(t.translation_status::text, 'spanish_only') as english_status
from public.places p
left join public.place_translations t on t.place_id = p.id and t.locale = 'en'
where public.is_staff()
union all
select 'route', r.id, r.slug, coalesce(t.translation_status::text, 'spanish_only')
from public.routes r
left join public.route_translations t on t.route_id = r.id and t.locale = 'en'
where public.is_staff();
