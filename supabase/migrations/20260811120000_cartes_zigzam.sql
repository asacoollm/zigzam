-- ============================================================
--  ZIGZAM — Cartes Zigzam Collectore 🃏
--   57 cartes (30 normales, 15 rares, 8 super rares, 3 incroyables,
--   1 IMPOSSIBLE unique) obtenues via la roulette (5 🍩 / tour).
--   Le skin de chaque carte réutilise le catalogue d'avatar existant
--   (couleur + chapeau + lunettes) — pas de nouveaux dessins SVG,
--   rendu directement par le composant FallGuy déjà en place.
--  Idempotent.
-- ============================================================

create table if not exists public.zigzam_cards (
  id               uuid primary key default gen_random_uuid(),
  nom              text not null,
  rarete           text not null check (rarete in ('normale', 'rare', 'super_rare', 'incroyable', 'impossible')),
  type             text not null check (type in ('donut', 'gemme', 'lave')),
  skin_data        jsonb not null default '{}',
  image_url        text,
  unique_owner_id  uuid references public.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

create table if not exists public.card_collection (
  user_id         uuid not null references public.users(id) on delete cascade,
  card_id         uuid not null references public.zigzam_cards(id) on delete cascade,
  date_obtention  timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.roulette_history (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id uuid not null references public.zigzam_cards(id) on delete cascade,
  date    timestamptz not null default now()
);

-- File d'attente légère pour la notif du transfert de la carte IMPOSSIBLE
-- (même patron que pouper_notifications) : remise au prochain passage
-- sur le dashboard, même si l'ancien détenteur n'est pas connecté.
create table if not exists public.card_notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  card_id      uuid not null references public.zigzam_cards(id) on delete cascade,
  card_nom     text not null,
  type         text not null check (type in ('gagnee', 'perdue')),
  autre_pseudo text,
  vue          boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.zigzam_cards       enable row level security; -- accès via RPC uniquement
alter table public.card_collection    enable row level security; -- accès via RPC uniquement
alter table public.roulette_history   enable row level security; -- accès via RPC uniquement
alter table public.card_notifications enable row level security; -- accès via RPC uniquement
create index if not exists idx_card_collection_user on public.card_collection (user_id);
create index if not exists idx_roulette_history_user on public.roulette_history (user_id, date desc);
create index if not exists idx_card_notif_user on public.card_notifications (user_id, vue);

-- ------------------------------------------------------------
--  Seed des 57 cartes (une seule fois — idempotent).
--  Skins variés en réutilisant le catalogue d'avatar existant.
-- ------------------------------------------------------------
do $$
declare
  v_types      text[] := array['donut', 'gemme', 'lave'];
  v_type_noms  text[] := array['Donut', 'Gemme', 'Lave'];
  v_adjectifs  text[] := array[
    'Étincelant', 'Royal', 'Ardent', 'Mystique', 'Cosmique', 'Sauvage', 'Légendaire',
    'Éclatant', 'Glacé', 'Doré', 'Furtif', 'Éternel', 'Turbulent', 'Radieux',
    'Voltigeur', 'Scintillant', 'Impérial'
  ];
  v_colors  text[] := array[
    'rose', 'violet', 'bleu', 'vert', 'orange', 'jaune', 'rouge', 'turquoise',
    'gold', 'silver', 'holo', 'rainbow', 'galaxy', 'stars', 'flames', 'ocean'
  ];
  v_hats    text[] := array[
    'crown', 'halo', 'astronaut', 'witch', 'pirate', 'viking', 'tophat',
    'cowboy', 'sombrero', 'cactus', 'pizza', 'santa', 'grad', 'helmet'
  ];
  v_glasses text[] := array[
    'laser', 'diamond', 'led', 'rainbow', 'gold', 'stargiant', 'cyber', 'aviator'
  ];
  v_rec record;
  v_i int;
  v_global int := 0; -- compteur global (ne se réinitialise pas par rareté) → moins de collisions de skin
  v_type_idx int;
  v_nom text;
  v_skin jsonb;
begin
  if exists (select 1 from public.zigzam_cards) then
    return;
  end if;

  for v_rec in select * from (values
    ('normale', 30), ('rare', 15), ('super_rare', 8), ('incroyable', 3), ('impossible', 1)
  ) as t(rarete, qte)
  loop
    for v_i in 1..v_rec.qte loop
      v_global := v_global + 1;
      v_type_idx := 1 + (v_global % 3);
      v_nom := v_adjectifs[1 + (v_global % array_length(v_adjectifs, 1))]
        || ' ' || v_type_noms[v_type_idx];
      v_skin := jsonb_build_object(
        'color', v_colors[1 + (v_global % array_length(v_colors, 1))],
        'hat', v_hats[1 + ((v_global * 5) % array_length(v_hats, 1))],
        'glasses', v_glasses[1 + ((v_global * 11) % array_length(v_glasses, 1))]
      );
      insert into public.zigzam_cards(nom, rarete, type, skin_data)
        values (v_nom, v_rec.rarete, v_types[v_type_idx], v_skin);
    end loop;
  end loop;

  -- Le nom de la carte IMPOSSIBLE se démarque du lot.
  update public.zigzam_cards set nom = 'La Légende Zigzam' where rarete = 'impossible';
end $$;

-- ------------------------------------------------------------
--  Tirage de la roulette (5 🍩). SECURITY DEFINER : tout le calcul
--  (tirage, débit, transfert de la carte IMPOSSIBLE) se fait ici,
--  côté serveur, pour éviter la triche.
-- ------------------------------------------------------------
create or replace function public.spin_roulette(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_role text; v_donuts int;
  v_card public.zigzam_cards;
  v_already boolean;
  v_old_owner uuid; v_old_pseudo text; v_new_pseudo text;
  v_compensation int := 0;
begin
  select role, donuts into v_role, v_donuts from public.users where id = p_user for update;
  if v_role is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_role = 'superadmin' then return jsonb_build_object('error', 'superadmin_exclu'); end if;
  if v_donuts < 5 then return jsonb_build_object('error', 'not_enough'); end if;

  update public.users set donuts = donuts - 5 where id = p_user;
  perform public._log_tx(p_user, 'depense', -5, 'donut', 'Roulette Zigzam 🎰');

  -- Tirage uniforme parmi les 57 cartes : la répartition des quantités
  -- (30/15/8/3/1) fait déjà office de pondération par rareté.
  select * into v_card from public.zigzam_cards order by random() limit 1;

  select exists(
    select 1 from public.card_collection where user_id = p_user and card_id = v_card.id
  ) into v_already;

  -- Carte IMPOSSIBLE déjà détenue par quelqu'un d'autre → transfert.
  if v_card.rarete = 'impossible' and v_card.unique_owner_id is not null
     and v_card.unique_owner_id <> p_user then
    v_old_owner := v_card.unique_owner_id;
    select pseudo into v_old_pseudo from public.users where id = v_old_owner;
    select pseudo into v_new_pseudo from public.users where id = p_user;

    delete from public.card_collection where user_id = v_old_owner and card_id = v_card.id;
    update public.zigzam_cards set unique_owner_id = p_user where id = v_card.id;

    insert into public.card_notifications(user_id, card_id, card_nom, type, autre_pseudo)
      values (v_old_owner, v_card.id, v_card.nom, 'perdue', v_new_pseudo);
    insert into public.card_notifications(user_id, card_id, card_nom, type, autre_pseudo)
      values (p_user, v_card.id, v_card.nom, 'gagnee', v_old_pseudo);

    v_already := false; -- elle vient d'arriver dans sa collection
  elsif v_card.rarete = 'impossible' and v_card.unique_owner_id is null then
    update public.zigzam_cards set unique_owner_id = p_user where id = v_card.id;
  end if;

  if v_already then
    v_compensation := 2;
    update public.users set donuts = donuts + v_compensation where id = p_user;
    perform public._log_tx(p_user, 'gain', v_compensation, 'donut', 'Roulette Zigzam — carte déjà possédée 🎰');
  else
    insert into public.card_collection(user_id, card_id) values (p_user, v_card.id)
      on conflict do nothing;
  end if;

  insert into public.roulette_history(user_id, card_id) values (p_user, v_card.id);

  select donuts into v_donuts from public.users where id = p_user;

  return jsonb_build_object(
    'ok', true, 'donuts', v_donuts, 'compensation', v_compensation, 'deja_possedee', v_already,
    'carte', jsonb_build_object(
      'id', v_card.id, 'nom', v_card.nom, 'rarete', v_card.rarete, 'type', v_card.type,
      'skin_data', v_card.skin_data
    )
  );
end; $$;

grant execute on function public.spin_roulette(uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  Toutes les cartes + celles possédées par l'utilisateur (page /collection).
-- ------------------------------------------------------------
create or replace function public.get_my_cards(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'nom', c.nom, 'rarete', c.rarete, 'type', c.type, 'skin_data', c.skin_data,
    'possedee', exists(
      select 1 from public.card_collection cc where cc.user_id = p_user and cc.card_id = c.id
    )
  ) order by
    case c.rarete
      when 'impossible' then 5 when 'incroyable' then 4 when 'super_rare' then 3
      when 'rare' then 2 else 1
    end desc, c.nom
  ), '[]'::jsonb)
  into v
  from public.zigzam_cards c;
  return v;
end; $$;

grant execute on function public.get_my_cards(uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  Notifs en attente (transfert de la carte IMPOSSIBLE) — marquées
--  vues au passage, comme get_pending_pouper_notifications.
-- ------------------------------------------------------------
create or replace function public.get_pending_card_notifications(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'card_id', card_id, 'card_nom', card_nom, 'type', type, 'autre_pseudo', autre_pseudo
  ) order by created_at), '[]'::jsonb)
  into v
  from public.card_notifications
  where user_id = p_user and vue = false;

  update public.card_notifications set vue = true where user_id = p_user and vue = false;

  return v;
end; $$;

grant execute on function public.get_pending_card_notifications(uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  Superadmin : dernières cartes Incroyable/IMPOSSIBLE gagnées.
-- ------------------------------------------------------------
create or replace function public.admin_list_big_card_wins(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', h.id, 'date', h.date,
    'pseudo', u.pseudo,
    'carte', jsonb_build_object(
      'id', c.id, 'nom', c.nom, 'rarete', c.rarete, 'type', c.type, 'skin_data', c.skin_data
    )
  ) order by h.date desc), '[]'::jsonb)
  into v
  from public.roulette_history h
  join public.zigzam_cards c on c.id = h.card_id
  join public.users u on u.id = h.user_id
  where c.rarete in ('incroyable', 'impossible')
  limit 30;
  return v;
end; $$;

grant execute on function public.admin_list_big_card_wins(uuid) to anon, authenticated;
