-- Quita de la base las fichas y eventos de EJEMPLO (ficticios, «demo-…»).
-- Desde noviembre de 2026 la guía tiene los locales y servicios reales de la
-- Guía Turística Papudo 2026, y supabase/content.sql ya no los carga.
--
-- Correr a mano en el SQL Editor de Supabase (no es una migración). Solo toca
-- filas marcadas como ejemplo (is_demo) cuyo slug empieza con «demo-»; sus
-- traducciones, horarios, fotos y comentarios se borran en cascada. Nada real
-- se toca. Si algo no calza, se cancela entero y no cambia nada.
begin;

do $$
declare
  n_places int;
  n_events int;
begin
  select count(*) into n_places from public.places where is_demo and slug like 'demo-%';
  select count(*) into n_events from public.events where is_demo and slug like 'demo-%';
  raise notice 'Fichas de ejemplo: %, eventos de ejemplo: %', n_places, n_events;

  -- Una ficha de ejemplo nunca debería ser parada de una ruta.
  if exists (
    select 1 from public.route_stops s join public.places p on p.id = s.place_id
    where p.is_demo
  ) then
    raise exception 'Una ficha de ejemplo es parada de una ruta: no se borra nada.';
  end if;
  -- Ninguna ficha real puede estar marcada como ejemplo.
  if exists (select 1 from public.places where is_demo and slug not like 'demo-%')
     or exists (select 1 from public.events where is_demo and slug not like 'demo-%') then
    raise exception 'Hay contenido real marcado como ejemplo: revisar antes de borrar.';
  end if;
end;
$$;

delete from public.places where is_demo and slug like 'demo-%';
delete from public.events where is_demo and slug like 'demo-%';

commit;

-- Comprobación (debe dar 0 y 0):
-- select (select count(*) from public.places where is_demo) as fichas_ejemplo,
--        (select count(*) from public.events where is_demo) as eventos_ejemplo;
