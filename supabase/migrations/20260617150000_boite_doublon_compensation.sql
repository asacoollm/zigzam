-- ============================================================
--  ZIGZAM — Boîtes Mystères : compensation des doublons 🎁💎
--   Si le skin tiré (ou choisi) est déjà possédé par l'utilisateur,
--   on ne le redonne pas : on compense en gemmes selon son prix.
--     prix 1-2 💎 → +2 💎 · prix 3-4 💎 → +4 💎 · prix 5+ 💎 → +6 💎
--   Géré entièrement côté serveur (anti-triche).
--  Idempotent (create or replace de open_boite).
-- ============================================================

create or replace function public.open_boite(p_user uuid, p_boite uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_type text; v_contenu jsonb; v_mode text; v_niveau text; v_ouverte boolean;
  v_fixe jsonb; v_prob jsonb;
  v_donuts int; v_gemmes int;
  v_skin jsonb := null; v_cat text; v_item text; v_minprice int;
  v_avatar jsonb; v_owned jsonb; v_key text; v_pool text;
  v_new_donuts int; v_new_gemmes int;
  v_price int; v_compense int := 0;
begin
  -- Verrou sur la boîte (anti double-ouverture concurrente).
  select type, contenu, ouverte into v_type, v_contenu, v_ouverte
  from public.boites_mysteres
  where id = p_boite and destinataire_id = p_user
  for update;

  if v_type is null then
    return jsonb_build_object('error', 'introuvable');
  end if;
  if v_ouverte then
    return jsonb_build_object('error', 'deja_ouverte');
  end if;

  v_mode := coalesce(v_contenu->>'mode', 'aleatoire');

  if v_mode = 'fixe' then
    -- Boîte personnalisée : contenu choisi par l'admin.
    v_niveau := 'personnalisee';
    v_donuts := greatest(0, coalesce((v_contenu->>'donuts')::int, 0));
    v_gemmes := greatest(0, coalesce((v_contenu->>'gemmes')::int, 0));
    if v_contenu->'skin' is not null and jsonb_typeof(v_contenu->'skin') = 'object' then
      v_cat := v_contenu->'skin'->>'category';
      v_item := v_contenu->'skin'->>'item';
    end if;
  else
    -- Boîte aléatoire : on tire selon le template du niveau.
    v_niveau := coalesce(v_contenu->>'niveau', v_type);
    select contenu_fixe, probabilites into v_fixe, v_prob
    from public.boites_templates where niveau = v_niveau;
    if v_fixe is null then
      return jsonb_build_object('error', 'niveau_invalide');
    end if;

    v_donuts := floor(random() * ((v_fixe->'donuts'->>1)::int - (v_fixe->'donuts'->>0)::int + 1))::int
                + (v_fixe->'donuts'->>0)::int;
    v_gemmes := floor(random() * ((v_fixe->'gemmes'->>1)::int - (v_fixe->'gemmes'->>0)::int + 1))::int
                + (v_fixe->'gemmes'->>0)::int;

    -- Tirage du skin selon la probabilité et le pool du niveau.
    v_pool := v_prob->>'pool';
    if v_pool is not null and random() < coalesce((v_prob->>'skin')::float, 0) then
      v_minprice := case when v_pool = 'rares' then 4 else 1 end;
      select category, item_id into v_cat, v_item
      from public.accessoires_catalogue
      where price >= v_minprice
      order by random() limit 1;
    end if;
  end if;

  -- Skin éventuel : si déjà possédé → compensation en gemmes ; sinon ajout + équipement.
  if v_cat is not null and v_item is not null then
    v_avatar := coalesce((select avatar from public.users where id = p_user), '{}'::jsonb);
    v_owned := coalesce(v_avatar->'owned', '[]'::jsonb);
    v_key := v_cat || ':' || v_item;

    if v_owned ? v_key then
      -- Doublon : aucune duplication, compensation en gemmes selon le prix.
      select price into v_price from public.accessoires_catalogue
        where category = v_cat and item_id = v_item;
      v_price := coalesce(v_price, 1);
      v_compense := case when v_price <= 2 then 2 when v_price <= 4 then 4 else 6 end;
      v_gemmes := v_gemmes + v_compense;  -- ajouté au total de gemmes obtenu
      v_skin := null;                     -- pas de skin donné
    else
      -- Nouveau skin : ajout à la collection + équipement.
      v_owned := v_owned || to_jsonb(v_key);
      v_avatar := jsonb_set(v_avatar, '{owned}', v_owned, true);
      v_avatar := jsonb_set(v_avatar, array[v_cat], to_jsonb(v_item), true);
      update public.users set avatar = v_avatar where id = p_user;
      v_skin := jsonb_build_object('category', v_cat, 'item', v_item);
    end if;
  end if;

  -- Crédit des donuts / gemmes (gemmes inclut l'éventuelle compensation).
  update public.users
    set donuts = donuts + v_donuts, gemmes = gemmes + v_gemmes
    where id = p_user
    returning donuts, gemmes, avatar into v_new_donuts, v_new_gemmes, v_avatar;

  if v_donuts > 0 then perform public._log_tx(p_user, 'gain', v_donuts, 'donut', 'Boîte mystère 🎁'); end if;
  if v_gemmes > 0 then
    perform public._log_tx(p_user, 'gain', v_gemmes, 'gemme',
      case when v_compense > 0 then 'Boîte mystère 🎁 (doublon compensé)' else 'Boîte mystère 🎁' end);
  end if;

  -- Marque la boîte ouverte + mémorise le contenu réellement obtenu.
  update public.boites_mysteres
    set ouverte = true,
        date_ouverture = now(),
        contenu = jsonb_build_object(
          'niveau', v_niveau, 'donuts', v_donuts, 'gemmes', v_gemmes,
          'skin', v_skin, 'doublon', v_compense)
    where id = p_boite;

  return jsonb_build_object(
    'ok', true,
    'niveau', v_niveau,
    'donuts', v_donuts,
    'gemmes', v_gemmes,
    'skin', v_skin,
    'doublon', v_compense,
    'avatar', v_avatar,
    'soldes', jsonb_build_object('donuts', v_new_donuts, 'gemmes', v_new_gemmes)
  );
end; $$;

grant execute on function public.open_boite(uuid, uuid) to anon, authenticated;
