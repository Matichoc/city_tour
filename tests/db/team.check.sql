-- Equipo en tres niveles: superadmin invita a los admin municipales (máx. 2).
begin;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000005a1', 'super@test', now(), null),
  ('00000000-0000-0000-0000-0000000005b1', 'muni.uno@test', now(), '{"full_name":"Muni Uno"}'),
  ('00000000-0000-0000-0000-0000000005b2', 'muni.dos@test', now(), null),
  ('00000000-0000-0000-0000-0000000005b3', 'muni.tres@test', now(), null),
  ('00000000-0000-0000-0000-0000000005c1', 'sin.confirmar@test', null, null);
insert into public.profiles (user_id, role) values
  ('00000000-0000-0000-0000-0000000005a1', 'superadmin');

create temporary table team_t (k text primary key, v text) on commit drop;
grant all on team_t to anon, authenticated;

-- El superadmin cuenta como admin en los permisos existentes.
select tests.login('authenticated', '00000000-0000-0000-0000-0000000005a1');
select tests.eq('superadmin pasa los permisos de admin', public.has_role('admin'), true);
select tests.eq('superadmin es staff', public.is_staff(), true);
insert into team_t select 'i1', public.create_staff_invite('Encargada de turismo');
select tests.eq('el enlace es largo y aleatorio', (select length(v) from team_t where k = 'i1'), 48);
select tests.logout();

-- Solo el superadmin invita.
select tests.login('anon');
select tests.raises('anon no invita', $$select public.create_staff_invite(null)$$, '42501');
select tests.eq('la invitación sirve',
  public.staff_invite_info((select v from team_t where k = 'i1')) ->> 'valid', 'true');
select tests.eq('un código inventado no sirve',
  public.staff_invite_info(repeat('a', 48)) ->> 'valid', 'false');
select tests.eq('se reserva para el correo de la cuenta nueva',
  public.claim_staff_invite((select v from team_t where k = 'i1'), 'Muni.Uno@test'), true);
select tests.eq('un correo inválido no reserva',
  public.claim_staff_invite((select v from team_t where k = 'i1'), 'no-es-correo'), false);
select tests.logout();

-- Sin correo confirmado, no se activa; con correo confirmado, queda como admin.
select tests.login('authenticated', '00000000-0000-0000-0000-0000000005c1');
select tests.eq('sin correo confirmado no se activa', public.activate_staff_invite(), null::public.app_role);
select tests.logout();
select tests.login('authenticated', '00000000-0000-0000-0000-0000000005b2');
select tests.eq('otra cuenta no toma la invitación ajena', public.activate_staff_invite(), null::public.app_role);
select tests.logout();
select tests.login('authenticated', '00000000-0000-0000-0000-0000000005b1');
select tests.eq('al entrar, la invitación la deja como admin', public.activate_staff_invite(), 'admin'::public.app_role);
select tests.eq('ya es admin', public.has_role('admin'), true);
select tests.eq('un admin municipal no es superadmin', public.is_superadmin(), false);
select tests.raises('un admin municipal no invita admins', $$select public.create_staff_invite(null)$$, '42501');
select tests.eq('ve al equipo con correos',
  (select string_agg(email, ',' order by email) from public.team_members()), 'muni.uno@test,super@test');
select tests.raises('un admin no quita accesos', $$select public.set_member_active('00000000-0000-0000-0000-0000000005a1', false)$$, '42501');
select tests.logout();
select tests.eq('el nombre de la cuenta pasa al perfil',
  (select full_name from public.profiles where user_id = '00000000-0000-0000-0000-0000000005b1'), 'Muni Uno');

select tests.login('anon');
select tests.eq('una invitación usada ya no sirve',
  public.staff_invite_info((select v from team_t where k = 'i1')) ->> 'valid', 'false');
select tests.logout();

-- Máximo 2 admin municipales (contando invitaciones abiertas).
select tests.login('authenticated', '00000000-0000-0000-0000-0000000005a1');
insert into team_t select 'i2', public.create_staff_invite(null);
select tests.raises('no se pasa de 2 admin municipales', $$select public.create_staff_invite(null)$$, '23514');
select tests.eq('ve sus invitaciones', (select count(*)::int from public.list_staff_invites()), 2);
select public.revoke_staff_invite((select id from public.list_staff_invites() where used_at is null limit 1));
select tests.eq('al revocar se libera el cupo', length(public.create_staff_invite(null)), 48);
select tests.logout();
select tests.raises('tampoco directo en la base',
  $$insert into public.profiles (user_id, role) values
    ('00000000-0000-0000-0000-0000000005b2', 'admin'), ('00000000-0000-0000-0000-0000000005b3', 'admin')$$, '23514');

-- Quitar el acceso.
select tests.login('authenticated', '00000000-0000-0000-0000-0000000005a1');
select public.set_member_active('00000000-0000-0000-0000-0000000005b1', false);
select tests.raises('el superadmin no se quita a sí mismo',
  $$select public.set_member_active('00000000-0000-0000-0000-0000000005a1', false)$$, '22023');
select tests.logout();
select tests.login('authenticated', '00000000-0000-0000-0000-0000000005b1');
select tests.eq('sin acceso, ya no es admin', public.has_role('admin'), false);
select tests.logout();

rollback;
