-- ============================================================
--  ZIGZAM — Boîtes Mystères 🎁
--   Le superadmin envoie des boîtes (aléatoires par niveau de rareté
--   ou personnalisées) aux élèves. À l'ouverture, le contenu est tiré
--   et crédité côté serveur (anti-triche), skin inclus.
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  Catalogue des accessoires PAYANTS (pour le tirage des skins).
--  Source de vérité : src/lib/avatar.js (items dont price >= 1).
-- ------------------------------------------------------------
create table if not exists public.accessoires_catalogue (
  category text not null,
  item_id  text not null,
  price    int  not null,
  primary key (category, item_id)
);
-- Re-seed complet à chaque push (reste synchro avec le catalogue JS).
delete from public.accessoires_catalogue;
insert into public.accessoires_catalogue (category, item_id, price) values
  ('color','orange',1),
  ('color','jaune',1),
  ('color','rouge',1),
  ('color','blanc',1),
  ('color','noir',1),
  ('color','turquoise',2),
  ('color','ocean',3),
  ('color','sunset',3),
  ('color','dots',3),
  ('color','stripes',3),
  ('color','rainbow',4),
  ('color','galaxy',4),
  ('color','stars',4),
  ('color','camo',4),
  ('color','flames',4),
  ('color','silver',4),
  ('color','gold',5),
  ('color','holo',5),
  ('hat','grad',1),
  ('hat','straw',1),
  ('hat','chef',2),
  ('hat','helmet',2),
  ('hat','police',2),
  ('hat','santa',2),
  ('hat','flower',2),
  ('hat','cowboy',3),
  ('hat','sombrero',3),
  ('hat','cactus',3),
  ('hat','pizza',3),
  ('hat','witch',4),
  ('hat','pirate',4),
  ('hat','viking',4),
  ('hat','tophat',4),
  ('hat','astronaut',5),
  ('hat','crown',5),
  ('hat','halo',5),
  ('glasses','sportband',1),
  ('glasses','halfmoon',1),
  ('glasses','star',2),
  ('glasses','heart',2),
  ('glasses','aviator',2),
  ('glasses','swim',2),
  ('glasses','cateye',3),
  ('glasses','cyber',3),
  ('glasses','pixel',3),
  ('glasses','monocle',3),
  ('glasses','ski',3),
  ('glasses','rainbow',4),
  ('glasses','gold',4),
  ('glasses','led',4),
  ('glasses','diamond',5),
  ('glasses','stargiant',5),
  ('glasses','laser',5),
  ('hair','buzz',1),
  ('hair','wavy',1),
  ('hair','curly',2),
  ('hair','ponytail',2),
  ('hair','pigtails',2),
  ('hair','bun',2),
  ('hair','fro',2),
  ('hair','braid',3),
  ('hair','mohawk',3),
  ('hair','topknot',3),
  ('hair','emo',3),
  ('hair','dreads',4),
  ('hair','spacebuns',4),
  ('hair','afro',4),
  ('hair','long',4),
  ('hair','rainbow',5),
  ('sport','baseball',1),
  ('sport','rugby',1),
  ('sport','golf',2),
  ('sport','bowling',2),
  ('sport','dumbbell',2),
  ('sport','boxe',2),
  ('sport','hockey',3),
  ('sport','medal',3),
  ('sport','skate',3),
  ('sport','ski',3),
  ('sport','shield',4),
  ('sport','surf',4),
  ('sport','scooter',4),
  ('sport','bike',4),
  ('sport','guitar',5),
  ('sport','lightsaber',5),
  ('sport','trophy',5),
  ('animal','frog',1),
  ('animal','turtle',1),
  ('animal','hamster',2),
  ('animal','fox',2),
  ('animal','bee',2),
  ('animal','ladybug',2),
  ('animal','butterfly',2),
  ('animal','panda',3),
  ('animal','penguin',3),
  ('animal','owl',3),
  ('animal','cow',3),
  ('animal','ghost',3),
  ('animal','snake',3),
  ('animal','parrot',4),
  ('animal','shark',4),
  ('animal','dino',4),
  ('animal','alien',4),
  ('animal','dragon',5),
  ('animal','unicorn',5),
  ('face','surprised',1),
  ('face','kiss',1),
  ('face','tooth',1),
  ('face','buckteeth',2),
  ('face','moustache',2),
  ('face','moustachecurly',3),
  ('face','clown',3),
  ('face','ninja',3),
  ('face','vampire',4),
  ('face','beard',4),
  ('face','goldteeth',5);

-- ------------------------------------------------------------
--  Templates de boîtes prédéfinies (1 par niveau de rareté).
--   contenu_fixe : { donuts:[min,max], gemmes:[min,max] }
--   probabilites : { skin: <0..1>, pool: 'payants' | 'rares' | null }
-- ------------------------------------------------------------
create table if not exists public.boites_templates (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  niveau       text not null unique,
  contenu_fixe jsonb not null,
  probabilites jsonb not null
);
insert into public.boites_templates (nom, niveau, contenu_fixe, probabilites) values
  ('Normal',        'normal',     '{"donuts":[5,7],"gemmes":[1,1]}',     '{"skin":0,"pool":null}'),
  ('Rare',          'rare',       '{"donuts":[5,13],"gemmes":[1,2]}',    '{"skin":0.2,"pool":"payants"}'),
  ('Super Rare',    'super_rare', '{"donuts":[10,20],"gemmes":[3,5]}',   '{"skin":0.3333,"pool":"payants"}'),
  ('Incroyable',    'incroyable', '{"donuts":[40,60],"gemmes":[8,10]}',  '{"skin":1,"pool":"payants"}'),
  ('IMPOSSIBLE !!!','impossible', '{"donuts":[80,100],"gemmes":[20,30]}','{"skin":1,"pool":"rares"}')
on conflict (niveau) do update
  set nom = excluded.nom,
      contenu_fixe = excluded.contenu_fixe,
      probabilites = excluded.probabilites;

-- ------------------------------------------------------------
--  Boîtes envoyées aux utilisateurs.
--   type    : niveau ('normal'…'impossible') ou 'personnalisee'
--   contenu : { mode:'aleatoire', niveau } avant ouverture
--             ou { mode:'fixe', donuts, gemmes, skin } (personnalisée)
--             puis enrichi à l'ouverture du contenu réellement obtenu.
-- ------------------------------------------------------------
create table if not exists public.boites_mysteres (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,
  contenu         jsonb,
  destinataire_id uuid not null references public.users(id) on delete cascade,
  expediteur_id   uuid references public.users(id) on delete set null,
  ouverte         boolean not null default false,
  date_envoi      timestamptz not null default now(),
  date_ouverture  timestamptz
);
alter table public.boites_mysteres enable row level security; -- accès via RPC uniquement
create index if not exists idx_boites_dest on public.boites_mysteres (destinataire_id, ouverte);
create index if not exists idx_boites_envoi on public.boites_mysteres (date_envoi desc);

-- ------------------------------------------------------------
--  Superadmin : créer une boîte ALÉATOIRE (niveau de rareté).
-- ------------------------------------------------------------
create or replace function public.admin_create_boite_aleatoire(
  p_admin uuid, p_dest uuid, p_niveau text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if not exists (select 1 from public.boites_templates where niveau = p_niveau) then
    return jsonb_build_object('error', 'niveau_invalide');
  end if;
  if not exists (select 1 from public.users where id = p_dest) then
    return jsonb_build_object('error', 'dest_introuvable');
  end if;
  insert into public.boites_mysteres (type, contenu, destinataire_id, expediteur_id)
  values (p_niveau, jsonb_build_object('mode', 'aleatoire', 'niveau', p_niveau), p_dest, p_admin)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

-- ------------------------------------------------------------
--  Superadmin : créer une boîte PERSONNALISÉE (contenu choisi).
--   p_skin_cat / p_skin_item : accessoire optionnel (chaînes vides = aucun).
-- ------------------------------------------------------------
create or replace function public.admin_create_boite_perso(
  p_admin uuid, p_dest uuid, p_donuts int, p_gemmes int,
  p_skin_cat text, p_skin_item text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_skin jsonb; v_cat text; v_item text;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if not exists (select 1 from public.users where id = p_dest) then
    return jsonb_build_object('error', 'dest_introuvable');
  end if;
  v_cat := nullif(btrim(coalesce(p_skin_cat, '')), '');
  v_item := nullif(btrim(coalesce(p_skin_item, '')), '');
  if v_cat is not null and v_item is not null then
    v_skin := jsonb_build_object('category', v_cat, 'item', v_item);
  else
    v_skin := null;
  end if;
  insert into public.boites_mysteres (type, contenu, destinataire_id, expediteur_id)
  values (
    'personnalisee',
    jsonb_build_object('mode', 'fixe',
      'donuts', greatest(0, coalesce(p_donuts, 0)),
      'gemmes', greatest(0, coalesce(p_gemmes, 0)),
      'skin', v_skin),
    p_dest, p_admin
  )
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

-- ------------------------------------------------------------
--  Superadmin : historique de toutes les boîtes envoyées.
-- ------------------------------------------------------------
create or replace function public.admin_list_boites(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'type', b.type,
    'contenu', b.contenu,
    'ouverte', b.ouverte,
    'date_envoi', b.date_envoi,
    'date_ouverture', b.date_ouverture,
    'destinataire', case when u.id is null then null else jsonb_build_object(
      'id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role, 'numero', u.numero
    ) end
  ) order by b.date_envoi desc), '[]'::jsonb)
  into v
  from public.boites_mysteres b
  left join public.users u on u.id = b.destinataire_id;
  return v;
end; $$;

-- ------------------------------------------------------------
--  Utilisateur : ses boîtes NON ouvertes (pour le dashboard + page).
-- ------------------------------------------------------------
create or replace function public.get_my_boites(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'type', b.type,
    'niveau', coalesce(b.contenu->>'niveau', b.type),
    'date_envoi', b.date_envoi
  ) order by b.date_envoi desc), '[]'::jsonb)
  into v
  from public.boites_mysteres b
  where b.destinataire_id = p_user and b.ouverte = false;
  return v;
end; $$;

-- ------------------------------------------------------------
--  Utilisateur : OUVRIR une boîte. Tirage + crédit côté serveur.
--   Renvoie { ok, niveau, donuts, gemmes, skin, avatar, soldes }.
-- ------------------------------------------------------------
create or replace function public.open_boite(p_user uuid, p_boite uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_type text; v_contenu jsonb; v_mode text; v_niveau text; v_ouverte boolean;
  v_fixe jsonb; v_prob jsonb;
  v_donuts int; v_gemmes int;
  v_skin jsonb := null; v_cat text; v_item text; v_minprice int;
  v_avatar jsonb; v_owned jsonb; v_key text; v_pool text;
  v_new_donuts int; v_new_gemmes int;
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

  -- Crédit des donuts / gemmes.
  update public.users
    set donuts = donuts + v_donuts, gemmes = gemmes + v_gemmes
    where id = p_user
    returning donuts, gemmes, avatar into v_new_donuts, v_new_gemmes, v_avatar;

  if v_donuts > 0 then perform public._log_tx(p_user, 'gain', v_donuts, 'donut', 'Boîte mystère 🎁'); end if;
  if v_gemmes > 0 then perform public._log_tx(p_user, 'gain', v_gemmes, 'gemme', 'Boîte mystère 🎁'); end if;

  -- Skin éventuel : ajout à la collection + équipement.
  if v_cat is not null and v_item is not null then
    v_avatar := coalesce(v_avatar, '{}'::jsonb);
    v_owned := coalesce(v_avatar->'owned', '[]'::jsonb);
    v_key := v_cat || ':' || v_item;
    if not (v_owned ? v_key) then
      v_owned := v_owned || to_jsonb(v_key);
    end if;
    v_avatar := jsonb_set(v_avatar, '{owned}', v_owned, true);
    v_avatar := jsonb_set(v_avatar, array[v_cat], to_jsonb(v_item), true);
    update public.users set avatar = v_avatar where id = p_user;
    v_skin := jsonb_build_object('category', v_cat, 'item', v_item);
  end if;

  -- Marque la boîte ouverte + mémorise le contenu réellement obtenu.
  update public.boites_mysteres
    set ouverte = true,
        date_ouverture = now(),
        contenu = jsonb_build_object(
          'niveau', v_niveau, 'donuts', v_donuts, 'gemmes', v_gemmes, 'skin', v_skin)
    where id = p_boite;

  return jsonb_build_object(
    'ok', true,
    'niveau', v_niveau,
    'donuts', v_donuts,
    'gemmes', v_gemmes,
    'skin', v_skin,
    'avatar', v_avatar,
    'soldes', jsonb_build_object('donuts', v_new_donuts, 'gemmes', v_new_gemmes)
  );
end; $$;

grant execute on function public.admin_create_boite_aleatoire(uuid, uuid, text) to anon, authenticated;
grant execute on function public.admin_create_boite_perso(uuid, uuid, int, int, text, text) to anon, authenticated;
grant execute on function public.admin_list_boites(uuid) to anon, authenticated;
grant execute on function public.get_my_boites(uuid) to anon, authenticated;
grant execute on function public.open_boite(uuid, uuid) to anon, authenticated;
