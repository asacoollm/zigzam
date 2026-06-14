-- ============================================================
--  ZIGZAM — Floor is Lava : niveaux progressifs + récompenses 🍩
--   - users.flava_niveau : plus haut niveau atteint/débloqué (défaut 1)
--   - get_flava_level(uuid) : renvoie le niveau sauvegardé
--   - flava_win(uuid, int)  : crédite la récompense du niveau gagné
--     (montant calculé CÔTÉ SERVEUR, anti-triche), trace dans transactions,
--     et met à jour le niveau max atteint.
--  Idempotent.
-- ============================================================

alter table public.users
  add column if not exists flava_niveau int not null default 1;

-- Niveau sauvegardé (le joueur reprend là où il en était).
create or replace function public.get_flava_level(p_user uuid)
returns int language sql security definer set search_path = public as $$
  select coalesce(flava_niveau, 1) from public.users where id = p_user;
$$;

-- Victoire d'un niveau : récompense en donuts (barème serveur) + sauvegarde.
create or replace function public.flava_win(p_user uuid, p_level int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_reward int; v_donuts int; v_niveau int;
begin
  if p_level is null or p_level < 1 then
    return jsonb_build_object('error', 'bad_level');
  end if;

  -- Barème : 1-3 → 3 🍩, 4-6 → 5, 7-9 → 8, 10+ → 12.
  v_reward := case
    when p_level <= 3 then 3
    when p_level <= 6 then 5
    when p_level <= 9 then 8
    else 12
  end;

  update public.users
  set donuts = donuts + v_reward,
      flava_niveau = greatest(flava_niveau, p_level + 1)
  where id = p_user
  returning donuts, flava_niveau into v_donuts, v_niveau;

  if v_donuts is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  perform public._log_tx(p_user, 'gain', v_reward, 'donut',
    'Floor is Lava — niveau ' || p_level || ' réussi');

  return jsonb_build_object('ok', true, 'donuts', v_donuts, 'reward', v_reward, 'niveau', v_niveau);
end; $$;

grant execute on function public.get_flava_level(uuid) to anon, authenticated;
grant execute on function public.flava_win(uuid, int) to anon, authenticated;
