-- ============================================================
--  ZIGZAM — Floor is Lava multi : RÉSURRECTION 🔥
--  Toucher la lave ne tue plus définitivement : le joueur est « brûlé »
--  pendant 5 s (burned_until), puis il revit. On stocke burned_until et on
--  l'expose dans l'état partagé.
--  Idempotent.
-- ============================================================

alter table public.flava_players
  add column if not exists burned_until timestamptz;

-- Marque un joueur comme brûlé pour 5 s (s'il ne l'est pas déjà).
create or replace function public.flava_burn(p_session uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.flava_players
    set burned_until = now() + interval '5 seconds', last_seen = now()
    where session_id = p_session and user_id = p_user
      and (burned_until is null or burned_until < now());
end; $$;

-- _flava_session_json : ajoute burned_until (ms) à chaque joueur + reset des
-- brûlures au démarrage d'une partie (via flava_start ci-dessous).
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
        'r', p.r, 'c', p.c, 'alive', p.alive,
        'burned_until', case when p.burned_until is null then null
                            else (extract(epoch from p.burned_until) * 1000)::bigint end
      ) order by p.joined_at)
      from public.flava_players p where p.session_id = s.id
    ), '[]'::jsonb)
  ) into v;
  return v;
end; $$;

-- flava_start : recentre + réinitialise alive ET burned_until.
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
    set r = v_center, c = v_center, alive = true, rewarded = false, burned_until = null
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

grant execute on function public.flava_burn(uuid, uuid) to anon, authenticated;
