-- ============================================================
--  ZIGZAM — Map Zigzam 🗺️ : boutique par pays
--   Dépense les mini pièces violettes 💜 d'un pays (map_mini_pieces) pour
--   débloquer des badges/autocollants collectionnables (façon stickers).
--   - map_boutique_articles : catalogue (3 articles par pays)
--   - map_achats            : ce que chaque joueur possède déjà
--   - get_map_boutique()    : catalogue d'un pays
--   - get_my_map_achats()   : articles déjà possédés (tous pays confondus)
--   - buy_map_article()     : achat (débite + journalise)
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. TABLE map_boutique_articles — catalogue (3 articles par pays)
-- ------------------------------------------------------------
create table if not exists public.map_boutique_articles (
  id        text primary key,
  pays_slug text not null references public.zigzam_map_pays(slug) on delete cascade,
  nom       text not null,
  emoji     text not null,
  prix      integer not null,
  ordre     integer not null default 0
);
alter table public.map_boutique_articles enable row level security; -- accès via RPC uniquement
revoke all on public.map_boutique_articles from anon, authenticated;

insert into public.map_boutique_articles (id, pays_slug, nom, emoji, prix, ordre) values
  ('ile-doree:coquillage',       'ile-doree',        'Coquillage Scintillant', '🐚', 12, 1),
  ('ile-doree:noix-de-coco',     'ile-doree',        'Noix de Coco Dorée',     '🥥', 18, 2),
  ('ile-doree:crabe',            'ile-doree',        'Crabe Farceur',          '🦀', 28, 3),

  ('terre-de-lave:braise',       'terre-de-lave',    'Braise Ardente',         '🔥', 15, 1),
  ('terre-de-lave:roche',        'terre-de-lave',    'Roche Volcanique',       '🪨', 22, 2),
  ('terre-de-lave:salamandre',   'terre-de-lave',    'Salamandre de Lave',     '🐉', 35, 3),

  ('royaume-glace:flocon',       'royaume-glace',    'Flocon Scintillant',     '❄️', 10, 1),
  ('royaume-glace:echarpe',      'royaume-glace',    'Écharpe Givrée',         '🧣', 20, 2),
  ('royaume-glace:manchot',      'royaume-glace',    'Manchot Frileux',        '🐧', 32, 3),

  ('desert-de-sable:vase',       'desert-de-sable',  'Vase Ancien',            '🏺', 14, 1),
  ('desert-de-sable:dromadaire', 'desert-de-sable',  'Dromadaire Curieux',     '🐫', 25, 2),
  ('desert-de-sable:gemme',      'desert-de-sable',  'Gemme du Désert',        '💎', 38, 3),

  ('foret-mystique:champignon',  'foret-mystique',   'Champignon Magique',     '🍄', 11, 1),
  ('foret-mystique:hibou',       'foret-mystique',   'Hibou Sage',             '🦉', 24, 2),
  ('foret-mystique:fee',         'foret-mystique',   'Fée des Bois',           '🧚', 36, 3),

  ('cite-neon:casque',           'cite-neon',        'Casque Rétro',           '🎧', 16, 1),
  ('cite-neon:skate',            'cite-neon',        'Skate Néon',             '🛹', 26, 2),
  ('cite-neon:robot',            'cite-neon',        'Robot Danseur',          '🤖', 40, 3),

  ('jurassic-web:oeuf',          'jurassic-web',     'Œuf Fossilisé',          '🥚', 13, 1),
  ('jurassic-web:os',            'jurassic-web',     'Os Préhistorique',       '🦴', 20, 2),
  ('jurassic-web:trex',          'jurassic-web',     'Mini T-Rex',             '🦖', 34, 3),

  ('zigzamland-paris:confetti',  'zigzamland-paris', 'Confetti Royal',         '🎪', 13, 1),
  ('zigzamland-paris:manege',    'zigzamland-paris', 'Manège Miniature',       '🎠', 23, 2),
  ('zigzamland-paris:couronne',  'zigzamland-paris', 'Couronne Scintillante',  '👑', 37, 3)
on conflict (id) do update
  set nom = excluded.nom,
      emoji = excluded.emoji,
      prix = excluded.prix,
      ordre = excluded.ordre;

-- ------------------------------------------------------------
--  2. TABLE map_achats — ce que chaque joueur possède déjà
-- ------------------------------------------------------------
create table if not exists public.map_achats (
  user_id     uuid not null references public.users(id) on delete cascade,
  article_id  text not null references public.map_boutique_articles(id) on delete cascade,
  date_achat  timestamptz not null default now(),
  primary key (user_id, article_id)
);
alter table public.map_achats enable row level security; -- accès via RPC uniquement
revoke all on public.map_achats from anon, authenticated;

-- ------------------------------------------------------------
--  3. get_map_boutique(p_pays_slug) — catalogue d'un pays
-- ------------------------------------------------------------
create or replace function public.get_map_boutique(p_pays_slug text)
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'nom', nom, 'emoji', emoji, 'prix', prix
  ) order by ordre), '[]'::jsonb)
  from public.map_boutique_articles
  where pays_slug = p_pays_slug;
$$;

grant execute on function public.get_map_boutique(text) to anon, authenticated;

-- ------------------------------------------------------------
--  4. get_my_map_achats(p_user) — article_id déjà possédés (tous pays)
-- ------------------------------------------------------------
create or replace function public.get_my_map_achats(p_user uuid)
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(article_id), '[]'::jsonb)
  from public.map_achats
  where user_id = p_user;
$$;

grant execute on function public.get_my_map_achats(uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  5. buy_map_article(p_user, p_article_id) — achat (débite + journalise)
-- ------------------------------------------------------------
create or replace function public.buy_map_article(p_user uuid, p_article_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_nom text;
  v_prix integer;
  v_pays text;
  v_qte integer;
  v_reste integer;
begin
  select nom, prix, pays_slug into v_nom, v_prix, v_pays
  from public.map_boutique_articles
  where id = p_article_id;

  if v_nom is null then
    return jsonb_build_object('error', 'article_introuvable');
  end if;

  if exists (select 1 from public.map_achats where user_id = p_user and article_id = p_article_id) then
    return jsonb_build_object('error', 'deja_possede');
  end if;

  select quantite into v_qte
  from public.map_mini_pieces
  where user_id = p_user and pays_slug = v_pays
  for update;

  if coalesce(v_qte, 0) < v_prix then
    return jsonb_build_object('error', 'pas_assez_de_pieces');
  end if;

  update public.map_mini_pieces
    set quantite = quantite - v_prix
    where user_id = p_user and pays_slug = v_pays
    returning quantite into v_reste;

  insert into public.map_achats (user_id, article_id) values (p_user, p_article_id);

  perform public._log_tx(p_user, 'depense', v_prix, 'map_piece', 'Boutique Map — ' || v_nom);

  return jsonb_build_object('ok', true, 'mini_pieces_restantes', v_reste);
end; $$;

grant execute on function public.buy_map_article(uuid, text) to anon, authenticated;
