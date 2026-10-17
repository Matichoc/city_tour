-- Datos de comercios que entrega el formulario «Suma tu comercio»:
-- enlace de Google Maps y horarios por temporada que se repiten cada año.

-- 1) Enlace de Google Maps que comparte el local (para «Cómo llegar» cuando
--    todavía no hay coordenada verificada).
alter table public.places
  add column maps_url text check (maps_url ~ '^https://');

-- 2) Horarios por temporada anual: «enero a febrero, todos los días» o
--    «marzo a diciembre, fines de semana y festivos». from_month..to_month
--    puede dar la vuelta al año (p. ej. 12..2). day_of_week: 0 = domingo.
alter table public.place_hours
  add column from_month smallint check (from_month between 1 and 12),
  add column to_month smallint check (to_month between 1 and 12),
  add column holidays boolean not null default false,
  add constraint place_hours_months_pair check ((from_month is null) = (to_month is null));

comment on column public.place_hours.day_of_week is '0 = domingo … 6 = sábado';
comment on column public.place_hours.holidays is 'También abre los días festivos con este horario';
