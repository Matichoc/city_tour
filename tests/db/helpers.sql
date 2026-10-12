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
