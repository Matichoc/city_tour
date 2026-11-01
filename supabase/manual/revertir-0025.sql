-- Revierte la contención 0025: devuelve al rol anónimo el SELECT completo
-- sobre `places` (incluida import_snapshot). Úsalo solo si algo del sitio
-- público dejó de leer `places` tras aplicar 0025. No toca datos.
grant select on public.places to anon;
