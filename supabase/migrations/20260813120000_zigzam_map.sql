-- ============================================================
--  ZIGZAM — Map Zigzam 🗺️ (base de données uniquement)
--   - users.map_pieces        : monnaie de la Map (compteur global)
--   - zigzam_map_pays         : catalogue des pays (6 permanents + 2 saisonniers)
--   - map_mini_pieces         : mini-pièces collectées par pays et par joueur
--   - map_coffres             : suivi des ouvertures de coffre par pays et par joueur
--   - earn_map_pieces()       : crédite des map_pieces (RPC security definer)
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. users.map_pieces
-- ------------------------------------------------------------
alter table public.users
  add column if not exists map_pieces integer not null default 0;

-- ------------------------------------------------------------
--  2. TABLE zigzam_map_pays — catalogue des pays de la Map
-- ------------------------------------------------------------
create table if not exists public.zigzam_map_pays (
  slug        text primary key,
  nom         text not null,
  emoji       text not null,
  saisonnier  boolean not null default false,
  actif       boolean not null default true,
  ordre       integer not null default 0
);
alter table public.zigzam_map_pays enable row level security; -- accès via RPC uniquement
revoke all on public.zigzam_map_pays from anon, authenticated;

insert into public.zigzam_map_pays (slug, nom, emoji, saisonnier, actif, ordre) values
  ('ile-doree',        'Île Dorée',           '🏝️', false, true,  1),
  ('terre-de-lave',    'Terre de Lave',       '🌋', false, true,  2),
  ('royaume-glace',    'Royaume de Glace',    '🧊', false, true,  3),
  ('desert-de-sable',  'Désert de Sable',     '🌵', false, true,  4),
  ('foret-mystique',   'Forêt Mystique',      '🌿', false, true,  5),
  ('cite-neon',        'Cité Néon',           '🏙️', false, true,  6),
  ('jurassic-web',      'Jurassic Web',        '🦕', true,  false, 7),
  ('zigzamland-paris',  'Zigzamland Paris',    '🏰', true,  false, 8)
on conflict (slug) do update
  set nom = excluded.nom,
      emoji = excluded.emoji,
      saisonnier = excluded.saisonnier,
      ordre = excluded.ordre;

-- ------------------------------------------------------------
--  3. TABLE map_mini_pieces — mini-pièces par joueur et par pays
-- ------------------------------------------------------------
create table if not exists public.map_mini_pieces (
  user_id   uuid not null references public.users(id) on delete cascade,
  pays_slug text not null references public.zigzam_map_pays(slug) on delete cascade,
  quantite  integer not null default 0,
  primary key (user_id, pays_slug)
);
alter table public.map_mini_pieces enable row level security; -- accès via RPC uniquement
revoke all on public.map_mini_pieces from anon, authenticated;

-- ------------------------------------------------------------
--  4. TABLE map_coffres — dernière ouverture de coffre par joueur et par pays
-- ------------------------------------------------------------
create table if not exists public.map_coffres (
  user_id             uuid not null references public.users(id) on delete cascade,
  pays_slug           text not null references public.zigzam_map_pays(slug) on delete cascade,
  derniere_ouverture  timestamptz,
  primary key (user_id, pays_slug)
);
alter table public.map_coffres enable row level security; -- accès via RPC uniquement
revoke all on public.map_coffres from anon, authenticated;

-- ------------------------------------------------------------
--  5. RPC earn_map_pieces(p_user, p_quantite, p_source) — crédite des
--     map_pieces et journalise la transaction (devise 'map_piece').
-- ------------------------------------------------------------
create or replace function public.earn_map_pieces(p_user uuid, p_quantite integer, p_source text)
returns integer language plpgsql security definer set search_path = public as $$
declare v_total integer;
begin
  update public.users
    set map_pieces = greatest(0, map_pieces + p_quantite)
    where id = p_user
    returning map_pieces into v_total;

  if v_total is null then
    return null;
  end if;

  perform public._log_tx(p_user, case when p_quantite >= 0 then 'gain' else 'depense' end,
    p_quantite, 'map_piece', coalesce(nullif(p_source, ''), 'Map Zigzam'));

  return v_total;
end; $$;

grant execute on function public.earn_map_pieces(uuid, integer, text) to anon, authenticated;
