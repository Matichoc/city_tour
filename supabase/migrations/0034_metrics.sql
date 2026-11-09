-- Métricas propias, anónimas y en conteos diarios (panel /admin/metricas).
--
-- El sitio cuenta interacciones (vistas de fichas, «Cómo llegar», agregar al
-- viaje, visitas por QR...) SIN cookies, SIN IP y SIN identificar personas: cada
-- fila es un contador por día, evento, ficha, detalle e idioma.
--
-- Solo nuestro servidor puede sumar: record_metrics exige una prueba firmada
-- (la misma puerta HMAC de los comentarios, migración 0027, con la acción
-- «metric»), así que nadie puede inflar los números llamando a la base con la
-- clave pública. Hay topes por remitente (huella anónima que se borra a las
-- pocas horas) y por día en todo el sitio. Diseño: docs/DECISIONES.md.
--
-- Usa el secreto ya cargado para los comentarios: no requiere pasos a mano.

create table public.metric_daily (
  day date not null,
  name text not null check (name in (
    'place_view', 'route_view', 'event_view', 'search_empty',
    'add_to_trip', 'add_route', 'navigate_click', 'contact_click',
    'cta_click', 'share', 'qr_visit', 'save_place', 'live_start',
    'camera_start', 'listen_play'
  )),
  -- Ficha (slug) o, en search_empty, lo buscado sin resultados.
  subject text not null default '' check (length(subject) <= 80),
  -- Detalle: tipo de botón, origen del QR, vía de compartir...
  detail text not null default '' check (detail ~ '^[a-z0-9-]{0,60}$'),
  locale text not null default '' check (locale in ('', 'es', 'en', 'pt')),
  n integer not null default 0 check (n >= 0),
  primary key (day, name, subject, detail, locale)
);
create index metric_daily_name_idx on public.metric_daily (name, day);

alter table public.metric_daily enable row level security;
revoke all on public.metric_daily from public, anon, authenticated;
grant select on public.metric_daily to authenticated;
create policy metric_daily_read on public.metric_daily
  for select using (public.is_staff());

-- Huellas anónimas para el tope por hora; se borran solas a las 3 horas.
create table private.metric_senders (
  sender text not null,
  hour timestamptz not null,
  n integer not null default 0,
  primary key (sender, hour)
);
alter table private.metric_senders enable row level security;
revoke all on private.metric_senders from public, anon, authenticated;

insert into private.abuse_limits (key, value, note) values
  ('metric_batch', 20, 'eventos por envío de métricas'),
  ('metric_sender_hour', 300, 'eventos de métricas por hora por huella'),
  ('metric_global_day', 50000, 'eventos de métricas por día en todo el sitio')
on conflict (key) do nothing;

-- Resumen del envío: debe calcularse igual en el servidor
-- (src/lib/metrics.ts, metricsBind): sha256 hex del texto JSON tal cual.
create or replace function private.metric_bind(p_payload text)
returns text
language sql
immutable
set search_path = private, public, extensions
as $$
  select encode(digest(convert_to(p_payload, 'UTF8'), 'sha256'), 'hex')
$$;

-- Suma un envío de eventos. Devuelve cuántos se contaron (los que no cumplen
-- el formato se ignoran en silencio). Falla con 28000 si la prueba no es válida
-- y con P0001 «rate» si se pasa de un tope.
create or replace function public.record_metrics(
  p_payload text,
  p_locale text,
  p_sender text,
  p_proof text
)
returns integer
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_events jsonb;
  v_count integer;
  v_hour timestamptz := date_trunc('hour', now());
  v_day date := (now() at time zone 'America/Santiago')::date;
  v_locale text := coalesce(p_locale, '');
  v_used bigint;
  v_e jsonb;
  v_name text;
  v_subject text;
  v_detail text;
  v_ok integer := 0;
begin
  if p_sender is null or length(p_sender) < 32 or length(p_sender) > 128
     or p_payload is null or length(p_payload) > 8000 then
    raise exception 'invalid proof' using errcode = '28000';
  end if;
  perform private.verify_proof(p_proof, 'metric', p_sender, private.metric_bind(p_payload));

  begin
    v_events := p_payload::jsonb;
  exception when others then
    return 0;
  end;
  if jsonb_typeof(v_events) <> 'array' then
    return 0;
  end if;
  v_count := jsonb_array_length(v_events);
  if v_count = 0 then
    return 0;
  end if;
  if v_count > private.limit_of('metric_batch') then
    raise exception 'rate' using errcode = 'P0001';
  end if;
  if v_locale not in ('', 'es', 'en', 'pt') then
    v_locale := '';
  end if;

  -- Tope por huella (por hora) y limpieza oportunista.
  delete from private.metric_senders where hour < now() - interval '3 hours';
  insert into private.metric_senders (sender, hour, n)
    values (p_sender, v_hour, v_count)
    on conflict (sender, hour) do update set n = private.metric_senders.n + excluded.n
    returning n into v_used;
  if v_used > private.limit_of('metric_sender_hour') then
    raise exception 'rate' using errcode = 'P0001';
  end if;

  -- Tope global del día.
  select coalesce(sum(n), 0) into v_used from public.metric_daily where day = v_day;
  if v_used + v_count > private.limit_of('metric_global_day') then
    raise exception 'rate' using errcode = 'P0001';
  end if;

  for v_e in select * from jsonb_array_elements(v_events) loop
    if jsonb_typeof(v_e) <> 'object' then
      continue;
    end if;
    v_name := v_e ->> 'name';
    v_subject := coalesce(v_e ->> 'subject', '');
    v_detail := coalesce(v_e ->> 'detail', '');
    if v_name is null or v_name not in (
         'place_view', 'route_view', 'event_view', 'search_empty',
         'add_to_trip', 'add_route', 'navigate_click', 'contact_click',
         'cta_click', 'share', 'qr_visit', 'save_place', 'live_start',
         'camera_start', 'listen_play')
       or v_detail !~ '^[a-z0-9-]{0,60}$' then
      continue;
    end if;
    -- Lo buscado: solo letras y espacios (sin números ni arrobas: nunca un
    -- teléfono o un correo). El resto: un slug.
    if v_name = 'search_empty' then
      if v_subject !~ '^[^0-9@/:<>]{1,40}$' then
        continue;
      end if;
    elsif v_subject !~ '^[a-z0-9-]{0,80}$' then
      continue;
    end if;
    insert into public.metric_daily (day, name, subject, detail, locale, n)
      values (v_day, v_name, v_subject, v_detail, v_locale, 1)
      on conflict (day, name, subject, detail, locale)
      do update set n = public.metric_daily.n + 1;
    v_ok := v_ok + 1;
  end loop;
  return v_ok;
end;
$$;

revoke all on function public.record_metrics(text, text, text, text) from public;
grant execute on function public.record_metrics(text, text, text, text) to anon, authenticated;

-- Informe del panel: conteos de los últimos p_days días (hora de Chile) y del
-- período anterior del mismo largo. Corre con los permisos de quien llama: la
-- RLS deja ver las filas solo al personal (el resto recibe todo en cero).
create or replace function public.metrics_report(p_days integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select
      (now() at time zone 'America/Santiago')::date as today,
      greatest(1, least(coalesce(p_days, 30), 366)) as days
  ),
  cur as (
    select m.* from public.metric_daily m, bounds b
    where m.day > b.today - b.days and m.day <= b.today
  ),
  prev as (
    select m.* from public.metric_daily m, bounds b
    where m.day > b.today - 2 * b.days and m.day <= b.today - b.days
  ),
  names as (
    select name from cur union select name from prev
  ),
  ranked as (
    select name, subject, sum(n)::bigint as n,
      row_number() over (partition by name order by sum(n) desc, subject) as rk
    from cur where subject <> ''
    group by name, subject
  )
  select jsonb_build_object(
    'days', (select days from bounds),
    'today', (select today from bounds),
    'totals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', x.name,
        'n', coalesce((select sum(n) from cur where cur.name = x.name), 0),
        'prev', coalesce((select sum(n) from prev where prev.name = x.name), 0)
      ) order by x.name) from names x), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'name', d.name, 'n', d.n)
        order by d.day, d.name)
      from (select day, name, sum(n)::bigint as n from cur group by day, name) d), '[]'::jsonb),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('name', r.name, 'subject', r.subject, 'n', r.n)
        order by r.name, r.rk)
      from ranked r where r.rk <= 50), '[]'::jsonb),
    'details', coalesce((
      select jsonb_agg(jsonb_build_object(
          'name', d.name, 'subject', d.subject, 'detail', d.detail, 'n', d.n)
        order by d.n desc)
      from (
        select name, subject, detail, sum(n)::bigint as n from cur
        where detail <> '' group by name, subject, detail
        order by sum(n) desc limit 200
      ) d), '[]'::jsonb),
    'locales', coalesce((
      select jsonb_agg(jsonb_build_object('locale', l.locale, 'n', l.n) order by l.n desc)
      from (select locale, sum(n)::bigint as n from cur group by locale) l), '[]'::jsonb)
  )
$$;

revoke all on function public.metrics_report(integer) from public, anon;
grant execute on function public.metrics_report(integer) to authenticated;
