-- ============================================================
--  ZIGZAM — Floor is Lava : suppression du GAIN de donuts 🍩
--   Les niveaux ne rapportent plus de donuts. La fonction flava_win
--   ne fait plus que sauvegarder le plus haut niveau atteint
--   (le joueur reprend là où il en était) — aucune transaction.
--  Idempotent.
-- ============================================================

-- Victoire d'un niveau : sauvegarde du niveau max atteint (plus de récompense).
create or replace function public.flava_win(p_user uuid, p_level int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_niveau int;
begin
  if p_level is null or p_level < 1 then
    return jsonb_build_object('error', 'bad_level');
  end if;

  update public.users
  set flava_niveau = greatest(flava_niveau, p_level + 1)
  where id = p_user
  returning flava_niveau into v_niveau;

  if v_niveau is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  return jsonb_build_object('ok', true, 'niveau', v_niveau);
end; $$;

grant execute on function public.flava_win(uuid, int) to anon, authenticated;
