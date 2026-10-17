-- Fotos y videos en los comentarios de visitantes.
--
-- Flujo: el navegador revisa cada archivo con un detector de desnudos
-- (NSFW.js, gratis, sin cuenta) y descarta lo obsceno. Lo que pasa se sube a
-- un bucket PRIVADO y queda «pendiente»: nada se muestra en el sitio hasta que
-- el personal lo aprueba en /admin/comentarios. Así, aunque alguien salte el
-- detector del navegador, no llega al público.
--
-- Los visitantes no tienen cuenta: solo pueden subir a rutas que antes
-- registró attach_review_media() (con el mismo límite de envíos que los
-- comentarios) y dentro de 30 minutos.

-- 1) Bucket privado: máx. 25 MB por archivo, solo formatos web.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-media', 'review-media', false, 26214400, array[
  'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Archivos de cada comentario.
create table public.review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  path text not null unique,
  kind text not null check (kind in ('image', 'video')),
  mime text not null,
  size_bytes integer not null check (size_bytes between 1 and 26214400),
  -- uploading: registrado, falta subirlo · pending: subido, espera revisión
  -- approved: visible en el sitio · rejected: descartado (el archivo se borra)
  status text not null default 'uploading'
    check (status in ('uploading', 'pending', 'approved', 'rejected')),
  -- Resultado del detector del navegador (informativo: lo envía el visitante).
  ai_scores jsonb,
  moderated_by uuid references auth.users (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind = 'image') = (mime like 'image/%'))
);
create index review_media_review_idx on public.review_media (review_id);
create index review_media_pending_idx on public.review_media (created_at) where status = 'pending';

alter table public.review_media enable row level security;
-- Público: solo lo aprobado de comentarios visibles. Personal: todo.
create policy review_media_read on public.review_media for select using (
  public.is_staff()
  or (status = 'approved' and exists (
    select 1 from public.reviews r where r.id = review_id and r.status = 'visible'
  ))
);
create policy review_media_moderate on public.review_media for update
  using (public.has_role('admin', 'editor'))
  with check (public.has_role('admin', 'editor'));
create policy review_media_delete on public.review_media for delete
  using (public.has_role('admin'));

revoke all on public.review_media from anon, authenticated;
grant select (id, review_id, path, kind, status, created_at) on public.review_media to anon;
grant select on public.review_media to authenticated;
grant update (status, moderated_by, moderated_at) on public.review_media to authenticated;
grant delete on public.review_media to authenticated;

-- 3) Registrar archivos para un comentario recién enviado (máx. 4, 1 video).
--    Devuelve las rutas donde el navegador puede subirlos.
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

-- 4) Avisar que terminó la subida: lo que de verdad llegó al bucket pasa a
--    «pendiente» de revisión.
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

-- Reglas del bucket (las políticas corren con el rol del visitante, que no lee
-- review_media: por eso se consultan con funciones security definer).
create or replace function public.review_media_can_upload(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.review_media
    where path = p_name and status = 'uploading'
      and created_at > now() - interval '30 minutes'
  )
$$;

create or replace function public.review_media_is_public(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.review_media m join public.reviews r on r.id = m.review_id
    where m.path = p_name and m.status = 'approved' and r.status = 'visible'
  )
$$;

revoke execute on function public.attach_review_media(uuid, text, jsonb) from public;
revoke execute on function public.finish_review_media(uuid, text) from public;
grant execute on function public.attach_review_media(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.finish_review_media(uuid, text) to anon, authenticated;
grant execute on function public.review_media_can_upload(text) to anon, authenticated;
grant execute on function public.review_media_is_public(text) to anon, authenticated;

create policy review_media_upload on storage.objects for insert
  with check (bucket_id = 'review-media' and public.review_media_can_upload(name));
create policy review_media_public_read on storage.objects for select
  using (bucket_id = 'review-media' and (
    public.review_media_is_public(name) or public.has_role('admin', 'editor', 'verifier')
  ));
create policy review_media_staff_delete on storage.objects for delete
  using (bucket_id = 'review-media' and public.has_role('admin', 'editor'));

create trigger review_media_audit after insert or update or delete on public.review_media
  for each row execute function public.audit_row();
