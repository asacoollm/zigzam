-- ============================================================
--  ZIGZAM — Skin Sur Mesure ⭐ : « Marin Glacier Vintage » pour Penpen
--  (clé item_id = penpenmarin).
--
--   - Créé via la RPC existante public.admin_create_custom_skin(...)
--     — cf. migration 20260809130000_skins_sur_mesure.sql.
--   - Statut par défaut 'en_attente' : INVISIBLE pour Penpen tant
--     qu'Asacool (superadmin) ne l'a pas validé depuis /admin
--     (section « Skins Sur Mesure en attente »).
--   - Le SVG du bonhomme vit dans src/components/avatarParts.jsx
--     (registre CUSTOM_FULL, rendu par renderFull()).
--   - AUCUNE validation automatique ici : le workflow normal est
--     respecté (le superadmin valide à la main).
--  Idempotent : admin_create_custom_skin ignore un item_id déjà pris.
--  Pseudo comparé en ILIKE 'penpen%' (suffixe emojis possible).
-- ============================================================

do $$
declare
  v_penpen uuid;
  v_admin  uuid;
  v_res    jsonb;
begin
  select id into v_penpen
  from public.users
  where pseudo ilike 'penpen%'
  limit 1;

  select id into v_admin
  from public.users
  where role = 'superadmin'
  order by (pseudo = 'Asacool') desc
  limit 1;

  if v_penpen is null then
    raise notice 'penpenmarin : aucun membre « Penpen » trouvé — seed ignoré.';
  elsif v_admin is null then
    raise notice 'penpenmarin : aucun superadmin trouvé — seed ignoré.';
  else
    v_res := public.admin_create_custom_skin(
      v_admin,
      v_penpen,
      'penpenmarin',
      'Marin Glacier Vintage',
      'full',
      'Uniforme de marin / glacier vintage : chemise et col marin bleu marine à liseré blanc, casquette blanche de marin à petite étoile, short crème, et badge rond « Glaces Zigzam » (cornet stylisé) sur la poitrine.'
    );
    raise notice 'penpenmarin : admin_create_custom_skin -> %', v_res;
  end if;
end $$;
