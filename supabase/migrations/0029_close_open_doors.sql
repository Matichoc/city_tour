-- ABUSE-01/02 (parte C) y DB-01: cierra las puertas abiertas.
--
-- SE APLICA SOLO DESPUÉS de desplegar el código que usa las funciones _v2 y de
-- verificar un comentario normal y uno con foto (docs/DISENO-ABUSE-01-02.md, 6).
-- Antes, los comentarios dejarían de funcionar.
--
-- 1) Se eliminan las funciones antiguas, que cualquiera con la clave pública
--    podía llamar eligiendo su propia «huella».
-- 2) analytics_events: la aplicación no usa esa tabla (la analítica va a
--    Vercel) y su política dejaba insertar filas a cualquiera, sin límite.
--
-- Reversión: supabase/manual/revertir-0029.sql.

drop function public.submit_review(text, text, text, smallint, text, text);
drop function public.attach_review_media(uuid, text, jsonb);
drop function public.finish_review_media(uuid, text);

drop policy analytics_events_insert on public.analytics_events;
revoke insert on public.analytics_events from anon, authenticated;
