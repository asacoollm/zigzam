-- ============================================================
--  ZIGZAM — Corrections Méga Boîtes 📦
--   1. Suppression des burgers du contenu des méga boîtes (ni bonus, ni
--      récompense) : les burgers restent uniquement achetables au Shop.
--   2. Évolution de boîte à l'achat : 15% de chance de monter d'UN niveau
--      (sauf IMPOSSIBLE, déjà au max), calculée côté serveur (anti-triche).
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. Templates : suppression de burger_bonus du contenu.
-- ------------------------------------------------------------
insert into public.mega_boites_templates (niveau, nom, prix_burgers, contenu_fixe, probabilites) values
  ('normal',     'Normal 🟢',         40,  '{"donuts":[15,25], "gemmes":[2,3]}',   '{"skin":0.25,"pool":"payants"}'),
  ('rare',       'Rare 🔵',           55,  '{"donuts":[30,50], "gemmes":[4,6]}',   '{"skin":0.5, "pool":"payants"}'),
  ('super_rare', 'Super Rare 🟣',     80,  '{"donuts":[60,100],"gemmes":[8,12]}',  '{"skin":1,   "pool":"payants"}'),
  ('incroyable', 'Incroyable 🟠',     120, '{"donuts":[150,200],"gemmes":[20,25]}','{"skin":1,   "pool":"rares"}'),
  ('impossible', 'IMPOSSIBLE !!! 🔴', 200, '{"donuts":[300,500],"gemmes":[40,50]}','{"skin":1,   "pool":"legendaires"}')
on conflict (niveau) do update
  set nom = excluded.nom,
      prix_burgers = excluded.prix_burgers,
      contenu_fixe = excluded.contenu_fixe,
      probabilites = excluded.probabilites;

-- ------------------------------------------------------------
--  2. Colonne evolved : la boîte a-t-elle évolué à l'achat ?
-- ------------------------------------------------------------
alter table public.mega_boites add column if not exists evolved boolean not null default false;

-- ------------------------------------------------------------
--  Achat d'une méga boîte : prix du niveau demandé, puis 15% de chance
--  d'évoluer d'un niveau (offert, ne change pas le prix payé).
-- ------------------------------------------------------------
create or replace function public.buy_mega_boite(p_user uuid, p_niveau text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prix int; v_burgers int; v_id uuid;
  v_final text; v_evolved boolean := false;
begin
  select prix_burgers into v_prix from public.mega_boites_templates where niveau = p_niveau;
  if v_prix is null then
    return jsonb_build_object('error', 'niveau_invalide');
  end if;

  select burgers into v_burgers from public.users where id = p_user for update;
  if v_burgers is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_burgers < v_prix then return jsonb_build_object('error', 'not_enough'); end if;

  update public.users set burgers = burgers - v_prix where id = p_user returning burgers into v_burgers;
  perform public._log_tx(p_user, 'achat', -v_prix, 'burger', 'Méga boîte ' || p_niveau || ' achetée');

  -- 15% de chance d'évolution d'un niveau (sauf IMPOSSIBLE, déjà au max).
  v_final := p_niveau;
  if p_niveau <> 'impossible' and random() < 0.15 then
    v_evolved := true;
    v_final := case p_niveau
      when 'normal' then 'rare'
      when 'rare' then 'super_rare'
      when 'super_rare' then 'incroyable'
      when 'incroyable' then 'impossible'
      else p_niveau
    end;
  end if;

  insert into public.mega_boites (user_id, niveau, evolved, contenu)
  values (
    p_user, v_final, v_evolved,
    jsonb_build_object('mode', 'aleatoire', 'niveau', v_final, 'niveau_achete', p_niveau)
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true, 'id', v_id, 'burgers', v_burgers,
    'evolved', v_evolved, 'niveau_achete', p_niveau, 'niveau_final', v_final
  );
end; $$;

-- ------------------------------------------------------------
--  Méga boîtes non ouvertes : on expose niveau_achete + evolved pour que
--  l'animation d'évolution puisse être rejouée avant l'ouverture.
-- ------------------------------------------------------------
create or replace function public.get_my_mega_boites(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id, 'niveau', b.niveau, 'evolved', b.evolved,
    'niveau_achete', coalesce(b.contenu->>'niveau_achete', b.niveau),
    'date_achat', b.date_achat
  ) order by b.date_achat desc), '[]'::jsonb)
  into v
  from public.mega_boites b
  where b.user_id = p_user and b.ouverte = false;
  return v;
end; $$;

-- ------------------------------------------------------------
--  Ouverture d'une méga boîte : plus aucun burger dans le contenu.
--  Doublon de skin → compensation en gemmes (comme les boîtes mystères).
-- ------------------------------------------------------------
create or replace function public.open_mega_boite(p_user uuid, p_boite uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_niveau text; v_ouverte boolean;
  v_fixe jsonb; v_prob jsonb; v_pool text; v_minprice int;
  v_donuts int; v_gemmes int;
  v_cat text; v_item text; v_skin jsonb := null;
  v_avatar jsonb; v_owned jsonb; v_key text;
  v_price int; v_compense int := 0;
  v_new_d int; v_new_g int; v_new_b int;
begin
  select niveau, ouverte into v_niveau, v_ouverte
  from public.mega_boites
  where id = p_boite and user_id = p_user
  for update;

  if v_niveau is null then
    return jsonb_build_object('error', 'introuvable');
  end if;
  if v_ouverte then
    return jsonb_build_object('error', 'deja_ouverte');
  end if;

  select contenu_fixe, probabilites into v_fixe, v_prob
  from public.mega_boites_templates where niveau = v_niveau;
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
    v_minprice := case v_pool when 'legendaires' then 5 when 'rares' then 4 else 1 end;
    select category, item_id into v_cat, v_item
    from public.accessoires_catalogue
    where price >= v_minprice
    order by random() limit 1;
  end if;

  -- Skin éventuel : si déjà possédé → compensation en gemmes ; sinon ajout + équipement.
  if v_cat is not null and v_item is not null then
    v_avatar := coalesce((select avatar from public.users where id = p_user), '{}'::jsonb);
    v_owned := coalesce(v_avatar->'owned', '[]'::jsonb);
    v_key := v_cat || ':' || v_item;

    if v_owned ? v_key then
      select price into v_price from public.accessoires_catalogue
        where category = v_cat and item_id = v_item;
      v_price := coalesce(v_price, 1);
      v_compense := case when v_price <= 2 then 2 when v_price <= 4 then 4 else 6 end;
      v_gemmes := v_gemmes + v_compense;
      v_skin := null;
    else
      v_owned := v_owned || to_jsonb(v_key);
      v_avatar := jsonb_set(v_avatar, '{owned}', v_owned, true);
      v_avatar := jsonb_set(v_avatar, array[v_cat], to_jsonb(v_item), true);
      update public.users set avatar = v_avatar where id = p_user;
      v_skin := jsonb_build_object('category', v_cat, 'item', v_item);
    end if;
  end if;

  update public.users
    set donuts = donuts + v_donuts, gemmes = gemmes + v_gemmes
    where id = p_user
    returning donuts, gemmes, burgers, avatar into v_new_d, v_new_g, v_new_b, v_avatar;

  if v_donuts > 0 then perform public._log_tx(p_user, 'gain', v_donuts, 'donut', 'Méga boîte 📦'); end if;
  if v_gemmes > 0 then
    perform public._log_tx(p_user, 'gain', v_gemmes, 'gemme',
      case when v_compense > 0 then 'Méga boîte 📦 (doublon compensé)' else 'Méga boîte 📦' end);
  end if;

  update public.mega_boites
    set ouverte = true,
        date_ouverture = now(),
        contenu = jsonb_build_object(
          'niveau', v_niveau, 'donuts', v_donuts, 'gemmes', v_gemmes,
          'skin', v_skin, 'doublon', v_compense)
    where id = p_boite;

  return jsonb_build_object(
    'ok', true, 'niveau', v_niveau, 'donuts', v_donuts, 'gemmes', v_gemmes,
    'skin', v_skin, 'doublon', v_compense, 'avatar', v_avatar,
    'soldes', jsonb_build_object('donuts', v_new_d, 'gemmes', v_new_g, 'burgers', v_new_b)
  );
end; $$;

grant execute on function public.buy_mega_boite(uuid, text) to anon, authenticated;
grant execute on function public.get_my_mega_boites(uuid) to anon, authenticated;
grant execute on function public.open_mega_boite(uuid, uuid) to anon, authenticated;
