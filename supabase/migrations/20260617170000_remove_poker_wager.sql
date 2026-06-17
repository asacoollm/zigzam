-- ============================================================
--  ZIGZAM — Poker Donuts : suppression du système de PARI 🍩
--   Le pari personnel du challenger est retiré du jeu. Seule la
--   récompense de fin de partie (gagnant +8 🍩, perdants -3 🍩) reste,
--   gérée par public.poker_finish — inchangée.
--  Idempotent.
-- ============================================================
drop function if exists public.poker_wager(uuid, int, boolean);
