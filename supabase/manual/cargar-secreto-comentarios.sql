-- Carga (o rota) el secreto que firma las pruebas de los comentarios.
-- NO es una migración y NO lleva el valor real: lo generas tú y lo pegas SOLO
-- aquí (SQL Editor de Supabase) y en la variable REVIEW_GATE_SECRET de Vercel.
-- Nunca en el repositorio, en un chat ni en un correo.
--
-- 1) Genera un valor largo y aleatorio (al menos 32 caracteres), por ejemplo en
--    tu computador:   openssl rand -base64 48
-- 2) Primera vez:
insert into private.gate_secrets (slot, secret)
values ('current', 'PEGA-AQUÍ-EL-VALOR-GENERADO')
on conflict (slot) do update set secret = excluded.secret, updated_at = now();

-- Rotación (para no cortar el servicio):
--   a) pasa el vigente a «anterior»:
--        update private.gate_secrets set slot = 'previous' where slot = 'current';
--        (si ya había un «previous», bórralo antes:
--         delete from private.gate_secrets where slot = 'previous';)
--   b) inserta el nuevo como 'current' (sentencia de arriba);
--   c) cambia REVIEW_GATE_SECRET en Vercel y despliega;
--   d) pasada una hora, borra el anterior:
--        delete from private.gate_secrets where slot = 'previous';
