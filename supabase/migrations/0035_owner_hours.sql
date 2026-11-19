-- Horario con selector en «Mi local»: el locatario elige, día por día, si
-- abre y a qué hora (por temporada), en vez de escribirlo en texto libre.
--
-- La propuesta trae el horario en el campo «hours»: un texto JSON con las
-- temporadas, igual que el editor del panel ([{fromMonth, toMonth, days,
-- holidays, opens, closes}], days con 0 = domingo). Al aprobarse, reemplaza
-- los horarios de la ficha (place_hours), así «Abierto ahora» queda al día
-- sin que el municipio tenga que reescribirlo. «hours_text» queda para notas
-- del horario (p. ej. «cerrado el 25 de diciembre»).

-- 1) Campos que el locatario puede proponer: se suma «hours».
create or replace function private.owner_field_limits()
returns table (field text, max_len int)
language sql
immutable
as $$
  values
    ('short_description', 200), ('full_description', 3000),
    ('hours_text', 600), ('address', 200), ('cta_kind', 20),
    ('cta_value', 300), ('instagram', 100), ('website', 300),
    ('hours', 4000)
$$;

-- 2) Un horario válido: arreglo de hasta 24 temporadas, cada una con meses
--    1..12, días 0..6 (al menos uno), horas HH:MM y festivos opcional.
--    Un arreglo vacío es válido (el local no informa horario).
create or replace function private.owner_hours_ok(p_hours text)
returns boolean
language plpgsql
immutable
set search_path = private, public
as $$
declare
  v jsonb;
  s jsonb;
  d jsonb;
begin
  begin
    v := p_hours::jsonb;
  exception when others then
    return false;
  end;
  if jsonb_typeof(v) <> 'array' or jsonb_array_length(v) > 24 then
    return false;
  end if;
  for s in select * from jsonb_array_elements(v) loop
    if jsonb_typeof(s) <> 'object'
       or jsonb_typeof(s -> 'fromMonth') <> 'number'
       or jsonb_typeof(s -> 'toMonth') <> 'number'
       or (s ->> 'fromMonth')::numeric not between 1 and 12
       or (s ->> 'toMonth')::numeric not between 1 and 12
       or (s ->> 'fromMonth')::numeric <> trunc((s ->> 'fromMonth')::numeric)
       or (s ->> 'toMonth')::numeric <> trunc((s ->> 'toMonth')::numeric)
       or jsonb_typeof(s -> 'days') <> 'array'
       or jsonb_array_length(s -> 'days') not between 1 and 7
       or coalesce(s ->> 'opens', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or coalesce(s ->> 'closes', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or (s ? 'holidays' and jsonb_typeof(s -> 'holidays') <> 'boolean') then
      return false;
    end if;
    for d in select * from jsonb_array_elements(s -> 'days') loop
      if jsonb_typeof(d) <> 'number' or (d #>> '{}')::numeric not in (0, 1, 2, 3, 4, 5, 6) then
        return false;
      end if;
    end loop;
  end loop;
  return true;
end;
$$;

-- 3) Validación de la propuesta: igual que antes, más el horario.
create or replace function private.owner_changes_ok(p_changes jsonb)
returns boolean
language plpgsql
immutable
set search_path = private, public
as $$
declare
  v_key text;
  v_value jsonb;
  v_max int;
begin
  if p_changes is null or jsonb_typeof(p_changes) <> 'object'
     or p_changes = '{}'::jsonb then
    return false;
  end if;
  for v_key, v_value in select * from jsonb_each(p_changes) loop
    select max_len into v_max from private.owner_field_limits() where field = v_key;
    if v_max is null then return false; end if;
    if jsonb_typeof(v_value) = 'null' then continue; end if;
    if jsonb_typeof(v_value) <> 'string' or length(v_value #>> '{}') > v_max then
      return false;
    end if;
  end loop;
  if p_changes ? 'cta_kind' and jsonb_typeof(p_changes -> 'cta_kind') = 'string'
     and (p_changes ->> 'cta_kind') not in
       ('whatsapp', 'phone', 'website', 'menu', 'booking', 'instagram') then
    return false;
  end if;
  -- El botón va con su valor (o se quitan los dos).
  if (p_changes ? 'cta_kind') <> (p_changes ? 'cta_value') then
    return false;
  end if;
  if p_changes ? 'hours' and jsonb_typeof(p_changes -> 'hours') = 'string'
     and not private.owner_hours_ok(p_changes ->> 'hours') then
    return false;
  end if;
  return true;
end;
$$;

-- 4) Datos del local para «Mi local»: igual que antes, más las filas de su
--    horario (la app las agrupa por temporada).
create or replace function public.owner_session(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  v_key private.owner_keys;
  v_result jsonb;
begin
  v_key := private.owner_key_for(p_token);
  if v_key.id is null then return null; end if;
  update private.owner_keys set last_used_at = now() where id = v_key.id;

  select jsonb_build_object(
    'place_id', p.id,
    'slug', p.slug,
    'name', t.name,
    'published', p.publication_status = 'published',
    'current', jsonb_build_object(
      'short_description', t.short_description,
      'full_description', t.full_description,
      'hours_text', p.hours_text,
      'address', p.address,
      'cta_kind', p.cta_kind,
      'cta_value', p.cta_value,
      'instagram', p.instagram,
      'website', p.website
    ),
    'hours_rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day_of_week', h.day_of_week, 'opens_at', h.opens_at, 'closes_at', h.closes_at,
        'closed', h.closed, 'from_month', h.from_month, 'to_month', h.to_month,
        'holidays', h.holidays
      ) order by h.from_month nulls first, h.day_of_week)
      from public.place_hours h where h.place_id = p.id
    ), '[]'::jsonb),
    'last', (
      select jsonb_build_object(
        'status', r.status, 'changes', r.changes, 'created_at', r.created_at,
        'reviewed_at', r.reviewed_at, 'review_note', r.review_note
      )
      from public.place_change_requests r
      where r.place_id = p.id and r.status <> 'replaced'
      order by r.created_at desc
      limit 1
    )
  )
  into v_result
  from public.places p
  left join public.place_translations t on t.place_id = p.id and t.locale = 'es'
  where p.id = v_key.place_id;
  return v_result;
end;
$$;

-- 5) Aprobar: igual que antes, y si trae horario reemplaza el de la ficha.
create or replace function public.review_owner_proposal(
  p_id uuid,
  p_approve boolean,
  p_note text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  r public.place_change_requests;
  c jsonb;
  s jsonb;
  d jsonb;
begin
  if not public.has_role('admin', 'editor') then
    raise exception 'solo el personal revisa propuestas' using errcode = '42501';
  end if;
  select * into r from public.place_change_requests where id = p_id for update;
  if r.id is null or r.status <> 'pending' then
    raise exception 'la propuesta ya no está pendiente' using errcode = '22023';
  end if;

  if p_approve then
    c := r.changes;
    update public.places set
      hours_text = case when c ? 'hours_text' then nullif(btrim(c ->> 'hours_text'), '') else hours_text end,
      address = case when c ? 'address' then nullif(btrim(c ->> 'address'), '') else address end,
      cta_kind = case when c ? 'cta_kind' then nullif(btrim(c ->> 'cta_kind'), '') else cta_kind end,
      cta_value = case when c ? 'cta_value' then nullif(btrim(c ->> 'cta_value'), '') else cta_value end,
      instagram = case when c ? 'instagram' then nullif(btrim(c ->> 'instagram'), '') else instagram end,
      website = case when c ? 'website' then nullif(btrim(c ->> 'website'), '') else website end,
      owner_validated = true,
      info_updated_at = now(),
      managed_in_panel = true
    where id = r.place_id;
    if c ? 'short_description' or c ? 'full_description' then
      update public.place_translations set
        short_description = case when c ? 'short_description'
          then nullif(btrim(c ->> 'short_description'), '') else short_description end,
        full_description = case when c ? 'full_description'
          then nullif(btrim(c ->> 'full_description'), '') else full_description end
      where place_id = r.place_id and locale = 'es';
    end if;
    if c ? 'hours' then
      delete from public.place_hours where place_id = r.place_id;
      if jsonb_typeof(c -> 'hours') = 'string' and private.owner_hours_ok(c ->> 'hours') then
        for s in select * from jsonb_array_elements((c ->> 'hours')::jsonb) loop
          for d in select distinct value from jsonb_array_elements(s -> 'days') loop
            insert into public.place_hours
              (place_id, day_of_week, opens_at, closes_at, from_month, to_month, holidays)
            values (
              r.place_id, (d #>> '{}')::smallint,
              (s ->> 'opens')::time, (s ->> 'closes')::time,
              (s ->> 'fromMonth')::smallint, (s ->> 'toMonth')::smallint,
              coalesce((s ->> 'holidays')::boolean, false)
            );
          end loop;
        end loop;
      end if;
    end if;
  end if;

  update public.place_change_requests set
    status = case when p_approve then 'approved' else 'rejected' end::public.proposal_status,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = nullif(btrim(p_note), '')
  where id = p_id;
end;
$$;

revoke all on function private.owner_hours_ok(text) from public, anon, authenticated;
revoke all on function public.review_owner_proposal(uuid, boolean, text) from public, anon;
grant execute on function public.review_owner_proposal(uuid, boolean, text) to authenticated;
grant execute on function public.owner_session(text) to anon, authenticated;
