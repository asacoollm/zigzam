-- ============================================================
--  ZIGZAM — Floor is Lava multi : défaite collective 💀
--  Depuis la résurrection (#burned_until), un joueur ne meurt plus
--  jamais définitivement → la condition de défaite commune ('lose',
--  déjà prévue par le schéma) n'était plus jamais atteinte. On la
--  redéfinit : si TOUS les joueurs humains sont brûlés EN MÊME TEMPS,
--  la manche est perdue collectivement (statut → 'finished').
--  flava_burn renvoie désormais l'état de session (comme les autres
--  actions) pour que le client qui déclenche la défaite la voie
--  immédiatement, sans attendre le heartbeat.
--  Idempotent.
-- ============================================================

create or replace function public.flava_burn(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_sessions; v_total int; v_burned int;
begin
  update public.flava_players
    set burned_until = now() + interval '5 seconds', last_seen = now()
    where session_id = p_session and user_id = p_user
      and (burned_until is null or burned_until < now());

  select * into s from public.flava_sessions where id = p_session for update;
  if s.id is not null and s.statut = 'active' then
    select count(*) into v_total from public.flava_players where session_id = p_session;
    select count(*) into v_burned from public.flava_players
      where session_id = p_session and burned_until > now();
    if v_total > 0 and v_burned >= v_total then
      update public.flava_sessions set statut = 'finished', resultat = 'lose', updated_at = now()
        where id = p_session;
    end if;
  end if;

  return public._flava_session_json(p_session);
end; $$;
