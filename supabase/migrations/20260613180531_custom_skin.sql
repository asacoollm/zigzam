-- ============================================================
--  ZIGZAM — Skin sur mesure : achat 20 💎 qui ouvre une discussion
--  privée avec Asacool (numéro 6767) + message « Achat vérifié ».
--  Atomique côté serveur → impossible de tricher.
--  Idempotent.
-- ============================================================

-- Assure le numéro 6767 pour Asacool (si libre).
update public.users
set numero = '6767'
where pseudo = 'Asacool'
  and (numero is null or numero <> '6767')
  and not exists (select 1 from public.users u2 where u2.numero = '6767' and u2.pseudo <> 'Asacool');

create or replace function public.buy_custom_skin(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_gemmes int; v_pseudo text; v_asacool uuid; v_disc uuid;
begin
  select gemmes, pseudo into v_gemmes, v_pseudo from public.users where id = p_user for update;
  if v_gemmes is null then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_gemmes < 20 then
    return jsonb_build_object('error', 'not_enough', 'gemmes', v_gemmes);
  end if;

  select id into v_asacool
  from public.users
  where numero = '6767' or pseudo = 'Asacool'
  order by (pseudo = 'Asacool') desc
  limit 1;
  if v_asacool is null then
    return jsonb_build_object('error', 'asacool_introuvable');
  end if;
  if v_asacool = p_user then
    return jsonb_build_object('error', 'cest_toi');
  end if;

  -- Débit des gemmes + trace
  update public.users set gemmes = gemmes - 20 where id = p_user returning gemmes into v_gemmes;
  perform public._log_tx(p_user, 'achat', -20, 'gemme', 'Skin sur mesure (Asacool)');

  -- Discussion privée acheteur <-> Asacool
  insert into public.discussions(titre, type, createur_id)
  values (null, 'prive', p_user) returning id into v_disc;
  insert into public.participants(discussion_id, user_id)
  values (v_disc, p_user), (v_disc, v_asacool)
  on conflict do nothing;

  -- Message officiel créé côté serveur (auteur = acheteur)
  insert into public.messages(discussion_id, auteur_id, contenu)
  values (
    v_disc, p_user,
    '✅ Achat vérifié' || chr(10) ||
    '🎨 Demande officielle de skin sur mesure de ' || v_pseudo ||
    ' ! Il a payé 20 💎 pour ce service. Décris ton skin de rêve à Asacool !'
  );

  return jsonb_build_object('ok', true, 'gemmes', v_gemmes, 'discussion_id', v_disc);
end; $$;

grant execute on function public.buy_custom_skin(uuid) to anon, authenticated;
