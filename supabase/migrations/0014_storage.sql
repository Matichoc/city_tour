-- Buckets de Storage. `papudo-place-images`: público, máx. 5 MB, solo imágenes web.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papudo-place-images', 'papudo-place-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists papudo_place_images_public_read on storage.objects;
create policy papudo_place_images_public_read on storage.objects for select
  using (bucket_id = 'papudo-place-images');
drop policy if exists papudo_place_images_staff_insert on storage.objects;
create policy papudo_place_images_staff_insert on storage.objects for insert
  with check (bucket_id = 'papudo-place-images' and papudo.has_role('admin', 'editor'));
drop policy if exists papudo_place_images_staff_update on storage.objects;
create policy papudo_place_images_staff_update on storage.objects for update
  using (bucket_id = 'papudo-place-images' and papudo.has_role('admin', 'editor'))
  with check (bucket_id = 'papudo-place-images' and papudo.has_role('admin', 'editor'));
drop policy if exists papudo_place_images_staff_delete on storage.objects;
create policy papudo_place_images_staff_delete on storage.objects for delete
  using (bucket_id = 'papudo-place-images' and papudo.has_role('admin', 'editor'));
