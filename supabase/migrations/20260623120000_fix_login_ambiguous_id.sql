-- ============================================================
--  ZIGZAM — Correctif connexion : « column reference 'id' is ambiguous » (42702)
--
--  Bug : sur un appareil neuf (ou après >18h sans connexion), la connexion
--  échouait avec « Oups, une erreur est survenue ». Cause racine : l'ancienne
--  version de login() exécutait, dans sa branche « récompense de pause 18h »,
--  un `update public.users ... where id = v_id` où `id` n'était pas qualifié.
--  Ce `id` était ambigu entre la colonne users.id et le paramètre OUT `id` de
--  la table de retour → erreur Postgres 42702. La branche ne se déclenchant
--  qu'après 18h d'inactivité, les utilisateurs fréquents ne la rencontraient
--  jamais — d'où le « marche sur mes appareils, échoue sur un neuf ».
--
--  Correctif : login() redevient un simple SELECT, sans UPDATE ni récompense,
--  avec TOUTES les colonnes préfixées par `u.` → plus aucune ambiguïté possible.
--  Le type de retour change (pause_recompense → derniere_activite) → DROP requis.
--  Idempotent.
-- ============================================================

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
  derniere_activite timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    u.id,
    u.pseudo,
    u.numero,
    u.role,
    u.donuts,
    u.gemmes,
    u.avatar,
    u.premiere_connexion,
    u.tutoriel_vu,
    u.derniere_activite
  from public.users u
  where u.pseudo = p_pseudo
    and u.mot_de_passe = crypt(p_password, u.mot_de_passe);
end;
$$;

grant execute on function public.login(text, text) to anon, authenticated;
