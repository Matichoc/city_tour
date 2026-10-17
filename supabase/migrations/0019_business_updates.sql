-- Actualización de datos de los comercios: el plan pide que cada local
-- confirme o actualice su información al menos cada 6 meses. La fecha la
-- registra el personal en /admin/comercios; la ficha pública la muestra y
-- avisa si quedó vieja. content.sql no toca esta columna.
alter table public.places
  add column info_updated_at timestamptz check (info_updated_at <= now() + interval '1 day');

comment on column public.places.info_updated_at is
  'Última vez que el comercio confirmó o actualizó sus datos (horario, contacto, servicios).';

create index places_info_updated_idx on public.places (info_updated_at) where is_business;
