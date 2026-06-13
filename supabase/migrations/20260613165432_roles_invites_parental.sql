-- ============================================================
--  ZIGZAM — Rôles (user/admin/superadmin), compte superadmin,
--  codes d'invitation, contrôle parental, suppression commentaires.
--  Idempotent. Accès via RPC SECURITY DEFINER uniquement.
-- ============================================================

-- ------------------------------------------------------------
--  1. TABLES
-- ------------------------------------------------------------
create table if not exists public.codes_invitation (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  actif           boolean not null default true,
  created_by      uuid references public.users(id) on delete set null,
  date_creation   timestamptz not null default now(),
  nb_utilisations integer not null default 0
);
alter table public.codes_invitation enable row level security;

create table if not exists public.controle_parental (
  user_id           uuid primary key references public.users(id) on delete cascade,
  code_parent       text not null,                       -- haché bcrypt
  duree_max_minutes integer,                             -- null = illimité
  heure_debut       time,                                -- null = pas de restriction horaire
  heure_fin         time,
  actif             boolean not null default false,
  modules_bloques   jsonb not null default '[]'::jsonb
);
alter table public.controle_parental enable row level security;

-- ------------------------------------------------------------
--  2. RÔLES : mise à jour des vérifications côté serveur
--     admin = modération actus + commentaires
--     superadmin = tout (comptes, soldes, suppression, codes)
-- ------------------------------------------------------------

-- Modération (admin OU superadmin)
create or replace function public.get_pending_actus(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) not in ('admin', 'superadmin') then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image, 'date', a.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.statut = 'en_attente';
  return v;
end; $$;

create or replace function public.moderate_actu(p_admin uuid, p_actu uuid, p_statut text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) not in ('admin', 'superadmin') then
    return 'forbidden';
  end if;
  update public.actualites set statut = p_statut where id = p_actu;
  return 'ok';
end; $$;

-- Suppression d'un commentaire (admin OU superadmin)
create or replace function public.delete_comment(p_admin uuid, p_comment uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) not in ('admin', 'superadmin') then
    return 'forbidden';
  end if;
  delete from public.commentaires where id = p_comment;
  return 'ok';
end; $$;

-- Gestion des comptes / soldes / suppression : SUPERADMIN uniquement
create or replace function public.admin_create_user(p_admin uuid, p_pseudo text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if exists (select 1 from public.users where pseudo = p_pseudo) then
    return jsonb_build_object('error', 'pseudo_pris');
  end if;
  insert into public.users(pseudo, mot_de_passe, role)
  values (p_pseudo, crypt(p_password, gen_salt('bf')), 'user');
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.admin_list_users(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'pseudo', pseudo, 'numero', numero, 'donuts', donuts,
    'gemmes', gemmes, 'role', role, 'avatar', avatar, 'premiere_connexion', premiere_connexion
  ) order by pseudo), '[]'::jsonb)
  into v from public.users;
  return v;
end; $$;

create or replace function public.admin_set_balance(p_admin uuid, p_user uuid, p_donuts int, p_gemmes int)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return 'forbidden';
  end if;
  update public.users set donuts = p_donuts, gemmes = p_gemmes where id = p_user;
  return 'ok';
end; $$;

create or replace function public.admin_delete_user(p_admin uuid, p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return 'forbidden';
  end if;
  if p_admin = p_user then
    return 'cannot_delete_self';
  end if;
  delete from public.users where id = p_user;
  return 'ok';
end; $$;

-- ------------------------------------------------------------
--  3. COMPTE SUPERADMIN + suppression de "maitre"
-- ------------------------------------------------------------
set search_path = public, extensions;

insert into public.users (pseudo, mot_de_passe, role, donuts, gemmes, premiere_connexion)
values ('Asacool', crypt('zigzam2026', gen_salt('bf')), 'superadmin', 100, 10, true)
on conflict (pseudo) do update
  set role = 'superadmin', donuts = 100, gemmes = 10;

delete from public.users where pseudo = 'maitre';

reset search_path;

-- ------------------------------------------------------------
--  4. CODES D'INVITATION
-- ------------------------------------------------------------
-- Validité (appel public, avant inscription)
create or replace function public.validate_invite_code(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from public.codes_invitation where code = p_code and actif = true);
end; $$;

-- Inscription avec code
create or replace function public.signup_with_code(p_code text, p_pseudo text, p_password text)
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
  insert into public.users(pseudo, mot_de_passe, role, donuts, gemmes, premiere_connexion)
  values (p_pseudo, crypt(p_password, gen_salt('bf')), 'user', 10, 1, true);
  update public.codes_invitation set nb_utilisations = nb_utilisations + 1 where id = v_code_id;
  return jsonb_build_object('ok', true);
end; $$;

-- Gestion (superadmin)
create or replace function public.create_invite_code(p_admin uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  v_code := upper(coalesce(nullif(trim(p_code), ''), substring(replace(gen_random_uuid()::text, '-', ''), 1, 6)));
  if exists (select 1 from public.codes_invitation where code = v_code) then
    return jsonb_build_object('error', 'code_existe');
  end if;
  insert into public.codes_invitation(code, created_by) values (v_code, p_admin);
  return jsonb_build_object('ok', true, 'code', v_code);
end; $$;

create or replace function public.list_invite_codes(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'code', code, 'actif', actif, 'nb_utilisations', nb_utilisations, 'date_creation', date_creation
  ) order by date_creation desc), '[]'::jsonb)
  into v from public.codes_invitation;
  return v;
end; $$;

create or replace function public.toggle_invite_code(p_admin uuid, p_id uuid, p_actif boolean)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return 'forbidden';
  end if;
  update public.codes_invitation set actif = p_actif where id = p_id;
  return 'ok';
end; $$;

-- ------------------------------------------------------------
--  5. CONTRÔLE PARENTAL
-- ------------------------------------------------------------
-- Lecture de la config (sans le code) — sert à l'application des règles
create or replace function public.get_parental(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select jsonb_build_object(
    'configured', true, 'actif', actif,
    'duree_max_minutes', duree_max_minutes,
    'heure_debut', heure_debut, 'heure_fin', heure_fin,
    'modules_bloques', modules_bloques
  ) into v from public.controle_parental where user_id = p_user;
  return coalesce(v, jsonb_build_object('configured', false));
end; $$;

-- Première configuration (le parent choisit un code à 4 chiffres)
create or replace function public.set_parental(p_user uuid, p_code text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.controle_parental(user_id, code_parent, actif)
  values (p_user, crypt(p_code, gen_salt('bf')), true)
  on conflict (user_id) do nothing;
  return 'ok';
end; $$;

-- Vérifie le code parental
create or replace function public.verify_parental_code(p_user uuid, p_code text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  return exists (
    select 1 from public.controle_parental
    where user_id = p_user and code_parent = crypt(p_code, code_parent)
  );
end; $$;

-- Mise à jour des réglages (nécessite le code parental)
create or replace function public.update_parental(
  p_user uuid, p_code text, p_duree int, p_debut text, p_fin text,
  p_modules jsonb, p_actif boolean
) returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (
    select 1 from public.controle_parental
    where user_id = p_user and code_parent = crypt(p_code, code_parent)
  ) then
    return 'mauvais_code';
  end if;
  update public.controle_parental set
    duree_max_minutes = p_duree,
    heure_debut = nullif(p_debut, '')::time,
    heure_fin = nullif(p_fin, '')::time,
    modules_bloques = coalesce(p_modules, '[]'::jsonb),
    actif = p_actif
  where user_id = p_user;
  return 'ok';
end; $$;

-- ------------------------------------------------------------
--  6. GRANTS
-- ------------------------------------------------------------
grant execute on function public.delete_comment(uuid, uuid) to anon, authenticated;
grant execute on function public.validate_invite_code(text) to anon, authenticated;
grant execute on function public.signup_with_code(text, text, text) to anon, authenticated;
grant execute on function public.create_invite_code(uuid, text) to anon, authenticated;
grant execute on function public.list_invite_codes(uuid) to anon, authenticated;
grant execute on function public.toggle_invite_code(uuid, uuid, boolean) to anon, authenticated;
grant execute on function public.get_parental(uuid) to anon, authenticated;
grant execute on function public.set_parental(uuid, text) to anon, authenticated;
grant execute on function public.verify_parental_code(uuid, text) to anon, authenticated;
grant execute on function public.update_parental(uuid, text, int, text, text, jsonb, boolean) to anon, authenticated;
