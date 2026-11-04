-- Audio de «Escuchar» con voz natural (Azure, Catalina es-CL).
--
-- Bucket público de solo lectura. El servidor genera cada audio una vez y lo
-- sube con la clave PÚBLICA (nunca la de servicio en Vercel): la base solo
-- acepta archivos cuyo nombre lleva una firma HMAC hecha con el mismo secreto
-- de los comentarios (private.gate_secrets, migración 0027). Así nadie más
-- puede subir ni «plantar» un audio, y como no hay permiso para actualizar
-- ni borrar, un audio subido no se puede cambiar.
--
-- Nombre: <idioma>/<hash>.<firma>.mp3, donde hash = sha256 de voz, formato y
-- texto (32 hex) y firma = HMAC-SHA256(«<idioma>/<hash>») en base64url. Un
-- texto editado da otro hash: se genera un audio nuevo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listen-audio', 'listen-audio', true, 5242880, array['audio/mpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ¿El nombre trae una firma válida (con el secreto vigente o el anterior)?
create or replace function public.listen_audio_name_ok(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, extensions
as $$
declare
  v_m text[];
  v_secret record;
begin
  v_m := regexp_match(
    p_name,
    '^((?:es|en|pt)/[0-9a-f]{32})\.([A-Za-z0-9_-]{43})\.mp3$'
  );
  if v_m is null then
    return false;
  end if;
  for v_secret in select secret from private.gate_secrets loop
    if translate(
         rtrim(encode(hmac(convert_to(v_m[1], 'UTF8'),
                           convert_to(v_secret.secret, 'UTF8'), 'sha256'), 'base64'), '='),
         '+/', '-_') = v_m[2] then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

revoke all on function public.listen_audio_name_ok(text) from public;
grant execute on function public.listen_audio_name_ok(text) to anon, authenticated;

create policy listen_audio_public_read on storage.objects for select
  using (bucket_id = 'listen-audio');

-- Solo crear, y solo con firma. Sin políticas de update ni delete.
create policy listen_audio_signed_insert on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'listen-audio' and public.listen_audio_name_ok(name));
