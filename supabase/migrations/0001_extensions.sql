-- Esquema propio de Papudo en tu mano. Todas las tablas viven en `papudo`
-- (no en `public`) para poder compartir un proyecto de Supabase con otro
-- sitio sin que se mezclen las tablas. En Supabase hay que exponer el esquema:
-- Project Settings → API → Exposed schemas → agregar `papudo`.
create schema if not exists papudo;
grant usage on schema papudo to anon, authenticated, service_role;
-- Igual que Supabase hace con `public`: privilegios amplios; la RLS es la barrera.
alter default privileges in schema papudo grant all on tables to anon, authenticated, service_role;
alter default privileges in schema papudo grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema papudo grant execute on functions to anon, authenticated, service_role;

-- Extensiones. Sin PostGIS a propósito: Papudo es una sola comuna, las
-- distancias las calcula el motor de itinerarios (Haversine) y las
-- coordenadas son lat/lng simples. Ver docs/DATA-MODEL.md.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
