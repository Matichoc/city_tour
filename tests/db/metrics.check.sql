-- Métricas (migración 0034): solo se suma con prueba firmada, con topes, y
-- solo el personal lee los conteos. Usa tests/db/helpers.sql.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ca01', 'metricas-editor@test'),
  ('00000000-0000-0000-0000-00000000ca02', 'metricas-sinrol@test');
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ca01', 'editor');

create temp table m (payload text, proof text);
grant all on m to anon, authenticated;

-- ── Vector compartido con Node (tests/unit/metrics.test.ts) ──────────────
select tests.eq('el resumen del envío coincide con el de Node',
  private.metric_bind('[{"name":"place_view","subject":"playa-papudo","detail":""}]'),
  'f96186cefedb3327e7f3801ecbbb7c7ea0ca0b0a5c5a02a5d7ea3ad2f089140b');

-- ── Nadie escribe ni lee la tabla directamente ───────────────────────────
select tests.login('anon');
select tests.raises('anon no lee los conteos',
  $$select * from public.metric_daily$$, '42501');
select tests.raises('anon no inserta conteos',
  $$insert into public.metric_daily (day, name, n) values (current_date, 'share', 999)$$, '42501');
select tests.raises('anon no pide el informe',
  $$select public.metrics_report(30)$$, '42501');

-- ── Sin prueba válida no se cuenta ───────────────────────────────────────
select tests.raises('sin prueba',
  $$select public.record_metrics('[{"name":"share","subject":"","detail":""}]', 'es', repeat('a',64), null)$$, '28000');
select tests.raises('prueba inventada',
  $$select public.record_metrics('[{"name":"share","subject":"","detail":""}]', 'es', repeat('a',64), 'abc.def')$$, '28000');
select tests.logout();

insert into m (payload, proof) values (
  '[{"name":"place_view","subject":"playa-papudo","detail":""},{"name":"qr_visit","subject":"playa-papudo","detail":"letrero-plaza"},{"name":"inventado","subject":"","detail":""},{"name":"search_empty","subject":"llamar 123","detail":""},{"name":"search_empty","subject":"kayak","detail":""}]',
  null);
update m set proof = tests.proof('metric', repeat('a', 64), private.metric_bind(payload));

select tests.login('anon');
select tests.raises('una prueba de métricas no sirve para otro envío',
  $$select public.record_metrics('[{"name":"share","subject":"","detail":""}]', 'es', repeat('a',64), (select proof from m))$$, '28000');
select tests.raises('ni para otro remitente',
  $$select public.record_metrics((select payload from m), 'es', repeat('b',64), (select proof from m))$$, '28000');
select tests.eq('la prueba válida cuenta solo los eventos con formato correcto',
  (select public.record_metrics((select payload from m), 'es', repeat('a',64), (select proof from m))), 3);
select tests.raises('la misma prueba no se usa dos veces',
  $$select public.record_metrics((select payload from m), 'es', repeat('a',64), (select proof from m))$$, '28000');
select tests.logout();

select tests.eq('quedó la vista del lugar',
  (select n from public.metric_daily where name = 'place_view' and subject = 'playa-papudo' and locale = 'es'), 1);
select tests.eq('el QR guarda su origen',
  (select n from public.metric_daily where name = 'qr_visit' and detail = 'letrero-plaza'), 1);
select tests.eq('una búsqueda con números no se guarda',
  (select count(*)::int from public.metric_daily where name = 'search_empty' and subject like '%123%'), 0);
select tests.eq('la búsqueda limpia sí',
  (select n from public.metric_daily where name = 'search_empty' and subject = 'kayak'), 1);

-- Un segundo envío suma sobre la misma fila.
update m set proof = tests.proof('metric', repeat('a', 64), private.metric_bind(payload));
select tests.login('anon');
select public.record_metrics((select payload from m), 'es', repeat('a',64), (select proof from m));
select tests.logout();
select tests.eq('los conteos se acumulan por día',
  (select n from public.metric_daily where name = 'place_view' and subject = 'playa-papudo' and locale = 'es'), 2);

-- ── Topes ────────────────────────────────────────────────────────────────
update m set payload = (
  select jsonb_agg(jsonb_build_object('name', 'share', 'subject', '', 'detail', ''))::text
  from generate_series(1, 21));
update m set proof = tests.proof('metric', repeat('c', 64), private.metric_bind(payload));
select tests.login('anon');
select tests.raises('más de 20 eventos por envío',
  $$select public.record_metrics((select payload from m), 'es', repeat('c',64), (select proof from m))$$, 'P0001');
select tests.logout();

update private.abuse_limits set value = 3 where key = 'metric_sender_hour';
update m set payload = '[{"name":"share","subject":"","detail":""},{"name":"share","subject":"","detail":""}]';
update m set proof = tests.proof('metric', repeat('d', 64), private.metric_bind(payload));
select tests.login('anon');
select tests.eq('dentro del tope por hora',
  (select public.record_metrics((select payload from m), 'es', repeat('d',64), (select proof from m))), 2);
select tests.logout();
update m set proof = tests.proof('metric', repeat('d', 64), private.metric_bind(payload));
select tests.login('anon');
select tests.raises('pasado el tope por hora de esa huella',
  $$select public.record_metrics((select payload from m), 'es', repeat('d',64), (select proof from m))$$, 'P0001');
select tests.logout();
update private.abuse_limits set value = 300 where key = 'metric_sender_hour';

-- Las huellas viejas se borran solas.
insert into private.metric_senders (sender, hour, n) values (repeat('z', 64), now() - interval '5 hours', 1);
update m set proof = tests.proof('metric', repeat('e', 64), private.metric_bind(payload));
select tests.login('anon');
select public.record_metrics((select payload from m), 'es', repeat('e',64), (select proof from m));
select tests.logout();
select tests.eq('la huella vieja se borró',
  (select count(*)::int from private.metric_senders where sender = repeat('z', 64)), 0);

-- ── Informe: solo el personal ve números ─────────────────────────────────
select tests.login('authenticated', '00000000-0000-0000-0000-00000000ca01');
select tests.eq('el personal ve el total de vistas',
  (select (t ->> 'n')::int from jsonb_array_elements(public.metrics_report(7) -> 'totals') t
   where t ->> 'name' = 'place_view'), 2);
select tests.eq('y el ranking de lugares',
  (select t ->> 'subject' from jsonb_array_elements(public.metrics_report(7) -> 'top') t
   where t ->> 'name' = 'place_view' limit 1), 'playa-papudo');
select tests.eq('y los orígenes de QR',
  (select t ->> 'detail' from jsonb_array_elements(public.metrics_report(7) -> 'details') t
   where t ->> 'name' = 'qr_visit' limit 1), 'letrero-plaza');
select tests.logout();

select tests.login('authenticated', '00000000-0000-0000-0000-00000000ca02');
select tests.eq('una cuenta sin rol no ve nada',
  jsonb_array_length(public.metrics_report(7) -> 'totals'), 0);
select tests.logout();

rollback;
