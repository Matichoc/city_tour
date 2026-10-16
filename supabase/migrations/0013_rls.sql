-- Políticas RLS. Reglas:
--  * anónimo: solo lee contenido publicado (y los hijos de lo publicado).
--  * verificador: lee todo; cambia verificación solo con verify_entity().
--  * editor: crea/edita contenido como borrador (no publica ni archiva).
--  * administrador: todo.
--  * visitantes no tienen cuenta; itinerarios solo por función con token.

do $$
declare
  t text;
begin
  foreach t in array array[
    'municipality', 'municipality_translations', 'localities', 'locality_translations',
    'categories', 'category_translations', 'tags', 'tag_translations',
    'profiles', 'organizations', 'organization_translations', 'chamber_memberships',
    'organization_members', 'places', 'place_translations', 'place_hours', 'place_images',
    'place_tags', 'lodging_details', 'dining_details', 'routes', 'route_translations',
    'route_stops', 'route_stop_translations', 'events', 'event_translations',
    'sources', 'verification_logs', 'verification_tasks', 'audit_log',
    'itineraries', 'itinerary_stops', 'analytics_events'
  ]
  loop
    execute format('alter table papudo.%I enable row level security', t);
  end loop;
end;
$$;

-- Catálogo y geografía: lectura pública; escritura solo administrador.
do $$
declare
  t text;
begin
  foreach t in array array[
    'municipality', 'municipality_translations', 'localities', 'locality_translations',
    'categories', 'category_translations', 'tags', 'tag_translations'
  ]
  loop
    execute format('create policy %1$s_read on papudo.%1$s for select using (true)', t);
    execute format(
      'create policy %1$s_admin_write on papudo.%1$s for all
         using (papudo.has_role(''admin'')) with check (papudo.has_role(''admin''))', t);
  end loop;
end;
$$;

-- Perfiles: cada persona ve el suyo; el administrador gestiona.
create policy profiles_read_own on papudo.profiles for select
  using (user_id = auth.uid() or papudo.has_role('admin'));
create policy profiles_admin_write on papudo.profiles for all
  using (papudo.has_role('admin')) with check (papudo.has_role('admin'));

create policy organization_members_read on papudo.organization_members for select
  using (user_id = auth.uid() or papudo.has_role('admin'));
create policy organization_members_admin_write on papudo.organization_members for all
  using (papudo.has_role('admin')) with check (papudo.has_role('admin'));

-- Entidades principales: lectura de lo publicado; staff lee todo; admin/editor escriben.
do $$
declare
  t text;
begin
  foreach t in array array['organizations', 'places', 'routes', 'events']
  loop
    execute format(
      'create policy %1$s_read on papudo.%1$s for select
         using (publication_status = ''published'' or papudo.is_staff())', t);
    execute format(
      'create policy %1$s_write on papudo.%1$s for all
         using (papudo.has_role(''admin'', ''editor''))
         with check (papudo.has_role(''admin'', ''editor''))', t);
  end loop;
end;
$$;

-- Tablas hijas: visibles si el padre está publicado (o si eres staff).
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('organization_translations', 'organizations', 'organization_id'),
      ('chamber_memberships', 'organizations', 'member_id'),
      ('place_translations', 'places', 'place_id'),
      ('place_hours', 'places', 'place_id'),
      ('place_images', 'places', 'place_id'),
      ('place_tags', 'places', 'place_id'),
      ('lodging_details', 'places', 'place_id'),
      ('dining_details', 'places', 'place_id'),
      ('route_translations', 'routes', 'route_id'),
      ('event_translations', 'events', 'event_id'),
      ('sources', 'places', 'place_id')
    ) as v(child, parent, fk)
  loop
    execute format(
      'create policy %1$s_read on papudo.%1$s for select
         using (papudo.is_staff() or exists (
           select 1 from papudo.%2$I p
           where p.id = %3$I and p.publication_status = ''published''))',
      r.child, r.parent, r.fk);
    execute format(
      'create policy %1$s_write on papudo.%1$s for all
         using (papudo.has_role(''admin'', ''editor''))
         with check (papudo.has_role(''admin'', ''editor''))', r.child);
  end loop;
end;
$$;

-- `sources` también cuelga de rutas, organizaciones y eventos: política extra de lectura.
create policy sources_read_other on papudo.sources for select using (
  exists (select 1 from papudo.routes r where r.id = route_id and r.publication_status = 'published')
  or exists (select 1 from papudo.organizations o where o.id = organization_id and o.publication_status = 'published')
  or exists (select 1 from papudo.events e where e.id = event_id and e.publication_status = 'published')
);

create policy route_stops_read on papudo.route_stops for select using (
  papudo.is_staff() or exists (
    select 1 from papudo.routes r where r.id = route_id and r.publication_status = 'published')
);
create policy route_stops_write on papudo.route_stops for all
  using (papudo.has_role('admin', 'editor')) with check (papudo.has_role('admin', 'editor'));

create policy route_stop_translations_read on papudo.route_stop_translations for select using (
  papudo.is_staff() or exists (
    select 1 from papudo.route_stops s join papudo.routes r on r.id = s.route_id
    where s.id = route_stop_id and r.publication_status = 'published')
);
create policy route_stop_translations_write on papudo.route_stop_translations for all
  using (papudo.has_role('admin', 'editor')) with check (papudo.has_role('admin', 'editor'));

-- Verificación: solo staff. verification_logs se escribe solo con verify_entity().
create policy verification_logs_read on papudo.verification_logs for select using (papudo.is_staff());
create policy verification_tasks_read on papudo.verification_tasks for select using (papudo.is_staff());
create policy verification_tasks_insert on papudo.verification_tasks for insert
  with check (papudo.is_staff());
create policy verification_tasks_update on papudo.verification_tasks for update
  using (papudo.has_role('admin', 'verifier')) with check (papudo.has_role('admin', 'verifier'));

-- Bitácora: solo lectura para staff; la escribe el trigger.
create policy audit_log_read on papudo.audit_log for select using (papudo.is_staff());

-- Visitantes: sin acceso directo a itinerarios (usan get_itinerary_by_token y
-- el servidor con service_role). Analítica: cualquiera inserta, staff lee.
create policy analytics_events_insert on papudo.analytics_events for insert with check (true);
create policy analytics_events_read on papudo.analytics_events for select using (papudo.is_staff());

-- Defensa en profundidad: aunque haya privilegios por defecto, estas tablas no
-- se modifican a mano desde el cliente.
revoke insert, update, delete on papudo.audit_log from anon, authenticated;
revoke insert, update, delete on papudo.verification_logs from anon, authenticated;
revoke all on papudo.itineraries, papudo.itinerary_stops from anon, authenticated;
revoke update, delete on papudo.analytics_events from anon, authenticated;
