-- ============================================================
--  ZIGZAM — Floor is Lava MULTIJOUEUR 🌋👥  (#6)
--   Une SEULE partie commune active à la fois (flava_sessions).
--   - Le terrain, les zones et la lave sont DÉRIVÉS du seed côté client
--     (déterministe) → tout le monde voit exactement la même chose.
--   - La base ne stocke que l'état partagé : seed, taille du plateau,
--     indices des zones activées, joueurs (position / vivant).
--   - Les avatars/positions circulent en plus via Realtime (broadcast).
--  Idempotent.
-- ============================================================

create table if not exists public.flava_sessions (
  id           uuid primary key default gen_random_uuid(),
  statut       text not null default 'active',     -- 'active' | 'finished'
  seed         bigint not null,
  taille       int not null default 8,             -- plateau carré (8 → 12)
  zones_active int[] not null default '{}',         -- indices des zones activées
  resultat     text,                                -- null | 'win' | 'lose'
  started_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.flava_players (
  session_id uuid not null references public.flava_sessions(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  pseudo     text,
  avatar     jsonb,
  role       text,
  r          int not null default 0,
  c          int not null default 0,
  alive      boolean not null default true,
  rewarded   boolean not null default false,
  joined_at  timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.flava_sessions enable row level security;
alter table public.flava_players  enable row level security;
create index if not exists idx_flava_sessions_active on public.flava_sessions (statut);
create index if not exists idx_flava_players_session on public.flava_players (session_id);

-- Récompense d'une victoire commune (donuts par survivant).
create or replace function public._flava_multi_reward() returns int language sql immutable as $$
  select 6;
$$;

-- ------------------------------------------------------------
--  Sérialise une session + ses joueurs (purge les inactifs > 40 s).
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
--  Rejoint la partie commune (ou en crée une). Agrandit le plateau
--  à chaque nouveau joueur (8 → 12). Renvoie l'état complet.
-- ------------------------------------------------------------
create or replace function public.flava_join(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.flava_sessions;
  v_count int;
  v_new_size int;
  v_center int;
  v_u public.users;
begin
  select * into v_u from public.users where id = p_user;
  if v_u.id is null then return jsonb_build_object('error', 'no_user'); end if;

  -- Session active la plus récente (verrou pour éviter les doublons).
  select * into s from public.flava_sessions
    where statut = 'active' order by started_at desc limit 1 for update;

  if s.id is null then
    insert into public.flava_sessions(seed, taille)
    values ((floor(random() * 2000000000))::bigint, 8)
    returning * into s;
  end if;

  -- Nombre de joueurs distincts une fois celui-ci compté.
  select count(*) into v_count from public.flava_players
    where session_id = s.id and user_id <> p_user;
  v_new_size := least(12, 8 + v_count); -- +1 case par joueur supplémentaire

  -- Le plateau grandit → on régénère la disposition (reset des zones + timing).
  if v_new_size > s.taille then
    update public.flava_sessions
      set taille = v_new_size, zones_active = '{}', started_at = now(), updated_at = now()
      where id = s.id
      returning * into s;
  end if;

  v_center := s.taille / 2;
  insert into public.flava_players(session_id, user_id, pseudo, avatar, role, r, c, alive, last_seen)
  values (s.id, p_user, v_u.pseudo, v_u.avatar, v_u.role, v_center, v_center, true, now())
  on conflict (session_id, user_id) do update
    set alive = true, r = v_center, c = v_center, last_seen = now(),
        pseudo = excluded.pseudo, avatar = excluded.avatar, role = excluded.role;

  return public._flava_session_json(s.id);
end; $$;

-- ------------------------------------------------------------
--  Renvoie l'état courant + met à jour le heartbeat du joueur.
-- ------------------------------------------------------------
create or replace function public.flava_state(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.flava_players set last_seen = now()
    where session_id = p_session and user_id = p_user;
  return public._flava_session_json(p_session);
end; $$;

-- ------------------------------------------------------------
--  Déplacement d'un joueur (position partagée).
-- ------------------------------------------------------------
create or replace function public.flava_move(p_session uuid, p_user uuid, p_r int, p_c int)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.flava_players
    set r = p_r, c = p_c, last_seen = now()
    where session_id = p_session and user_id = p_user and alive = true;
  return jsonb_build_object('ok', true);
end; $$;

-- ------------------------------------------------------------
--  Active une zone partagée. Victoire commune si toutes activées.
--  p_total = nombre total de zones (dérivé du seed côté client).
-- ------------------------------------------------------------
create or replace function public.flava_activate(p_session uuid, p_user uuid, p_zone int, p_total int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_sessions; v_reward int;
begin
  select * into s from public.flava_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'active' then
    return public._flava_session_json(p_session);
  end if;

  if not (p_zone = any(s.zones_active)) then
    update public.flava_sessions
      set zones_active = array_append(zones_active, p_zone), updated_at = now()
      where id = p_session
      returning * into s;
  end if;

  -- Toutes les zones activées → victoire commune, récompense des survivants.
  if array_length(s.zones_active, 1) >= p_total then
    v_reward := public._flava_multi_reward();
    update public.flava_sessions set statut = 'finished', resultat = 'win', updated_at = now()
      where id = p_session;
    update public.users u
      set donuts = u.donuts + v_reward
      from public.flava_players p
      where p.session_id = p_session and p.user_id = u.id
        and p.alive = true and p.rewarded = false;
    insert into public.transactions(user_id, type, montant, devise, description)
      select p.user_id, 'gain', v_reward, 'donut', 'Floor is Lava multijoueur — victoire commune 🌋'
      from public.flava_players p
      where p.session_id = p_session and p.alive = true and p.rewarded = false;
    update public.flava_players set rewarded = true
      where session_id = p_session and alive = true;
  end if;

  return public._flava_session_json(p_session);
end; $$;

-- ------------------------------------------------------------
--  Élimination d'un joueur (a touché la lave). Défaite si plus
--  aucun survivant.
-- ------------------------------------------------------------
create or replace function public.flava_eliminate(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_alive int; s public.flava_sessions;
begin
  update public.flava_players set alive = false
    where session_id = p_session and user_id = p_user;

  select * into s from public.flava_sessions where id = p_session;
  if s.statut = 'active' then
    select count(*) into v_alive from public.flava_players
      where session_id = p_session and alive = true;
    if v_alive = 0 then
      update public.flava_sessions set statut = 'finished', resultat = 'lose', updated_at = now()
        where id = p_session;
    end if;
  end if;

  return public._flava_session_json(p_session);
end; $$;

-- ------------------------------------------------------------
--  Quitte la partie (retrait du joueur).
-- ------------------------------------------------------------
create or replace function public.flava_leave(p_session uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.flava_players where session_id = p_session and user_id = p_user;
end; $$;

grant execute on function public.flava_join(uuid) to anon, authenticated;
grant execute on function public.flava_state(uuid, uuid) to anon, authenticated;
grant execute on function public.flava_move(uuid, uuid, int, int) to anon, authenticated;
grant execute on function public.flava_activate(uuid, uuid, int, int) to anon, authenticated;
grant execute on function public.flava_eliminate(uuid, uuid) to anon, authenticated;
grant execute on function public.flava_leave(uuid, uuid) to anon, authenticated;
