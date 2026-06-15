-- ============================================================
--  ZIGZAM — Deux nouveaux jeux multijoueur (sortie 29/06)
--   1) Poker Donuts 🃏 (inspiré de Skull)
--   2) L'Imposteur 🕵️
--  Modèle identique à Floor is Lava multi : l'état partagé vit dans
--  des colonnes jsonb ; la logique de jeu est pilotée côté client et
--  persistée via RPC. Les RÉCOMPENSES en donuts sont, elles, calculées
--  CÔTÉ SERVEUR (anti-triche) et tracées dans `transactions`.
--  Synchro temps réel via canaux Realtime "broadcast".
--  Idempotent.
-- ============================================================

-- ============================================================
--  POKER DONUTS 🃏
-- ============================================================
create table if not exists public.poker_sessions (
  id       uuid primary key default gen_random_uuid(),
  statut   text not null default 'waiting',   -- 'waiting' | 'playing' | 'finished'
  joueurs  jsonb not null default '[]'::jsonb,  -- [{user_id,pseudo,avatar,role}]
  etat_jeu jsonb not null default '{}'::jsonb,
  date     timestamptz not null default now()
);
alter table public.poker_sessions enable row level security;
create index if not exists idx_poker_statut on public.poker_sessions (statut);

create or replace function public._poker_json(p_session uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'session', jsonb_build_object(
      'id', s.id, 'statut', s.statut,
      'date', (extract(epoch from s.date) * 1000)::bigint
    ),
    'joueurs', s.joueurs,
    'etat', s.etat_jeu
  ) from public.poker_sessions s where s.id = p_session;
$$;

-- Rejoint une salle d'attente (max 6) ou en crée une.
create or replace function public.poker_join(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.poker_sessions; v_u public.users;
begin
  select * into v_u from public.users where id = p_user;
  if v_u.id is null then return jsonb_build_object('error', 'no_user'); end if;

  select * into s from public.poker_sessions
    where statut = 'waiting' and jsonb_array_length(joueurs) < 6
    order by date desc limit 1 for update;
  if s.id is null then
    insert into public.poker_sessions default values returning * into s;
  end if;

  if not exists (
    select 1 from jsonb_array_elements(s.joueurs) e where (e->>'user_id')::uuid = p_user
  ) then
    update public.poker_sessions
      set joueurs = joueurs || jsonb_build_array(jsonb_build_object(
        'user_id', p_user, 'pseudo', v_u.pseudo, 'avatar', v_u.avatar, 'role', v_u.role))
      where id = s.id returning * into s;
  end if;
  return public._poker_json(s.id);
end; $$;

-- Démarre la partie (>= 3 joueurs) : distribue 3 fleurs + 1 crâne à chacun.
create or replace function public.poker_start(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.poker_sessions; v_players jsonb;
begin
  select * into s from public.poker_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'waiting' then return public._poker_json(p_session); end if;
  if jsonb_array_length(s.joueurs) < 3 then return public._poker_json(p_session); end if;

  select jsonb_agg(jsonb_build_object(
    'user_id', e->>'user_id', 'pseudo', e->>'pseudo', 'avatar', e->'avatar', 'role', e->>'role',
    'flowers', 3, 'skull', 1, 'stack', '[]'::jsonb, 'roundsWon', 0, 'out', false
  )) into v_players from jsonb_array_elements(s.joueurs) e;

  update public.poker_sessions
    set statut = 'playing',
        etat_jeu = jsonb_build_object(
          'phase', 'placing', 'players', v_players, 'turn', 0, 'round', 1,
          'bid', null, 'passed', '[]'::jsonb, 'flip', null,
          'log', 'La partie commence — posez vos cartes !'),
        date = now()
    where id = p_session;
  return public._poker_json(p_session);
end; $$;

-- Persiste l'état de jeu calculé côté client (transitions de tour).
create or replace function public.poker_save(p_session uuid, p_user uuid, p_etat jsonb, p_statut text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.poker_sessions
    set etat_jeu = p_etat,
        statut = coalesce(nullif(p_statut, ''), statut),
        date = now()
    where id = p_session and statut <> 'finished';
  return public._poker_json(p_session);
end; $$;

-- Fin de partie : +8 🍩 au gagnant, -3 🍩 aux autres (minimum 0). Tracé.
create or replace function public.poker_finish(p_session uuid, p_winner uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.poker_sessions;
begin
  select * into s from public.poker_sessions where id = p_session for update;
  if s.id is null or s.statut = 'finished' then return public._poker_json(p_session); end if;

  update public.users u set donuts = u.donuts + 8 where u.id = p_winner;
  update public.users u set donuts = greatest(0, u.donuts - 3)
    from jsonb_array_elements(s.joueurs) e
    where (e->>'user_id')::uuid = u.id and u.id <> p_winner;

  insert into public.transactions(user_id, type, montant, devise, description)
    select (e->>'user_id')::uuid,
           case when (e->>'user_id')::uuid = p_winner then 'gain' else 'depense' end,
           case when (e->>'user_id')::uuid = p_winner then 8 else -3 end,
           'donut',
           case when (e->>'user_id')::uuid = p_winner
                then 'Poker Donuts — victoire 🃏' else 'Poker Donuts — défaite 🃏' end
    from jsonb_array_elements(s.joueurs) e;

  update public.poker_sessions
    set statut = 'finished',
        etat_jeu = etat_jeu || jsonb_build_object('phase', 'game_over', 'winner', p_winner),
        date = now()
    where id = p_session;
  return public._poker_json(p_session);
end; $$;

create or replace function public.poker_state(p_session uuid)
returns jsonb language sql security definer set search_path = public as $$
  select public._poker_json(p_session);
$$;

create or replace function public.poker_leave(p_session uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.poker_sessions
    set joueurs = coalesce((
      select jsonb_agg(e) from jsonb_array_elements(joueurs) e
      where (e->>'user_id')::uuid <> p_user), '[]'::jsonb)
    where id = p_session and statut = 'waiting';
end; $$;

-- ============================================================
--  L'IMPOSTEUR 🕵️
-- ============================================================
create table if not exists public.imposteur_sessions (
  id            uuid primary key default gen_random_uuid(),
  statut        text not null default 'waiting',  -- 'waiting'|'playing'|'voting'|'finished'
  joueurs       jsonb not null default '[]'::jsonb,
  imposteur_id  uuid,
  pseudo_usurpe text,
  positions     jsonb not null default '{}'::jsonb,
  messages      jsonb not null default '[]'::jsonb,
  votes         jsonb not null default '{}'::jsonb,
  started_at    timestamptz,
  date          timestamptz not null default now()
);
alter table public.imposteur_sessions enable row level security;
create index if not exists idx_imposteur_statut on public.imposteur_sessions (statut);

-- Sérialise une session en masquant l'imposteur (révélé seulement à la fin).
-- Chaque avatar porte un "label" : vrai pseudo, sauf l'imposteur qui porte
-- le pseudo usurpé. `me.is_imposter` est calculé pour le demandeur uniquement.
create or replace function public._imposteur_json(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.imposteur_sessions; v_players jsonb; v_reveal jsonb := null; v_top uuid;
begin
  select * into s from public.imposteur_sessions where id = p_session;
  if s.id is null then return jsonb_build_object('error', 'not_found'); end if;

  select jsonb_agg(jsonb_build_object(
    'user_id', e->>'user_id',
    'avatar', e->'avatar',
    'role', e->>'role',
    'label', case when s.imposteur_id is not null and (e->>'user_id')::uuid = s.imposteur_id
                  then s.pseudo_usurpe else e->>'pseudo' end,
    'real', e->>'pseudo'
  )) into v_players from jsonb_array_elements(s.joueurs) e;

  if s.statut = 'finished' then
    select (value)::uuid into v_top from (
      select value, count(*) c from jsonb_each_text(s.votes) group by value order by c desc limit 1
    ) t;
    v_reveal := jsonb_build_object(
      'imposteur_id', s.imposteur_id,
      'pseudo_usurpe', s.pseudo_usurpe,
      'found', (v_top is not null and v_top = s.imposteur_id));
  end if;

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', s.id, 'statut', s.statut,
      'started_at', case when s.started_at is null then null else (extract(epoch from s.started_at) * 1000)::bigint end),
    'players', coalesce(v_players, '[]'::jsonb),
    'positions', s.positions,
    'messages', s.messages,
    'votes', s.votes,
    'me', jsonb_build_object(
      'is_imposter', (p_user = s.imposteur_id),
      'usurpe', case when p_user = s.imposteur_id then s.pseudo_usurpe else null end),
    'reveal', v_reveal
  );
end; $$;

-- Rejoint la salle d'attente (jusqu'à exactement 5). Au 5e joueur :
-- désignation secrète de l'imposteur + pseudo usurpé, départ du chrono.
create or replace function public.imposteur_join(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.imposteur_sessions; v_u public.users; v_imp uuid; v_usurpe text;
begin
  select * into v_u from public.users where id = p_user;
  if v_u.id is null then return jsonb_build_object('error', 'no_user'); end if;

  select * into s from public.imposteur_sessions
    where statut = 'waiting' and jsonb_array_length(joueurs) < 5
    order by date desc limit 1 for update;
  if s.id is null then
    insert into public.imposteur_sessions default values returning * into s;
  end if;

  if not exists (
    select 1 from jsonb_array_elements(s.joueurs) e where (e->>'user_id')::uuid = p_user
  ) then
    update public.imposteur_sessions
      set joueurs = joueurs || jsonb_build_array(jsonb_build_object(
            'user_id', p_user, 'pseudo', v_u.pseudo, 'avatar', v_u.avatar, 'role', v_u.role)),
          positions = positions || jsonb_build_object(p_user::text, jsonb_build_object('x', 50, 'y', 50))
      where id = s.id returning * into s;
  end if;

  -- 5 joueurs → on lance la partie.
  if jsonb_array_length(s.joueurs) >= 5 and s.statut = 'waiting' then
    select (e->>'user_id')::uuid into v_imp
      from jsonb_array_elements(s.joueurs) e order by random() limit 1;
    select e->>'pseudo' into v_usurpe
      from jsonb_array_elements(s.joueurs) e
      where (e->>'user_id')::uuid <> v_imp order by random() limit 1;
    update public.imposteur_sessions
      set statut = 'playing', imposteur_id = v_imp, pseudo_usurpe = v_usurpe, started_at = now()
      where id = s.id;
  end if;

  return public._imposteur_json(s.id, p_user);
end; $$;

create or replace function public.imposteur_state(p_session uuid, p_user uuid)
returns jsonb language sql security definer set search_path = public as $$
  select public._imposteur_json(p_session, p_user);
$$;

-- Déplacement (position en % de la map).
create or replace function public.imposteur_move(p_session uuid, p_user uuid, p_x numeric, p_y numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.imposteur_sessions
    set positions = positions || jsonb_build_object(p_user::text, jsonb_build_object('x', p_x, 'y', p_y))
    where id = p_session;
end; $$;

-- Message de chat : attribué au LABEL du joueur (l'imposteur écrit sous le pseudo usurpé).
create or replace function public.imposteur_chat(p_session uuid, p_user uuid, p_text text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.imposteur_sessions; v_author text;
begin
  if p_text is null or length(btrim(p_text)) = 0 then return public._imposteur_json(p_session, p_user); end if;
  select * into s from public.imposteur_sessions where id = p_session;
  if s.id is null then return jsonb_build_object('error', 'not_found'); end if;

  if p_user = s.imposteur_id then v_author := s.pseudo_usurpe;
  else
    select e->>'pseudo' into v_author from jsonb_array_elements(s.joueurs) e
      where (e->>'user_id')::uuid = p_user;
  end if;

  update public.imposteur_sessions
    set messages = messages || jsonb_build_array(jsonb_build_object(
      'user_id', p_user, 'author', v_author, 'text', left(btrim(p_text), 300),
      'ts', (extract(epoch from now()) * 1000)::bigint))
    where id = p_session;
  return public._imposteur_json(p_session, p_user);
end; $$;

-- Passe en phase de vote (après les 2 minutes).
create or replace function public.imposteur_set_voting(p_session uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.imposteur_sessions set statut = 'voting'
    where id = p_session and statut = 'playing';
end; $$;

-- Résolution : calcule le résultat du vote, crédite les donuts, révèle.
create or replace function public.imposteur_resolve(p_session uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.imposteur_sessions; v_top uuid; v_found boolean;
begin
  select * into s from public.imposteur_sessions where id = p_session for update;
  if s.id is null or s.statut = 'finished' then return public._imposteur_json(p_session, null); end if;

  -- Cible la plus votée (pluralité). Égalité / autre que l'imposteur → non trouvé.
  select (value)::uuid into v_top from (
    select value, count(*) c from jsonb_each_text(s.votes) group by value order by c desc limit 1
  ) t;
  v_found := (v_top is not null and v_top = s.imposteur_id);

  if v_found then
    update public.users set donuts = greatest(0, donuts - 3) where id = s.imposteur_id;
    update public.users u set donuts = u.donuts + 5
      from jsonb_array_elements(s.joueurs) e
      where (e->>'user_id')::uuid = u.id and u.id <> s.imposteur_id;
    insert into public.transactions(user_id, type, montant, devise, description)
      select (e->>'user_id')::uuid,
             case when (e->>'user_id')::uuid = s.imposteur_id then 'depense' else 'gain' end,
             case when (e->>'user_id')::uuid = s.imposteur_id then -3 else 5 end,
             'donut',
             case when (e->>'user_id')::uuid = s.imposteur_id
                  then 'L''Imposteur — démasqué 🕵️' else 'L''Imposteur — bonne déduction 🕵️' end
      from jsonb_array_elements(s.joueurs) e;
  else
    update public.users set donuts = donuts + 5 where id = s.imposteur_id;
    update public.users u set donuts = greatest(0, u.donuts - 2)
      from jsonb_array_elements(s.joueurs) e
      where (e->>'user_id')::uuid = u.id and u.id <> s.imposteur_id;
    insert into public.transactions(user_id, type, montant, devise, description)
      select (e->>'user_id')::uuid,
             case when (e->>'user_id')::uuid = s.imposteur_id then 'gain' else 'depense' end,
             case when (e->>'user_id')::uuid = s.imposteur_id then 5 else -2 end,
             'donut',
             case when (e->>'user_id')::uuid = s.imposteur_id
                  then 'L''Imposteur — non démasqué 🕵️' else 'L''Imposteur — trompé 🕵️' end
      from jsonb_array_elements(s.joueurs) e;
  end if;

  update public.imposteur_sessions set statut = 'finished' where id = p_session;
  return public._imposteur_json(p_session, null);
end; $$;

-- Vote pour un suspect. Quand tout le monde a voté → résolution automatique.
create or replace function public.imposteur_vote(p_session uuid, p_user uuid, p_target uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.imposteur_sessions;
begin
  update public.imposteur_sessions
    set votes = votes || jsonb_build_object(p_user::text, p_target::text),
        statut = case when statut = 'playing' then 'voting' else statut end
    where id = p_session and statut in ('playing', 'voting')
    returning * into s;
  if s.id is null then return public._imposteur_json(p_session, p_user); end if;

  if (select count(*) from jsonb_object_keys(s.votes)) >= jsonb_array_length(s.joueurs) then
    return public.imposteur_resolve(p_session);
  end if;
  return public._imposteur_json(p_session, p_user);
end; $$;

create or replace function public.imposteur_leave(p_session uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.imposteur_sessions
    set joueurs = coalesce((
      select jsonb_agg(e) from jsonb_array_elements(joueurs) e
      where (e->>'user_id')::uuid <> p_user), '[]'::jsonb)
    where id = p_session and statut = 'waiting';
end; $$;

-- ------------------------------------------------------------
--  Grants
-- ------------------------------------------------------------
grant execute on function public.poker_join(uuid) to anon, authenticated;
grant execute on function public.poker_start(uuid, uuid) to anon, authenticated;
grant execute on function public.poker_save(uuid, uuid, jsonb, text) to anon, authenticated;
grant execute on function public.poker_finish(uuid, uuid) to anon, authenticated;
grant execute on function public.poker_state(uuid) to anon, authenticated;
grant execute on function public.poker_leave(uuid, uuid) to anon, authenticated;

grant execute on function public.imposteur_join(uuid) to anon, authenticated;
grant execute on function public.imposteur_state(uuid, uuid) to anon, authenticated;
grant execute on function public.imposteur_move(uuid, uuid, numeric, numeric) to anon, authenticated;
grant execute on function public.imposteur_chat(uuid, uuid, text) to anon, authenticated;
grant execute on function public.imposteur_set_voting(uuid) to anon, authenticated;
grant execute on function public.imposteur_vote(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.imposteur_resolve(uuid) to anon, authenticated;
grant execute on function public.imposteur_leave(uuid, uuid) to anon, authenticated;
