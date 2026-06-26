-- ============================================================
--  ZIGZAM — Suppression DÉFINITIVE de « Poker Donuts »
--  Retrait de toutes les fonctions RPC + de la table poker_sessions.
--  Idempotent (drop ... if exists).
-- ============================================================

drop function if exists public.poker_join(uuid);
drop function if exists public.poker_start(uuid, uuid);
drop function if exists public.poker_save(uuid, uuid, jsonb, text);
drop function if exists public.poker_finish(uuid, uuid);
drop function if exists public.poker_state(uuid);
drop function if exists public.poker_leave(uuid, uuid);
drop function if exists public.poker_add_bot(uuid);
drop function if exists public.poker_remove_bot(uuid);
drop function if exists public.poker_wager(uuid, int, boolean);
drop function if exists public._poker_json(uuid);

drop table if exists public.poker_sessions cascade;
