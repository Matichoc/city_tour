-- Videos de los comercios y «validada por el representante del local».

-- 1) La ficha puede mostrar que el representante del local confirmó los datos
--    (viene del formulario «Suma tu comercio», que exige su autorización).
alter table public.places
  add column owner_validated boolean not null default false;

comment on column public.places.owner_validated is
  'El representante del local confirmó los datos de la ficha (se muestra como «Validada por el representante del local»).';

-- 2) Los videos del comercio van en la misma lista de imágenes (orden, texto
--    alternativo y crédito), con tipo «video».
alter table public.place_images drop constraint if exists place_images_kind_check;
alter table public.place_images
  add constraint place_images_kind_check
    check (kind in ('photo', 'menu', 'promo', 'logo', 'video'));

-- 3) Bucket de videos: público (se ven en la ficha), hasta 50 MB (el máximo del
--    plan gratuito de Supabase) y solo formatos web. Los sube el personal
--    directo desde el navegador con un enlace firmado, sin pasar por Vercel.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-videos', 'place-videos', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy place_videos_public_read on storage.objects for select
  using (bucket_id = 'place-videos');
create policy place_videos_staff_insert on storage.objects for insert
  with check (bucket_id = 'place-videos' and public.has_role('admin', 'editor'));
create policy place_videos_staff_update on storage.objects for update
  using (bucket_id = 'place-videos' and public.has_role('admin', 'editor'))
  with check (bucket_id = 'place-videos' and public.has_role('admin', 'editor'));
create policy place_videos_staff_delete on storage.objects for delete
  using (bucket_id = 'place-videos' and public.has_role('admin', 'editor'));
