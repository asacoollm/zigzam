-- ============================================================
--  ZIGZAM — Correctif : flava_join référençait une colonne « date »
--  inexistante (flava_sessions a started_at / updated_at). On trie
--  désormais les sessions d'attente par started_at.
--  (La migration 20260616090000 étant déjà appliquée, on redéfinit ici.)
--  Idempotent.
-- ============================================================
create or replace function public.flava_join(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_sessions; v_u public.users; v_part int; v_size int; v_center int;
begin
  select * into v_u from public.users where id = p_user;
  if v_u.id is null then return jsonb_build_object('error', 'no_user'); end if;

  select * into s from public.flava_sessions
    where statut = 'waiting' order by started_at desc limit 1 for update;
  if s.id is null then
    insert into public.flava_sessions(seed, taille, statut, zones_active)
      values ((floor(random() * 2000000000))::bigint, 10, 'waiting', '{}')
      returning * into s;
  end if;

  v_center := s.taille / 2;
  insert into public.flava_players(session_id, user_id, pseudo, avatar, role, r, c, alive, last_seen)
    values (s.id, p_user, v_u.pseudo, v_u.avatar, v_u.role, v_center, v_center, true, now())
    on conflict (session_id, user_id) do update
      set alive = true, last_seen = now(),
          pseudo = excluded.pseudo, avatar = excluded.avatar, role = excluded.role;

  select count(*) into v_part from public.flava_players where session_id = s.id;
  v_part := v_part + jsonb_array_length(s.bots);
  v_size := least(14, 10 + greatest(0, v_part - 1));
  if v_size <> s.taille then
    update public.flava_sessions set taille = v_size where id = s.id;
  end if;

  return public._flava_session_json(s.id);
end; $$;
grant execute on function public.flava_join(uuid) to anon, authenticated;
