-- Extensiones. Sin PostGIS a propósito: Papudo es una sola comuna, las
-- distancias las calcula el motor de itinerarios (Haversine) y las
-- coordenadas son lat/lng simples. Ver docs/DATA-MODEL.md.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
