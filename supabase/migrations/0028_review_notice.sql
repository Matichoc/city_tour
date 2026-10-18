-- ABUSE-01/02 (parte B): aviso de comentarios nuevos en el panel.
--
-- Los comentarios se siguen publicando al enviarse. Para que el equipo se
-- entere, cada comentario guarda si alguien del personal ya lo revisó. El panel
-- cuenta los que faltan por revisar (docs/DISENO-ABUSE-01-02.md, 5.8).

alter table public.reviews
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references auth.users (id) on delete set null;

-- Lo que ya existe parte como revisado: el contador empieza en cero y no hay
-- falsa alarma. Sin pasar por la bitácora (no es una moderación).
alter table public.reviews disable trigger reviews_audit;
update public.reviews set reviewed_at = now();
alter table public.reviews enable trigger reviews_audit;

create index reviews_unreviewed_idx on public.reviews (created_at)
  where reviewed_at is null;

-- El personal lo ve y lo marca; los visitantes no (la lectura pública es por
-- columnas y estas no están en la lista).
grant select (reviewed_at, reviewed_by) on public.reviews to authenticated;
grant update (reviewed_at, reviewed_by) on public.reviews to authenticated;
