-- ============================================================
--  ZIGZAM — Map Zigzam 🗺️ : coffre du jour
--   Un coffre par pays, ouvrable une fois par 24h, qui donne des mini
--   pièces violettes 💜 propres à ce pays (map_mini_pieces).
--   - get_map_coffre_state() : état courant (dispo, prochaine ouverture, total)
--   - open_map_coffre()      : ouvre le coffre si dispo, crédite un gain aléatoire
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. get_map_coffre_state(p_user, p_pays_slug)
-- ------------------------------------------------------------
create or replace function public.get_map_coffre_state(p_user uuid, p_pays_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_derniere timestamptz;
  v_qte integer;
  v_dispo boolean;
begin
  select derniere_ouverture into v_derniere
  from public.map_coffres
  where user_id = p_user and pays_slug = p_pays_slug;

  select quantite into v_qte
  from public.map_mini_pieces
  where user_id = p_user and pays_slug = p_pays_slug;

  v_dispo := v_derniere is null or v_derniere < now() - interval '24 hours';

  return jsonb_build_object(
    'disponible', v_dispo,
    'prochaine_ouverture', case when v_dispo then null else v_derniere + interval '24 hours' end,
    'mini_pieces', coalesce(v_qte, 0)
  );
end; $$;

grant execute on function public.get_map_coffre_state(uuid, text) to anon, authenticated;

-- ------------------------------------------------------------
--  2. open_map_coffre(p_user, p_pays_slug)
-- ------------------------------------------------------------
create or replace function public.open_map_coffre(p_user uuid, p_pays_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_derniere timestamptz;
  v_gain integer;
  v_total integer;
begin
  select derniere_ouverture into v_derniere
  from public.map_coffres
  where user_id = p_user and pays_slug = p_pays_slug
  for update;

  if v_derniere is not null and v_derniere >= now() - interval '24 hours' then
    return jsonb_build_object('error', 'deja_ouvert');
  end if;

  v_gain := floor(random() * 6)::int + 3; -- entier entre 3 et 8 inclus

  insert into public.map_mini_pieces (user_id, pays_slug, quantite)
  values (p_user, p_pays_slug, v_gain)
  on conflict (user_id, pays_slug) do update
    set quantite = public.map_mini_pieces.quantite + v_gain
  returning quantite into v_total;

  insert into public.map_coffres (user_id, pays_slug, derniere_ouverture)
  values (p_user, p_pays_slug, now())
  on conflict (user_id, pays_slug) do update
    set derniere_ouverture = now();

  perform public._log_tx(p_user, 'gain', v_gain, 'map_piece', 'Coffre du jour — ' || p_pays_slug);

  return jsonb_build_object('gain', v_gain, 'mini_pieces', v_total);
end; $$;

grant execute on function public.open_map_coffre(uuid, text) to anon, authenticated;
