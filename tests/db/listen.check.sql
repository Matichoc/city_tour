-- Audio de «Escuchar» (migración 0030): solo se sube con un nombre firmado con
-- el secreto de private.gate_secrets, y lo subido no se cambia ni se borra.
begin;

create temp table t (base text, firmado text, malo text);
grant all on t to anon, authenticated;
insert into t (base) values ('es/' || repeat('a', 32));
update t set
  firmado = base || '.' || translate(rtrim(encode(
    extensions.hmac(convert_to(base, 'UTF8'),
         convert_to((select secret from private.gate_secrets where slot = 'current'), 'UTF8'),
         'sha256'), 'base64'), '='), '+/', '-_') || '.mp3',
  malo = base || '.' || repeat('x', 43) || '.mp3';

select tests.login('anon');
select tests.eq('el nombre firmado es válido',
  (select public.listen_audio_name_ok(firmado) from t), true);
select tests.eq('una firma inventada no sirve',
  (select public.listen_audio_name_ok(malo) from t), false);
select tests.eq('un nombre sin firma no sirve',
  public.listen_audio_name_ok('es/' || repeat('a', 32) || '.mp3'), false);
insert into storage.objects (bucket_id, name)
  select 'listen-audio', firmado from t;
select tests.raises('no sube con una firma inventada',
  $$insert into storage.objects (bucket_id, name) select 'listen-audio', malo from t$$, '42501');
select tests.raises('no sube a otra carpeta',
  $$insert into storage.objects (bucket_id, name) values ('listen-audio', 'otra/cosa.mp3')$$, '42501');
select tests.eq('el audio subido se puede leer',
  (select count(*)::int from storage.objects where bucket_id = 'listen-audio'), 1);
update storage.objects set name = 'es/cambiado.mp3' where bucket_id = 'listen-audio';
delete from storage.objects where bucket_id = 'listen-audio';
select tests.raises('anon no lee los secretos',
  $$select secret from private.gate_secrets$$, '42501');
select tests.logout();
select tests.eq('nadie lo cambia ni lo borra',
  (select count(*)::int from storage.objects
   where bucket_id = 'listen-audio' and name = (select firmado from t)), 1);

rollback;
