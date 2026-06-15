-- ============================================================
--  ZIGZAM — Floor is Lava MULTIJOUEUR : salle d'attente + bots 🤖
--   - Salle d'attente (statut 'waiting') : on rejoint le lobby, on démarre
--     manuellement dès 2 participants (humains + bots).
--   - Plateau : démarre à 10x10, grandit jusqu'à 14x14 selon le nb de participants.
--   - Bots stockés dans flava_sessions.bots (jsonb) → pas de FK users,
--     donc exclus des récompenses ; pilotés par l'hôte côté client.
--  Idempotent.
-- ============================================================

alter table public.flava_sessions
  add column if not exists bots jsonb not null default '[]'::jsonb;

-- Sérialisation : ajoute les bots à l'état partagé.
create or replace function public._flava_session_json(p_session uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; s public.flava_sessions;
begin
  delete from public.flava_players
   where session_id = p_session and last_seen < now() - interval '40 seconds';

  select * into s from public.flava_sessions where id = p_session;
  if s.id is null then return jsonb_build_object('error', 'not_found'); end if;

  select jsonb_build_object(
    'session', jsonb_build_object(
      'id', s.id, 'statut', s.statut, 'seed', s.seed, 'taille', s.taille,
      'zones_active', to_jsonb(s.zones_active), 'resultat', s.resultat,
      'bots', s.bots,
      'started_at', (extract(epoch from s.started_at) * 1000)::bigint
    ),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id, 'pseudo', p.pseudo, 'avatar', p.avatar, 'role', p.role,
        'r', p.r, 'c', p.c, 'alive', p.alive
      ) order by p.joined_at)
      from public.flava_players p where p.session_id = s.id
    ), '[]'::jsonb)
  ) into v;
  return v;
end; $$;

-- Rejoint le lobby d'attente (ou en crée un). Plateau 10 → 14 selon participants.
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

-- Démarre la partie (≥ 2 participants). Remet les joueurs/bots au centre.
create or replace function public.flava_start(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_sessions; v_part int; v_center int;
begin
  select * into s from public.flava_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'waiting' then return public._flava_session_json(p_session); end if;

  select count(*) into v_part from public.flava_players where session_id = p_session;
  v_part := v_part + jsonb_array_length(s.bots);
  if v_part < 2 then return public._flava_session_json(p_session); end if;

  v_center := s.taille / 2;
  update public.flava_players
    set r = v_center, c = v_center, alive = true, rewarded = false
    where session_id = p_session;
  update public.flava_sessions
    set statut = 'active', started_at = now(), zones_active = '{}',
        bots = coalesce((select jsonb_agg(jsonb_build_object(
          'id', b->>'id', 'pseudo', b->>'pseudo', 'avatar', b->'avatar',
          'r', v_center, 'c', v_center, 'alive', true))
          from jsonb_array_elements(s.bots) b), '[]'::jsonb)
    where id = p_session;
  return public._flava_session_json(p_session);
end; $$;

-- Ajoute un bot dans le lobby.
create or replace function public.flava_add_bot(p_session uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_sessions; v_part int; v_bots int; v_i int; v_size int; v_center int;
  v_names text[]; v_avs jsonb[];
begin
  select * into s from public.flava_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'waiting' then return public._flava_session_json(p_session); end if;

  select count(*) into v_part from public.flava_players where session_id = p_session;
  v_part := v_part + jsonb_array_length(s.bots);
  if v_part >= 6 then return public._flava_session_json(p_session); end if;

  v_names := array['Bot-Lave 🌋','Bot-Saut 🦘','Bot-Roche 🪨','Bot-Flamme 🔥','Bot-Éclair ⚡'];
  v_avs := array['{"color":"orange"}','{"color":"vert"}','{"color":"bleu"}','{"color":"rose"}','{"color":"violet"}']::jsonb[];
  v_bots := jsonb_array_length(s.bots);
  v_i := (v_bots % 5) + 1;
  v_center := s.taille / 2;

  update public.flava_sessions
    set bots = bots || jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid()::text, 'pseudo', v_names[v_i], 'avatar', v_avs[v_i],
      'r', v_center, 'c', v_center, 'alive', true))
    where id = p_session;

  v_size := least(14, 10 + greatest(0, (v_part + 1) - 1));
  update public.flava_sessions set taille = v_size where id = p_session;
  return public._flava_session_json(p_session);
end; $$;

-- Retire le dernier bot du lobby.
create or replace function public.flava_remove_bot(p_session uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_sessions; v_part int; v_size int; v_len int;
begin
  select * into s from public.flava_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'waiting' then return public._flava_session_json(p_session); end if;
  v_len := jsonb_array_length(s.bots);
  if v_len = 0 then return public._flava_session_json(p_session); end if;

  update public.flava_sessions
    set bots = (
      select coalesce(jsonb_agg(val order by ord), '[]'::jsonb)
      from jsonb_array_elements(s.bots) with ordinality e(val, ord)
      where ord < v_len)
    where id = p_session;

  select count(*) into v_part from public.flava_players where session_id = p_session;
  v_part := v_part + (v_len - 1);
  v_size := least(14, 10 + greatest(0, v_part - 1));
  update public.flava_sessions set taille = v_size where id = p_session;
  return public._flava_session_json(p_session);
end; $$;

-- L'hôte met à jour les positions/états des bots pendant la partie.
create or replace function public.flava_set_bots(p_session uuid, p_bots jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.flava_sessions set bots = p_bots where id = p_session and statut = 'active';
end; $$;

grant execute on function public.flava_join(uuid) to anon, authenticated;
grant execute on function public.flava_start(uuid, uuid) to anon, authenticated;
grant execute on function public.flava_add_bot(uuid) to anon, authenticated;
grant execute on function public.flava_remove_bot(uuid) to anon, authenticated;
grant execute on function public.flava_set_bots(uuid, jsonb) to anon, authenticated;
