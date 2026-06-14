-- ============================================================
--  ZIGZAM — Tutoriel de bienvenue (1re connexion, après l'onboarding)
--   - users.tutoriel_vu : booléen (défaut false)
--   - login() renvoie aussi tutoriel_vu (le client sait s'il faut le lancer)
--   - mark_tutorial_done(uuid) : marque le tutoriel comme vu
--  Idempotent.
-- ============================================================

alter table public.users
  add column if not exists tutoriel_vu boolean not null default false;

-- login() doit désormais renvoyer tutoriel_vu → on doit recréer la fonction
-- (le type de retour change, donc DROP obligatoire avant CREATE).
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
  tutoriel_vu boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select u.id, u.pseudo, u.numero, u.role, u.donuts, u.gemmes, u.avatar,
         u.premiere_connexion, u.tutoriel_vu
  from public.users u
  where u.pseudo = p_pseudo
    and u.mot_de_passe = crypt(p_password, u.mot_de_passe);
end;
$$;
grant execute on function public.login(text, text) to anon, authenticated;

-- Marque le tutoriel comme vu (ne se relancera plus automatiquement).
create or replace function public.mark_tutorial_done(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.users set tutoriel_vu = true where id = p_user;
end; $$;
grant execute on function public.mark_tutorial_done(uuid) to anon, authenticated;
