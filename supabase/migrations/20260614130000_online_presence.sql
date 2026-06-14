-- ============================================================
--  ZIGZAM — Présence « Qui est en ligne ? »
--   - Colonne users.derniere_activite (heartbeat client toutes les 2 min)
--   - ping_activity(uuid) : met à jour le heartbeat
--   - get_online_users() : users actifs dans les 5 dernières minutes
--  Idempotent.
-- ============================================================

alter table public.users
  add column if not exists derniere_activite timestamptz;

-- Index pour filtrer rapidement les utilisateurs récemment actifs.
create index if not exists users_derniere_activite_idx
  on public.users (derniere_activite desc);

-- ------------------------------------------------------------
--  Heartbeat : marque l'utilisateur comme actif maintenant.
-- ------------------------------------------------------------
create or replace function public.ping_activity(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.users set derniere_activite = now() where id = p_user;
end; $$;

-- ------------------------------------------------------------
--  Liste des utilisateurs en ligne (actifs < 5 min).
-- ------------------------------------------------------------
create or replace function public.get_online_users()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'pseudo', pseudo, 'avatar', avatar, 'role', role,
    'derniere_activite', derniere_activite
  ) order by derniere_activite desc), '[]'::jsonb)
  into v
  from public.users
  where derniere_activite is not null
    and derniere_activite > now() - interval '5 minutes';
  return v;
end; $$;

grant execute on function public.ping_activity(uuid) to anon, authenticated;
grant execute on function public.get_online_users() to anon, authenticated;
