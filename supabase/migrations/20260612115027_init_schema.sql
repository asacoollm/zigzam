-- ============================================================
--  ZIGZAM — Migration de base (baseline)
--  Schéma initial : auth maison + module Avatar.
--  Appliquée automatiquement par `supabase db push`.
--  Idempotente (create ... if not exists / or replace) : sans risque
--  même si la base distante contient déjà ces objets.
-- ============================================================

-- pgcrypto fournit crypt() / gen_salt() pour hasher les mots de passe (bcrypt).
-- Sur Supabase, les extensions vivent dans le schéma "extensions" (pas "public").
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------
--  Table des utilisateurs (élèves + admin)
-- ------------------------------------------------------------
create table if not exists public.users (
  id                  uuid primary key default gen_random_uuid(),
  pseudo              text unique not null,
  mot_de_passe        text not null,                 -- stocké HASHÉ (bcrypt), jamais en clair
  numero              char(4),                        -- numéro à 4 chiffres, unique, choisi à l'onboarding
  role                text not null default 'user',   -- 'user' | 'admin'
  donuts              integer not null default 10,
  gemmes              integer not null default 1,
  avatar              jsonb not null default '{}'::jsonb,
  premiere_connexion  boolean not null default true,
  date_creation       timestamptz not null default now(),
  constraint numero_unique unique (numero),
  constraint numero_4_chiffres check (numero is null or numero ~ '^[0-9]{4}$')
);

-- On bloque tout accès direct à la table depuis le client (clé anon).
-- L'authentification passe UNIQUEMENT par les fonctions ci-dessous (SECURITY DEFINER),
-- ce qui évite d'exposer la colonne mot_de_passe.
alter table public.users enable row level security;
-- (aucune policy => aucune lecture/écriture directe possible avec la clé anon)

-- ------------------------------------------------------------
--  FONCTION : connexion (pseudo + mot de passe)
--  Renvoie l'utilisateur SANS le hash, ou rien si identifiants invalides.
-- ------------------------------------------------------------
create or replace function public.login(p_pseudo text, p_password text)
returns table (
  id uuid,
  pseudo text,
  numero char(4),
  role text,
  donuts integer,
  gemmes integer,
  avatar jsonb,
  premiere_connexion boolean
)
language plpgsql
security definer
-- "extensions" est requis : crypt()/gen_salt() (pgcrypto) y sont installés, pas dans public.
set search_path = public, extensions
as $$
begin
  return query
  select u.id, u.pseudo, u.numero, u.role, u.donuts, u.gemmes, u.avatar, u.premiere_connexion
  from public.users u
  where u.pseudo = p_pseudo
    and u.mot_de_passe = crypt(p_password, u.mot_de_passe);
end;
$$;

-- ------------------------------------------------------------
--  FONCTION : finaliser la première connexion (onboarding)
--  Change le mot de passe + enregistre le numéro à 4 chiffres unique.
--  Renvoie 'ok', 'numero_pris', ou 'numero_invalide'.
-- ------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_user_id uuid,
  p_new_password text,
  p_numero char(4)
)
returns text
language plpgsql
security definer
-- "extensions" est requis : crypt()/gen_salt() (pgcrypto) y sont installés, pas dans public.
set search_path = public, extensions
as $$
begin
  if p_numero !~ '^[0-9]{4}$' then
    return 'numero_invalide';
  end if;

  if exists (select 1 from public.users where numero = p_numero and id <> p_user_id) then
    return 'numero_pris';
  end if;

  update public.users
  set mot_de_passe = crypt(p_new_password, gen_salt('bf')),
      numero = p_numero,
      premiere_connexion = false
  where id = p_user_id;

  return 'ok';
end;
$$;

-- ------------------------------------------------------------
--  FONCTION : sauvegarder l'avatar (couleur + accessoires gratuits/équipés)
--  Stocke l'objet JSON tel quel et le renvoie. Sert aux changements
--  qui ne coûtent pas de gemmes (couleur, accessoires gratuits, retrait).
-- ------------------------------------------------------------
create or replace function public.save_avatar(p_user_id uuid, p_avatar jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_avatar jsonb;
begin
  update public.users
  set avatar = p_avatar
  where id = p_user_id
  returning avatar into v_avatar;

  return v_avatar;
end;
$$;

-- ------------------------------------------------------------
--  FONCTION : acheter + équiper un accessoire payant
--  - si déjà possédé : on l'équipe sans re-débiter
--  - sinon : on vérifie les gemmes, on débite, on l'ajoute à "owned" et on l'équipe
--  Renvoie un JSON : { ok, gemmes, avatar } ou { error, gemmes }.
-- ------------------------------------------------------------
create or replace function public.buy_accessory(
  p_user_id uuid,
  p_category text,
  p_item_id text,
  p_price integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gemmes  integer;
  v_avatar  jsonb;
  v_key     text := p_category || ':' || p_item_id;
  v_owned   jsonb;
begin
  select gemmes, avatar into v_gemmes, v_avatar
  from public.users
  where id = p_user_id
  for update;

  if v_gemmes is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  v_owned := coalesce(v_avatar->'owned', '[]'::jsonb);

  -- Déjà possédé : on équipe simplement (pas de débit).
  if v_owned ? v_key then
    v_avatar := jsonb_set(v_avatar, array[p_category], to_jsonb(p_item_id));
    update public.users set avatar = v_avatar where id = p_user_id;
    return jsonb_build_object('ok', true, 'gemmes', v_gemmes, 'avatar', v_avatar);
  end if;

  -- Pas assez de gemmes.
  if v_gemmes < p_price then
    return jsonb_build_object('error', 'not_enough_gems', 'gemmes', v_gemmes);
  end if;

  -- Débit + ajout à la collection + équipement.
  v_gemmes := v_gemmes - p_price;
  v_owned  := v_owned || to_jsonb(v_key);
  v_avatar := jsonb_set(v_avatar, '{owned}', v_owned, true);
  v_avatar := jsonb_set(v_avatar, array[p_category], to_jsonb(p_item_id), true);

  update public.users
  set gemmes = v_gemmes, avatar = v_avatar
  where id = p_user_id;

  return jsonb_build_object('ok', true, 'gemmes', v_gemmes, 'avatar', v_avatar);
end;
$$;

-- On autorise l'appel des fonctions depuis le client (clé anon)
grant execute on function public.login(text, text) to anon, authenticated;
grant execute on function public.complete_onboarding(uuid, text, char) to anon, authenticated;
grant execute on function public.save_avatar(uuid, jsonb) to anon, authenticated;
grant execute on function public.buy_accessory(uuid, text, text, integer) to anon, authenticated;

-- ------------------------------------------------------------
--  COMPTES DE TEST (mot de passe temporaire = "zigzam")
--  Le hash est calculé automatiquement par crypt().
-- ------------------------------------------------------------
-- crypt()/gen_salt() (pgcrypto) vivent dans le schéma "extensions" sur Supabase.
-- Hors fonction, le search_path par défaut de `supabase db push` ne les voit pas :
-- on l'élargit pour cet INSERT.
set search_path = public, extensions;

insert into public.users (pseudo, mot_de_passe, role) values
  ('lucas',  crypt('zigzam', gen_salt('bf')), 'user'),
  ('emma',   crypt('zigzam', gen_salt('bf')), 'user'),
  ('maitre', crypt('zigzam', gen_salt('bf')), 'admin')
on conflict (pseudo) do nothing;

reset search_path;
