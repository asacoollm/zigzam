-- ============================================================
--  ZIGZAM — Poker Donuts : BOTS 🤖
--   - poker_add_bot / poker_remove_bot : gèrent des joueurs virtuels
--     dans la salle d'attente (marqués is_bot, user_id aléatoire NON présent
--     dans users → pas de FK, donc exclus des récompenses/transactions).
--   - poker_start : embarque le drapeau is_bot dans l'état de jeu.
--   - poker_finish : ignore les bots (ni donuts, ni transactions).
--  Idempotent.
-- ============================================================

-- Ajoute un bot dans la salle d'attente (jusqu'à 6 joueurs).
create or replace function public.poker_add_bot(p_session uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.poker_sessions; v_bots int; v_names text[]; v_avs jsonb[]; v_i int;
begin
  select * into s from public.poker_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'waiting' then return public._poker_json(p_session); end if;
  if jsonb_array_length(s.joueurs) >= 6 then return public._poker_json(p_session); end if;

  v_names := array['Bot-Donut 🍩','Bot-Crâne 💀','Bot-Gemme 💎','Bot-Pizza 🍕','Bot-Fusée 🚀','Bot-Robot 🤖'];
  v_avs := array['{"color":"orange"}','{"color":"violet"}','{"color":"bleu"}','{"color":"vert"}','{"color":"rose"}','{"color":"gold"}']::jsonb[];
  select count(*) into v_bots from jsonb_array_elements(s.joueurs) e
    where coalesce((e->>'is_bot')::boolean, false);
  v_i := (v_bots % 6) + 1;

  update public.poker_sessions
    set joueurs = joueurs || jsonb_build_array(jsonb_build_object(
      'user_id', gen_random_uuid(), 'pseudo', v_names[v_i], 'avatar', v_avs[v_i],
      'role', 'user', 'is_bot', true))
    where id = p_session;
  return public._poker_json(p_session);
end; $$;

-- Retire le dernier bot de la salle d'attente.
create or replace function public.poker_remove_bot(p_session uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.poker_sessions; v_pos int;
begin
  select * into s from public.poker_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'waiting' then return public._poker_json(p_session); end if;

  select max(ord) into v_pos
    from jsonb_array_elements(s.joueurs) with ordinality e(val, ord)
    where coalesce((val->>'is_bot')::boolean, false);
  if v_pos is null then return public._poker_json(p_session); end if;

  update public.poker_sessions
    set joueurs = (
      select coalesce(jsonb_agg(val order by ord), '[]'::jsonb)
      from jsonb_array_elements(s.joueurs) with ordinality e(val, ord)
      where ord <> v_pos)
    where id = p_session;
  return public._poker_json(p_session);
end; $$;

-- Redéfinition : embarque is_bot dans l'état de jeu au démarrage.
create or replace function public.poker_start(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.poker_sessions; v_players jsonb;
begin
  select * into s from public.poker_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'waiting' then return public._poker_json(p_session); end if;
  if jsonb_array_length(s.joueurs) < 3 then return public._poker_json(p_session); end if;

  select jsonb_agg(jsonb_build_object(
    'user_id', e->>'user_id', 'pseudo', e->>'pseudo', 'avatar', e->'avatar', 'role', e->>'role',
    'is_bot', coalesce((e->>'is_bot')::boolean, false),
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

-- Redéfinition : les bots ne reçoivent ni donuts ni transaction (pas dans users).
create or replace function public.poker_finish(p_session uuid, p_winner uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.poker_sessions;
begin
  select * into s from public.poker_sessions where id = p_session for update;
  if s.id is null or s.statut = 'finished' then return public._poker_json(p_session); end if;

  update public.users u set donuts = u.donuts + 8 where u.id = p_winner;
  update public.users u set donuts = greatest(0, u.donuts - 3)
    from jsonb_array_elements(s.joueurs) e
    where (e->>'user_id')::uuid = u.id and u.id <> p_winner
      and coalesce((e->>'is_bot')::boolean, false) = false;

  insert into public.transactions(user_id, type, montant, devise, description)
    select (e->>'user_id')::uuid,
           case when (e->>'user_id')::uuid = p_winner then 'gain' else 'depense' end,
           case when (e->>'user_id')::uuid = p_winner then 8 else -3 end,
           'donut',
           case when (e->>'user_id')::uuid = p_winner
                then 'Poker Donuts — victoire 🃏' else 'Poker Donuts — défaite 🃏' end
    from jsonb_array_elements(s.joueurs) e
    where coalesce((e->>'is_bot')::boolean, false) = false;

  update public.poker_sessions
    set statut = 'finished',
        etat_jeu = etat_jeu || jsonb_build_object('phase', 'game_over', 'winner', p_winner),
        date = now()
    where id = p_session;
  return public._poker_json(p_session);
end; $$;

grant execute on function public.poker_add_bot(uuid) to anon, authenticated;
grant execute on function public.poker_remove_bot(uuid) to anon, authenticated;
