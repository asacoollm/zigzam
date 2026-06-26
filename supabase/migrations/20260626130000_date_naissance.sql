-- ============================================================
--  ZIGZAM — Date de naissance des utilisateurs
--   • colonne users.date_naissance
--   • login() renvoie désormais date_naissance
--   • signup_with_code() enregistre la date à l'inscription
--   • set_date_naissance() : renseigner sa date plus tard (modale)
--   • admin_birthdays_today() : anniversaires du jour (panel admin)
--  Idempotent.
-- ============================================================

alter table public.users add column if not exists date_naissance date;

-- ------------------------------------------------------------
--  login() : on ajoute date_naissance au retour.
--  Le type de retour change → il faut DROP puis recréer.
-- ------------------------------------------------------------
drop function if exists public.login(text, text);

create or replace function public.login(p_pseudo text, p_password text)
returns table (
  id uuid,
  pseudo text,
  numero char(4),
  role text,
  donuts integer,
  gemmes integer,
  avatar jsonb,
  premiere_connexion boolean,
  tutoriel_vu boolean,
  derniere_activite timestamptz,
  date_naissance date
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    u.id, u.pseudo, u.numero, u.role, u.donuts, u.gemmes, u.avatar,
    u.premiere_connexion, u.tutoriel_vu, u.derniere_activite, u.date_naissance
  from public.users u
  where u.pseudo = p_pseudo
    and u.mot_de_passe = crypt(p_password, u.mot_de_passe);
end;
$$;

grant execute on function public.login(text, text) to anon, authenticated;

-- ------------------------------------------------------------
--  signup_with_code() : ajout du paramètre p_naissance (date).
--  Nouvelle signature → on retire l'ancienne (3 args) pour éviter
--  toute ambiguïté.
-- ------------------------------------------------------------
drop function if exists public.signup_with_code(text, text, text);

create or replace function public.signup_with_code(
  p_code text, p_pseudo text, p_password text, p_naissance date
)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_code_id uuid;
begin
  select id into v_code_id from public.codes_invitation where code = p_code and actif = true;
  if v_code_id is null then
    return jsonb_build_object('error', 'code_invalide');
  end if;
  if exists (select 1 from public.users where pseudo = p_pseudo) then
    return jsonb_build_object('error', 'pseudo_pris');
  end if;
  insert into public.users(pseudo, mot_de_passe, role, donuts, gemmes, premiere_connexion, date_naissance)
  values (p_pseudo, crypt(p_password, gen_salt('bf')), 'user', 10, 1, true, p_naissance);
  update public.codes_invitation set nb_utilisations = nb_utilisations + 1 where id = v_code_id;
  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.signup_with_code(text, text, text, date) to anon, authenticated;

-- ------------------------------------------------------------
--  set_date_naissance() : enregistre la date d'un utilisateur déjà
--  inscrit (modale « on a besoin de ta date de naissance »).
-- ------------------------------------------------------------
create or replace function public.set_date_naissance(p_user uuid, p_naissance date)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_naissance is null then
    return jsonb_build_object('error', 'empty');
  end if;
  update public.users set date_naissance = p_naissance where id = p_user;
  return jsonb_build_object('ok', true, 'date_naissance', p_naissance);
end; $$;

grant execute on function public.set_date_naissance(uuid, date) to anon, authenticated;

-- ------------------------------------------------------------
--  admin_birthdays_today() : utilisateurs dont c'est l'anniversaire
--  aujourd'hui (même jour + même mois). Admin OU superadmin.
-- ------------------------------------------------------------
create or replace function public.admin_birthdays_today(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) not in ('admin', 'superadmin') then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'pseudo', pseudo, 'avatar', avatar, 'role', role,
    'date_naissance', date_naissance
  ) order by pseudo), '[]'::jsonb)
  into v
  from public.users
  where date_naissance is not null
    and extract(month from date_naissance) = extract(month from current_date)
    and extract(day   from date_naissance) = extract(day   from current_date);
  return v;
end; $$;

grant execute on function public.admin_birthdays_today(uuid) to anon, authenticated;
