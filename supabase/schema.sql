-- ============================================================
--  ZIGZAM — Schéma de la base (étape 1 : authentification)
--  À exécuter dans Supabase → SQL Editor → New query → Run
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

-- On autorise l'appel des fonctions depuis le client (clé anon)
grant execute on function public.login(text, text) to anon, authenticated;
grant execute on function public.complete_onboarding(uuid, text, char) to anon, authenticated;

-- ------------------------------------------------------------
--  COMPTES DE TEST (mot de passe temporaire = "zigzam")
--  Le hash est calculé automatiquement par crypt().
-- ------------------------------------------------------------
insert into public.users (pseudo, mot_de_passe, role) values
  ('lucas',  crypt('zigzam', gen_salt('bf')), 'user'),
  ('emma',   crypt('zigzam', gen_salt('bf')), 'user'),
  ('maitre', crypt('zigzam', gen_salt('bf')), 'admin')
on conflict (pseudo) do nothing;
