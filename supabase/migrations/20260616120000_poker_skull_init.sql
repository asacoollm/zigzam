-- ============================================================
--  ZIGZAM — Poker Donuts (refonte Skull) : démarrage simplifié.
--  poker_start passe la session en 'playing' avec un état { phase: 'init' } ;
--  l'HÔTE (1er joueur humain) construit l'état complet du jeu côté client
--  (règles de Skull) puis le persiste via poker_save. Évite toute logique
--  de jeu en SQL. Idempotent.
-- ============================================================
create or replace function public.poker_start(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.poker_sessions;
begin
  select * into s from public.poker_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'waiting' then return public._poker_json(p_session); end if;
  if jsonb_array_length(s.joueurs) < 3 then return public._poker_json(p_session); end if;

  update public.poker_sessions
    set statut = 'playing',
        etat_jeu = jsonb_build_object('phase', 'init'),
        date = now()
    where id = p_session;
  return public._poker_json(p_session);
end; $$;
