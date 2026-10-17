-- Comentarios de visitantes sobre lugares y eventos publicados.
-- Se publican al enviarse; el personal los oculta o borra desde /admin.
-- Los visitantes no tienen cuenta: solo escriben por submit_review(), que
-- valida el texto, que la ficha esté publicada y un límite de envíos.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  author_name text not null check (length(trim(author_name)) between 1 and 40),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (length(trim(body)) between 3 and 500),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  -- Huella anónima del remitente (hash con sal, nunca la IP) para limitar envíos.
  sender_hash text not null check (length(sender_hash) between 16 and 128),
  moderated_by uuid references auth.users (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(place_id, event_id) = 1)
);

create index reviews_place_idx on public.reviews (place_id, created_at desc);
create index reviews_event_idx on public.reviews (event_id, created_at desc);
create index reviews_sender_idx on public.reviews (sender_hash, created_at desc);

alter table public.reviews enable row level security;

-- Público: solo comentarios visibles de fichas publicadas. Personal: todo.
create policy reviews_read on public.reviews for select using (
  public.is_staff()
  or (status = 'visible' and (
    exists (select 1 from public.places p where p.id = place_id and p.publication_status = 'published')
    or exists (select 1 from public.events e where e.id = event_id and e.publication_status = 'published')
  ))
);
-- Moderar (ocultar/mostrar): admin y editor. Borrar: solo admin.
create policy reviews_moderate on public.reviews for update
  using (public.has_role('admin', 'editor'))
  with check (public.has_role('admin', 'editor'));
create policy reviews_delete on public.reviews for delete
  using (public.has_role('admin'));

-- Nadie inserta directo (solo submit_review()) y la huella del remitente no se
-- expone: los permisos se dan por columna.
revoke all on public.reviews from anon, authenticated;
grant select (id, place_id, event_id, author_name, rating, body, status, created_at, moderated_at)
  on public.reviews to anon, authenticated;
grant update (status, moderated_by, moderated_at) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

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

-- Bitácora: cada moderación queda en audit_log.
create trigger reviews_audit after insert or update or delete on public.reviews
  for each row execute function public.audit_row();
