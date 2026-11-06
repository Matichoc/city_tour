-- Rol «superadmin»: quien opera la plataforma (Matichoc). Va en su propia
-- migración porque Postgres no deja usar un valor nuevo de un enum en la misma
-- transacción en que se crea (lo usa la 0033).
alter type public.app_role add value if not exists 'superadmin';
