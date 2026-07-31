-- ============================================================
--  ZIGZAM — Floor is Lava multi : « Rejouer » 🔄
--  Relance une nouvelle manche dans la MÊME session (mêmes joueurs +
--  bots), sans repasser par le lobby : nouveau seed (terrain/lave
--  différents), zones/joueurs/bots remis à zéro, statut → 'active'.
--  Seulement possible depuis une partie terminée ('finished').
--  Idempotent.
-- ============================================================

create or replace function public.flava_restart(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_sessions; v_center int;
begin
  select * into s from public.flava_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'finished' then
    return public._flava_session_json(p_session);
  end if;
  if not exists (
    select 1 from public.flava_players where session_id = p_session and user_id = p_user
  ) then
    return jsonb_build_object('error', 'not_in_session');
  end if;

  v_center := s.taille / 2;
  update public.flava_players
    set r = v_center, c = v_center, alive = true, rewarded = false, burned_until = null, last_seen = now()
    where session_id = p_session;
  update public.flava_sessions
    set statut = 'active', resultat = null, zones_active = '{}',
        seed = (floor(random() * 2000000000))::bigint,
        started_at = now(), updated_at = now(),
        bots = coalesce((select jsonb_agg(jsonb_build_object(
          'id', b->>'id', 'pseudo', b->>'pseudo', 'avatar', b->'avatar',
          'r', v_center, 'c', v_center, 'alive', true))
          from jsonb_array_elements(s.bots) b), '[]'::jsonb)
    where id = p_session;

  return public._flava_session_json(p_session);
end; $$;

grant execute on function public.flava_restart(uuid, uuid) to anon, authenticated;
