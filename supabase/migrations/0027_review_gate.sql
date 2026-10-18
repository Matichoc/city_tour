-- ABUSE-01/02 (parte A): comentarios y archivos con prueba firmada.
--
-- Hoy cualquiera con la clave pública puede llamar a submit_review,
-- attach_review_media y finish_review_media, y la «huella» que limita los
-- envíos la elige quien llama. Aquí se agregan versiones nuevas (_v2) que
-- exigen una PRUEBA firmada por nuestro servidor (HMAC-SHA256 con un secreto que
-- solo conocen Vercel y esta base), de un solo uso, atada al contenido y con
-- vencimiento corto. Diseño: docs/DISENO-ABUSE-01-02.md.
--
-- Es aditiva: las funciones antiguas siguen funcionando hasta la migración
-- 0029, que se aplica DESPUÉS de desplegar el código nuevo.
--
-- El secreto se carga a mano (ver supabase/manual/cargar-secreto-comentarios.sql):
-- nunca va en el repositorio. Sin secreto cargado, las _v2 rechazan todo.

create extension if not exists pgcrypto with schema extensions;

-- Esquema privado: la API no lo expone y los visitantes no tienen acceso.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Secreto vigente y, al rotar, el anterior.
create table private.gate_secrets (
  slot text primary key check (slot in ('current', 'previous')),
  secret text not null check (length(secret) >= 32),
  updated_at timestamptz not null default now()
);

-- Pruebas ya usadas (uso único).
create table private.used_proofs (
  nonce text primary key check (length(nonce) >= 16),
  expires_at timestamptz not null
);
create index used_proofs_expires_idx on private.used_proofs (expires_at);

-- Topes ajustables sin migración (update private.abuse_limits ...).
create table private.abuse_limits (
  key text primary key,
  value bigint not null check (value >= 0),
  note text
);
insert into private.abuse_limits (key, value, note) values
  ('sender_hour', 5, 'comentarios por hora por huella'),
  ('sender_day', 15, 'comentarios por día por huella'),
  ('place_hour', 10, 'comentarios por hora en una misma ficha'),
  ('global_reviews_day', 150, 'comentarios por día en todo el sitio'),
  ('global_files_day', 100, 'archivos nuevos por día en todo el sitio'),
  ('pending_bytes', 314572800, 'espacio (bytes) entre archivos subiéndose y pendientes de revisión');

alter table private.gate_secrets enable row level security;
alter table private.used_proofs enable row level security;
alter table private.abuse_limits enable row level security;
revoke all on private.gate_secrets, private.used_proofs, private.abuse_limits
  from public, anon, authenticated;

create or replace function private.limit_of(p_key text)
returns bigint
language sql
stable
security definer
set search_path = private, public
as $$
  select value from private.abuse_limits where key = p_key
$$;

-- Verifica la prueba y la «gasta». Falla cerrado: sin secreto, nada pasa.
create or replace function private.verify_proof(
  p_proof text,
  p_act text,
  p_sender text,
  p_bind text
)
returns void
language plpgsql
security definer
set search_path = private, public, extensions
as $$
declare
  v_parts text[];
  v_payload text;
  v_sig text;
  v_secret record;
  v_valid boolean := false;
  v_json jsonb;
  v_exp bigint;
  v_now bigint := extract(epoch from now())::bigint;
  v_nonce text;
  v_inserted integer;
begin
  if p_proof is null or length(p_proof) > 2000 then
    raise exception 'invalid proof' using errcode = '28000';
  end if;
  v_parts := string_to_array(p_proof, '.');
  if array_length(v_parts, 1) is distinct from 2 then
    raise exception 'invalid proof' using errcode = '28000';
  end if;
  v_payload := v_parts[1];
  v_sig := v_parts[2];

  for v_secret in select secret from private.gate_secrets loop
    if translate(
         rtrim(encode(hmac(convert_to(v_payload, 'UTF8'),
                           convert_to(v_secret.secret, 'UTF8'), 'sha256'), 'base64'), '='),
         '+/', '-_') = v_sig then
      v_valid := true;
    end if;
  end loop;
  if not v_valid then
    raise exception 'invalid proof' using errcode = '28000';
  end if;

  begin
    v_json := convert_from(
      decode(rpad(translate(v_payload, '-_', '+/'), ((length(v_payload) + 3) / 4) * 4, '='), 'base64'),
      'UTF8')::jsonb;
    v_exp := (v_json ->> 'exp')::bigint;
  exception when others then
    raise exception 'invalid proof' using errcode = '28000';
  end;

  v_nonce := v_json ->> 'nonce';
  if (v_json ->> 'v') is distinct from '1'
     or (v_json ->> 'act') is distinct from p_act
     or (v_json ->> 'sender') is distinct from p_sender
     or (v_json ->> 'bind') is distinct from p_bind
     or v_nonce is null or length(v_nonce) < 16
     -- Vencida (con 30 s de tolerancia por relojes distintos) o con vigencia absurda.
     or v_exp < v_now - 30 or v_exp > v_now + 600 then
    raise exception 'invalid proof' using errcode = '28000';
  end if;

  -- Limpieza oportunista y uso único.
  delete from private.used_proofs where expires_at < now();
  insert into private.used_proofs (nonce, expires_at)
    values (v_nonce, to_timestamp(v_exp) + interval '1 hour')
    on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    raise exception 'proof reused' using errcode = '28000';
  end if;
end;
$$;

-- «Huella» del contenido de un comentario: debe calcularse igual en el servidor
-- (src/lib/review-gate.ts): sha256 hex de «entidad|slug|nombre|estrellas|texto».
create or replace function private.review_bind(
  p_entity text, p_slug text, p_author text, p_rating smallint, p_body text
)
returns text
language sql
immutable
set search_path = private, public, extensions
as $$
  select encode(digest(convert_to(
    p_entity || '|' || p_slug || '|' || p_author || '|' || p_rating::text || '|' || p_body,
    'UTF8'), 'sha256'), 'hex')
$$;

create or replace function public.submit_review_v2(
  p_entity text,
  p_slug text,
  p_author text,
  p_rating smallint,
  p_body text,
  p_sender_hash text,
  p_proof text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_place uuid;
  v_event uuid;
  v_id uuid;
begin
  perform private.verify_proof(
    p_proof, 'review', p_sender_hash,
    private.review_bind(p_entity, p_slug, p_author, p_rating, p_body));

  if p_entity = 'place' then
    select id into v_place from public.places
      where slug = p_slug and publication_status = 'published';
  elsif p_entity = 'event' then
    select id into v_event from public.events
      where slug = p_slug and publication_status = 'published';
  else
    raise exception 'unknown entity %', p_entity using errcode = '22023';
  end if;
  if v_place is null and v_event is null then
    raise exception 'not found' using errcode = 'P0002';
  end if;

  -- Topes: por huella (firmada), por ficha y globales (no dependen de nadie).
  if (select count(*) from public.reviews
        where sender_hash = p_sender_hash and created_at > now() - interval '1 hour')
         >= private.limit_of('sender_hour')
     or (select count(*) from public.reviews
        where sender_hash = p_sender_hash and created_at > now() - interval '1 day')
         >= private.limit_of('sender_day')
     or (select count(*) from public.reviews
        where (place_id = v_place or event_id = v_event)
          and created_at > now() - interval '1 hour') >= private.limit_of('place_hour')
     or (select count(*) from public.reviews
        where created_at > now() - interval '1 day') >= private.limit_of('global_reviews_day') then
    raise exception 'rate limited' using errcode = '54000';
  end if;

  insert into public.reviews (place_id, event_id, author_name, rating, body, sender_hash)
  values (v_place, v_event, trim(p_author), p_rating, trim(p_body), p_sender_hash)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.attach_review_media_v2(
  p_review uuid,
  p_sender_hash text,
  p_files jsonb,
  p_proof text
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_file jsonb;
  v_mime text;
  v_kind text;
  v_ext text;
  v_paths text[] := '{}';
  v_id uuid;
  v_max constant bigint := 26214400;  -- tope del bucket por archivo
  v_new integer;
  v_pending bigint;
begin
  perform private.verify_proof(p_proof, 'media', p_sender_hash, p_review::text);

  if not exists (
    select 1 from public.reviews
    where id = p_review and sender_hash = p_sender_hash
      and created_at > now() - interval '15 minutes'
  ) then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.review_media where review_id = p_review) then
    raise exception 'already attached' using errcode = '23505';
  end if;
  if jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) not between 1 and 4
     or (select count(*) from jsonb_array_elements(p_files) f
         where f ->> 'mime' like 'video/%') > 1 then
    raise exception 'too many files' using errcode = '22023';
  end if;
  v_new := jsonb_array_length(p_files);

  -- Las reservas que nadie terminó de subir en una hora se dan por abandonadas
  -- y dejan de ocupar cupo.
  update public.review_media set status = 'rejected'
    where status = 'uploading' and created_at < now() - interval '1 hour';

  if (select count(*) from public.review_media
        where created_at > now() - interval '1 day') + v_new
       > private.limit_of('global_files_day') then
    raise exception 'media capacity' using errcode = '54000';
  end if;
  -- No se confía en el tamaño declarado: lo que aún se está subiendo cuenta con
  -- el máximo del bucket; lo pendiente, con el tamaño real que registra Storage.
  select coalesce(sum(
      case when m.status = 'uploading' then v_max
           else coalesce((select (o.metadata ->> 'size')::bigint from storage.objects o
                          where o.bucket_id = 'review-media' and o.name = m.path), v_max)
      end), 0)
    into v_pending
    from public.review_media m where m.status in ('uploading', 'pending');
  if v_pending + v_new * v_max > private.limit_of('pending_bytes') then
    raise exception 'media capacity' using errcode = '54000';
  end if;

  for v_file in select * from jsonb_array_elements(p_files) loop
    v_mime := v_file ->> 'mime';
    v_ext := case v_mime
      when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp'
      when 'video/mp4' then 'mp4' when 'video/webm' then 'webm' when 'video/quicktime' then 'mov'
    end;
    if v_ext is null then
      raise exception 'unsupported type %', v_mime using errcode = '22023';
    end if;
    v_kind := case when v_mime like 'image/%' then 'image' else 'video' end;
    v_id := gen_random_uuid();
    insert into public.review_media (id, review_id, path, kind, mime, size_bytes, ai_scores)
    values (
      v_id, p_review, p_review || '/' || v_id || '.' || v_ext, v_kind, v_mime,
      (v_file ->> 'size')::integer,
      case when jsonb_typeof(v_file -> 'scores') = 'object' then v_file -> 'scores' end
    );
    v_paths := v_paths || (p_review || '/' || v_id || '.' || v_ext);
  end loop;
  return v_paths;
end;
$$;

create or replace function public.finish_review_media_v2(
  p_review uuid,
  p_sender_hash text,
  p_proof text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform private.verify_proof(p_proof, 'finish', p_sender_hash, p_review::text);
  if not exists (
    select 1 from public.reviews where id = p_review and sender_hash = p_sender_hash
  ) then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  update public.review_media m set status = 'pending'
    where m.review_id = p_review and m.status = 'uploading'
      and exists (select 1 from storage.objects o
                  where o.bucket_id = 'review-media' and o.name = m.path);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.submit_review_v2(text, text, text, smallint, text, text, text) from public;
revoke execute on function public.attach_review_media_v2(uuid, text, jsonb, text) from public;
revoke execute on function public.finish_review_media_v2(uuid, text, text) from public;
grant execute on function public.submit_review_v2(text, text, text, smallint, text, text, text) to anon, authenticated;
grant execute on function public.attach_review_media_v2(uuid, text, jsonb, text) to anon, authenticated;
grant execute on function public.finish_review_media_v2(uuid, text, text) to anon, authenticated;
revoke execute on function private.limit_of(text), private.verify_proof(text, text, text, text),
  private.review_bind(text, text, text, smallint, text) from public, anon, authenticated;
