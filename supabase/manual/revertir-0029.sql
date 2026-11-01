-- Revierte la migración 0029: vuelve a crear las funciones antiguas de comentarios
-- (con la llamada anónima directa) y la política de inserción abierta de
-- analytics_events. Úsalo solo si algo dejó de funcionar y no se puede esperar a
-- una corrección. Copia exacta de 0017, 0020 y 0013.

create or replace function public.submit_review(
  p_entity text,
  p_slug text,
  p_author text,
  p_rating smallint,
  p_body text,
  p_sender_hash text
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

  -- Límites: 3 por hora y 10 por día por remitente; 30 por hora por ficha.
  if (select count(*) from public.reviews
        where sender_hash = p_sender_hash and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.reviews
        where sender_hash = p_sender_hash and created_at > now() - interval '1 day') >= 10
     or (select count(*) from public.reviews
        where (place_id = v_place or event_id = v_event)
          and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'rate limited' using errcode = '54000';
  end if;

  insert into public.reviews (place_id, event_id, author_name, rating, body, sender_hash)
  values (v_place, v_event, trim(p_author), p_rating, trim(p_body), p_sender_hash)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.submit_review(text, text, text, smallint, text, text)
  to anon, authenticated;

create or replace function public.attach_review_media(
  p_review uuid,
  p_sender_hash text,
  p_files jsonb
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
begin
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

create or replace function public.finish_review_media(p_review uuid, p_sender_hash text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
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

revoke execute on function public.attach_review_media(uuid, text, jsonb) from public;
revoke execute on function public.finish_review_media(uuid, text) from public;
grant execute on function public.attach_review_media(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.finish_review_media(uuid, text) to anon, authenticated;

create policy analytics_events_insert on public.analytics_events for insert with check (true);
grant insert on public.analytics_events to anon, authenticated;
