-- ============================================================
--  ZIGZAM — Tenues d'avatar sauvegardées 👗 (« loadouts »)
--
--   - public.avatar_loadouts : une ligne = un snapshot COMPLET de
--     l'objet avatar (couleur + accessoires équipés) que l'élève a
--     figé sous un petit nom (« Look plage », « Tenue de fête »…).
--   - Limite volontaire à 6 tenues par élève (garde l'écran Avatar
--     lisible et évite le spam) — au-delà : { error: 'trop_de_looks' }.
--   - Aucun impact sur l'économie : ré-équiper une tenue ne fait
--     qu'appeler save_avatar() côté front, ça n'ajoute jamais rien à
--     `avatar.owned`. Le filtrage « l'élève possède-t-il encore ce
--     skin ? » se fait côté client (cf. loadoutToAvatar dans
--     src/lib/avatar.js).
--   - Même patron de sécurité que le reste du projet :
--       enable row level security  +  AUCUNE policy  +  revoke all
--     => accès EXCLUSIVEMENT via les 3 RPC security definer ci-dessous.
--  Idempotent (create ... if not exists / or replace).
-- ============================================================

create table if not exists public.avatar_loadouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  nom           text not null,
  avatar        jsonb not null,
  date_creation timestamptz not null default now()
);
alter table public.avatar_loadouts enable row level security; -- accès via RPC uniquement
-- Ceinture + bretelles : on retire aussi le privilège de table aux rôles API
-- (le RLS bloque déjà tout ; ceci sort la table de la Data API).
revoke all on public.avatar_loadouts from anon, authenticated;
create index if not exists idx_avatar_loadouts_user
  on public.avatar_loadouts (user_id, date_creation desc);

-- ------------------------------------------------------------
--  save_avatar_loadout(p_user, p_nom, p_avatar)
--  Enregistre une nouvelle tenue pour l'élève. Refuse au-delà de 6
--  tenues ({ error: 'trop_de_looks' }). Sinon insère et renvoie
--  { ok: true, id: <uuid créé> }.
-- ------------------------------------------------------------
create or replace function public.save_avatar_loadout(
  p_user uuid, p_nom text, p_avatar jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_id    uuid;
begin
  if not exists (select 1 from public.users where id = p_user) then
    return jsonb_build_object('error', 'user_introuvable');
  end if;

  select count(*) into v_count
  from public.avatar_loadouts
  where user_id = p_user;

  if v_count >= 6 then
    return jsonb_build_object('error', 'trop_de_looks');
  end if;

  insert into public.avatar_loadouts (user_id, nom, avatar)
  values (
    p_user,
    left(coalesce(nullif(btrim(p_nom), ''), 'Ma tenue'), 40),
    coalesce(p_avatar, '{}'::jsonb)
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

-- ------------------------------------------------------------
--  get_my_avatar_loadouts(p_user)
--  Toutes les tenues de l'élève, de la plus récente à la plus
--  ancienne : [{ id, nom, avatar, date_creation }, …].
-- ------------------------------------------------------------
create or replace function public.get_my_avatar_loadouts(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'nom', nom,
    'avatar', avatar,
    'date_creation', date_creation
  ) order by date_creation desc), '[]'::jsonb)
  into v
  from public.avatar_loadouts
  where user_id = p_user;
  return v;
end;
$$;

-- ------------------------------------------------------------
--  delete_avatar_loadout(p_user, p_id)
--  Supprime la tenue UNIQUEMENT si elle appartient bien à p_user.
--  Renvoie { ok: true } ou { error: 'introuvable' }.
-- ------------------------------------------------------------
create or replace function public.delete_avatar_loadout(p_user uuid, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_deleted integer;
begin
  delete from public.avatar_loadouts
  where id = p_id and user_id = p_user;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    return jsonb_build_object('error', 'introuvable');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.save_avatar_loadout(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.get_my_avatar_loadouts(uuid)          to anon, authenticated;
grant execute on function public.delete_avatar_loadout(uuid, uuid)     to anon, authenticated;
