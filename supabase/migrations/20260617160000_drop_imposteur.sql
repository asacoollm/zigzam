-- ============================================================
--  ZIGZAM — Suppression du jeu « L'Imposteur »
--   Retire toutes les fonctions RPC et la table de sessions.
--  Idempotent.
-- ============================================================

drop function if exists public.imposteur_join(uuid);
drop function if exists public.imposteur_state(uuid, uuid);
drop function if exists public.imposteur_move(uuid, uuid, numeric, numeric);
drop function if exists public.imposteur_chat(uuid, uuid, text);
drop function if exists public.imposteur_vote(uuid, uuid, uuid);
drop function if exists public.imposteur_resolve(uuid);
drop function if exists public.imposteur_leave(uuid, uuid);
drop function if exists public.imposteur_set_voting(uuid);
drop function if exists public._imposteur_json(uuid, uuid);

drop table if exists public.imposteur_sessions cascade;
