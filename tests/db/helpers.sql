create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Cambia la sesión actual a un rol/usuario de Supabase (dentro de la transacción).
create or replace function tests.login(p_role text, p_user uuid default null)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_user::text, ''), true);
  execute format('set local role %I', p_role);
end;
$$;

create or replace function tests.logout() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'reset role';
end;
$$;

create or replace function tests.eq(p_name text, p_actual anyelement, p_expected anyelement)
returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FALLA [%]: esperado %, obtenido %', p_name, p_expected, p_actual;
  end if;
  raise notice 'ok  %', p_name;
end;
$$;

-- Afirma que la sentencia SQL falla (opcionalmente con cierto SQLSTATE).
create or replace function tests.raises(p_name text, p_sql text, p_state text default null)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if p_state is not null and sqlstate <> p_state then
      raise exception 'FALLA [%]: falló con %, se esperaba %: %', p_name, sqlstate, p_state, sqlerrm;
    end if;
    raise notice 'ok  % (%)', p_name, sqlstate;
    return;
  end;
  raise exception 'FALLA [%]: la sentencia no falló', p_name;
end;
$$;

-- Ejecuta un INSERT/UPDATE/DELETE y devuelve cuántas filas afectó.
create or replace function tests.rowcount(p_sql text)
returns integer language plpgsql as $$
declare n integer;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- ── Pruebas firmadas de comentarios (migración 0027) ─────────────────────
-- Secreto solo de pruebas: el real se carga a mano en Supabase.
insert into private.gate_secrets (slot, secret)
  values ('current', 'secreto-de-pruebas-0123456789abcdef-0123456789')
  on conflict (slot) do nothing;

-- Genera una prueba válida (o alterada a propósito) como lo haría el servidor.
create or replace function tests.proof(
  p_act text, p_sender text, p_bind text,
  p_exp_offset integer default 120, p_nonce text default null, p_secret text default null
)
returns text
language plpgsql
security definer
set search_path = private, public, extensions
as $$
declare
  v_secret text := coalesce(p_secret, (select secret from private.gate_secrets where slot = 'current'));
  v_payload text;
begin
  v_payload := translate(rtrim(replace(encode(convert_to(jsonb_build_object(
      'v', 1, 'act', p_act, 'sender', p_sender, 'bind', p_bind,
      'exp', extract(epoch from now())::bigint + p_exp_offset,
      'nonce', coalesce(p_nonce, encode(gen_random_bytes(16), 'hex')))::text, 'UTF8'),
    'base64'), E'\n', ''), '='), '+/', '-_');
  return v_payload || '.' || translate(rtrim(encode(
    hmac(convert_to(v_payload, 'UTF8'), convert_to(v_secret, 'UTF8'), 'sha256'), 'base64'), '='), '+/', '-_');
end;
$$;

create or replace function tests.review_proof(
  p_entity text, p_slug text, p_author text, p_rating smallint, p_body text, p_sender text,
  p_exp_offset integer default 120, p_nonce text default null, p_secret text default null
)
returns text
language sql
security definer
set search_path = private, public, extensions
as $$
  select tests.proof('review', p_sender,
    private.review_bind(p_entity, p_slug, p_author, p_rating, p_body),
    p_exp_offset, p_nonce, p_secret)
$$;

-- Atajos con la misma forma que las funciones antiguas, pero con prueba válida.
create or replace function tests.submit_review(
  p_entity text, p_slug text, p_author text, p_rating smallint, p_body text, p_sender text
) returns uuid language sql as $$
  select public.submit_review_v2(p_entity, p_slug, p_author, p_rating, p_body, p_sender,
    tests.review_proof(p_entity, p_slug, p_author, p_rating, p_body, p_sender))
$$;
create or replace function tests.attach_review_media(p_review uuid, p_sender text, p_files jsonb)
returns text[] language sql as $$
  select public.attach_review_media_v2(p_review, p_sender, p_files,
    tests.proof('media', p_sender, p_review::text))
$$;
create or replace function tests.finish_review_media(p_review uuid, p_sender text)
returns integer language sql as $$
  select public.finish_review_media_v2(p_review, p_sender,
    tests.proof('finish', p_sender, p_review::text))
$$;
