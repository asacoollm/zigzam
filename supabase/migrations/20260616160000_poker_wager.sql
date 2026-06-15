-- ============================================================
--  ZIGZAM — Poker Donuts : PARI personnel du challenger 🍩
--  Quand un joueur lance un défi, il peut parier des donuts (perso) :
--   - défi réussi  → +montant parié
--   - défi échoué  → -montant parié (minimum 0)
--  Crédité côté serveur (anti-triche) et tracé dans transactions.
--  (Le bonus de fin de partie +8/-3 reste géré par poker_finish.)
--  Idempotent.
-- ============================================================
create or replace function public.poker_wager(p_user uuid, p_amount int, p_won boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_donuts int; v_amt int;
begin
  v_amt := greatest(0, coalesce(p_amount, 0));
  if v_amt = 0 then
    select donuts into v_donuts from public.users where id = p_user;
    return jsonb_build_object('ok', true, 'donuts', v_donuts);
  end if;

  if p_won then
    update public.users set donuts = donuts + v_amt where id = p_user
      returning donuts into v_donuts;
    perform public._log_tx(p_user, 'gain', v_amt, 'donut', 'Poker Donuts — pari gagné 🍩');
  else
    update public.users set donuts = greatest(0, donuts - v_amt) where id = p_user
      returning donuts into v_donuts;
    perform public._log_tx(p_user, 'depense', -v_amt, 'donut', 'Poker Donuts — pari perdu 🍩');
  end if;

  if v_donuts is null then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'donuts', v_donuts);
end; $$;

grant execute on function public.poker_wager(uuid, int, boolean) to anon, authenticated;
