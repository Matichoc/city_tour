-- Buckets de Storage. `place-images`: público, máx. 5 MB, solo imágenes web.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-images', 'place-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy place_images_public_read on storage.objects for select
  using (bucket_id = 'place-images');
create policy place_images_staff_insert on storage.objects for insert
  with check (bucket_id = 'place-images' and public.has_role('admin', 'editor'));
create policy place_images_staff_update on storage.objects for update
  using (bucket_id = 'place-images' and public.has_role('admin', 'editor'))
  with check (bucket_id = 'place-images' and public.has_role('admin', 'editor'));
create policy place_images_staff_delete on storage.objects for delete
  using (bucket_id = 'place-images' and public.has_role('admin', 'editor'));
