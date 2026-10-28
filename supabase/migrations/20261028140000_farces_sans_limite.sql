-- ============================================================
--  ZIGZAM — Farces d'Halloween : suppression des limites d'envoi 🎃
--   Les farces deviennent illimitées : on retire les deux contrôles
--   quotidiens (5/jour au total, 2/jour par destinataire) de
--   `send_farce`. Tout le reste est identique à la version actuelle
--   (20261028130000_farces_halloween.sql) : prix en donuts débité de
--   façon atomique, saison Halloween active obligatoire, opt-out du
--   destinataire, interrupteur global superadmin.
--  Idempotent.
-- ============================================================

create or replace function public.send_farce(
  p_expediteur uuid, p_destinataire uuid, p_type text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prix int; v_actives boolean; v_saison_ok boolean;
  v_donuts int; v_pseudo_exp text; v_pseudo_dest text; v_id uuid;
begin
  if p_type not in ('araignee', 'fantome', 'chauves_souris', 'citrouille') then
    return jsonb_build_object('error', 'type_invalide');
  end if;
  if p_expediteur = p_destinataire then
    return jsonb_build_object('error', 'soi_meme');
  end if;

  select exists (
    select 1 from public.saisons
    where slug = 'halloween' and actif
      and (date_debut is null or now() >= date_debut)
      and (date_fin is null or now() <= date_fin)
  ) into v_saison_ok;
  if not v_saison_ok then
    return jsonb_build_object('error', 'saison_inactive');
  end if;

  select coalesce(prix, 10), coalesce(actives, true) into v_prix, v_actives
  from public.farces_reglages where id = true;
  if not v_actives then
    return jsonb_build_object('error', 'farces_coupees');
  end if;

  -- Verrou sur l'expéditeur : protège le débit atomique des donuts.
  select donuts, pseudo into v_donuts, v_pseudo_exp
  from public.users where id = p_expediteur for update;
  if v_pseudo_exp is null then
    return jsonb_build_object('error', 'expediteur_introuvable');
  end if;

  select pseudo into v_pseudo_dest from public.users where id = p_destinataire;
  if v_pseudo_dest is null then
    return jsonb_build_object('error', 'dest_introuvable');
  end if;

  if exists (select 1 from public.farces_desactivees where user_id = p_destinataire) then
    return jsonb_build_object('error', 'destinataire_refuse');
  end if;

  if v_donuts < v_prix then
    return jsonb_build_object('error', 'not_enough_donuts', 'donuts', v_donuts);
  end if;

  update public.users set donuts = donuts - v_prix where id = p_expediteur
    returning donuts into v_donuts;
  perform public._log_tx(p_expediteur, 'depense', -v_prix, 'donut',
    'Farce envoyée à ' || v_pseudo_dest || ' 🎃');

  insert into public.farces (expediteur_id, destinataire_id, type, prix)
  values (p_expediteur, p_destinataire, p_type, v_prix)
  returning id into v_id;

  return jsonb_build_object(
    'ok', true, 'id', v_id, 'donuts', v_donuts, 'prix', v_prix,
    'destinataire_pseudo', v_pseudo_dest, 'expediteur_pseudo', v_pseudo_exp
  );
end; $$;

grant execute on function public.send_farce(uuid, uuid, text) to anon, authenticated;
