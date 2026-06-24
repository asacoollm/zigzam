-- ============================================================
--  ZIGZAM — Saisons thématiques 🦕
--   Infrastructure générique pour des saisons qui transforment toute
--   l'interface pendant une période. La 1re saison est « Jurassic Web ».
--   - table `saisons`       : commutateur + dates + thème (piloté par le superadmin)
--   - table `saison_skins`  : catalogue des skins exclusifs d'une saison (pour stats)
--   - RPC publics            : lecture de la saison active
--   - RPC superadmin         : liste / mise à jour / statistiques d'achat
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  Saisons : 1 ligne par saison connue. La saison active est lue par slug.
-- ------------------------------------------------------------
create table if not exists public.saisons (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  nom        text not null,
  actif      boolean not null default false,
  date_debut timestamptz,
  date_fin   timestamptz,
  theme      jsonb not null default '{}'::jsonb
);
alter table public.saisons enable row level security; -- accès via RPC uniquement

-- Seed / mise à jour de la saison « Jurassic Web ».
--  On ne réécrit PAS actif / dates si la ligne existe déjà (le superadmin
--  peut les avoir réglés en base) : seuls nom + thème sont resynchronisés.
insert into public.saisons (slug, nom, actif, date_debut, date_fin, theme)
values (
  'jurassic', 'Jurassic Web 🦕', true, null, null,
  jsonb_build_object(
    'numero', 1,
    'couleurs', jsonb_build_object(
      'fondSombre', '#0D3B0D', 'fondEmeraude', '#1A5C1A', 'fondJungle', '#2D8B2D',
      'accent', '#3dd68c', 'eclair', '#aaffaa'),
    'emoji', '🦕'
  )
)
on conflict (slug) do update
  set nom = excluded.nom,
      theme = excluded.theme;

-- ------------------------------------------------------------
--  Catalogue des skins exclusifs par saison (source de vérité des stats).
--   Synchro avec les items marqués `saison` dans src/lib/avatar.js.
-- ------------------------------------------------------------
create table if not exists public.saison_skins (
  saison_slug text not null,
  category    text not null,
  item_id     text not null,
  label       text not null,
  prix        int  not null,
  primary key (saison_slug, category, item_id)
);
-- Re-seed complet à chaque push (reste synchro avec le catalogue JS).
delete from public.saison_skins where saison_slug = 'jurassic';
insert into public.saison_skins (saison_slug, category, item_id, label, prix) values
  ('jurassic','hat','jtrex','Capuche T-Rex',10),
  ('jurassic','hat','jtrike','Casque Tricératops',9),
  ('jurassic','hat','jstego','Couronne Stégosaure',10),
  ('jurassic','hat','jptero','Chapeau Ptérosaure',11),
  ('jurassic','hair','jtail','Queue de Dino',9),
  ('jurassic','hair','jdilo','Crête de Dilophosaure',8),
  ('jurassic','hair','jdreads','Dreadlocks Dino',10),
  ('jurassic','animal','jraptors','Meute de Raptors',14),
  ('jurassic','animal','jbrachio','Bébé Brachiosaure',15),
  ('jurassic','animal','jtrexbuddy','T-Rex Compagnon',15),
  ('jurassic','animal','jpterofly','Ptérosaure Volant',12),
  ('jurassic','face','jraptoreyes','Yeux de Raptor',8),
  ('jurassic','face','jtrexjaw','Sourire de T-Rex',10),
  ('jurassic','face','jscalesface','Écailles',9),
  ('jurassic','color','jcamo','Camouflage Jungle',10),
  ('jurassic','color','jtrexskin','Écailles T-Rex',12),
  ('jurassic','color','jdinogold','Dino Doré',12),
  ('jurassic','color','jraptorblue','Raptor Bleu',13);

-- Les skins de saison rejoignent le catalogue payant général : ainsi ils
-- peuvent tomber dans les boîtes mystères et restent achetables/possédables
-- comme n'importe quel accessoire. (idempotent via upsert)
insert into public.accessoires_catalogue (category, item_id, price)
select category, item_id, prix from public.saison_skins where saison_slug = 'jurassic'
on conflict (category, item_id) do update set price = excluded.price;

-- ------------------------------------------------------------
--  Public : lecture de la saison active par slug (pour SaisonContext).
-- ------------------------------------------------------------
create or replace function public.get_saison_active(p_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select to_jsonb(s) into v from public.saisons s where s.slug = p_slug;
  return v; -- null si inconnue
end; $$;

-- ------------------------------------------------------------
--  Superadmin : liste de toutes les saisons.
-- ------------------------------------------------------------
create or replace function public.admin_list_saisons(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(to_jsonb(s) order by s.nom), '[]'::jsonb)
  into v from public.saisons s;
  return v;
end; $$;

-- ------------------------------------------------------------
--  Superadmin : mise à jour du commutateur et/ou des dates d'une saison.
--   p_actif : null = inchangé.
--   p_debut / p_fin : null = inchangé, '' (chaîne vide) = effacer la date.
-- ------------------------------------------------------------
create or replace function public.admin_update_saison(
  p_admin uuid, p_slug text, p_actif boolean, p_debut text, p_fin text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if not exists (select 1 from public.saisons where slug = p_slug) then
    return jsonb_build_object('error', 'introuvable');
  end if;

  update public.saisons set
    actif = case when p_actif is null then actif else p_actif end,
    date_debut = case
      when p_debut is null then date_debut
      when btrim(p_debut) = '' then null
      else p_debut::timestamptz end,
    date_fin = case
      when p_fin is null then date_fin
      when btrim(p_fin) = '' then null
      else p_fin::timestamptz end
  where slug = p_slug;

  select to_jsonb(s) into v from public.saisons s where s.slug = p_slug;
  return jsonb_build_object('ok', true, 'saison', v);
end; $$;

-- ------------------------------------------------------------
--  Superadmin : statistiques d'achat des skins d'une saison.
--   Pour chaque skin : nombre d'utilisateurs qui le possèdent (avatar.owned).
--   Renvoie { total, joueurs, skins:[{category,item_id,label,prix,achats}] }.
-- ------------------------------------------------------------
create or replace function public.admin_saison_stats(p_admin uuid, p_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_skins jsonb; v_total int; v_joueurs int;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;

  -- Achats par skin (un « achat » = un utilisateur qui possède la clé cat:item).
  select coalesce(jsonb_agg(jsonb_build_object(
           'category', k.category, 'item_id', k.item_id,
           'label', k.label, 'prix', k.prix, 'achats', k.achats
         ) order by k.achats desc, k.prix desc), '[]'::jsonb),
         coalesce(sum(k.achats), 0)
  into v_skins, v_total
  from (
    select s.category, s.item_id, s.label, s.prix,
      (select count(*) from public.users u
        where u.avatar->'owned' ? (s.category || ':' || s.item_id)) as achats
    from public.saison_skins s
    where s.saison_slug = p_slug
  ) k;

  -- Joueurs distincts ayant au moins un skin de la saison.
  select count(*) into v_joueurs from public.users u
  where exists (
    select 1 from public.saison_skins s
    where s.saison_slug = p_slug
      and u.avatar->'owned' ? (s.category || ':' || s.item_id)
  );

  return jsonb_build_object(
    'total', v_total, 'joueurs', v_joueurs, 'skins', v_skins
  );
end; $$;

grant execute on function public.get_saison_active(text) to anon, authenticated;
grant execute on function public.admin_list_saisons(uuid) to anon, authenticated;
grant execute on function public.admin_update_saison(uuid, text, boolean, text, text) to anon, authenticated;
grant execute on function public.admin_saison_stats(uuid, text) to anon, authenticated;
