-- ============================================================
--  ZIGZAM — Saison Halloween 🎃 : skins complets exclusifs
--   Même méthode que les vagues 1 et 2 (20261029120000,
--   20261029130000) et que les skins complets Disney : catalogue dans
--   `saison_skins`, synchronisé vers `accessoires_catalogue`.
--   Visibles/achetables UNIQUEMENT pendant que la saison `halloween`
--   est active (toggle superadmin /admin → Saisons) : cette migration
--   ne touche PAS à son activation, ni aux objets des autres saisons,
--   ni à ceux des vagues 1/2, ni à ceux déjà possédés par les élèves.
--
--   3 skins complets (préfixe "h", catégorie « full ») — la saison
--   compte désormais 13 objets exclusifs au total :
--    - hfullvampire  : Petit Vampire
--    - hfullsorciere : Petite Sorcière
--    - hfullsquelette: Squelette Rigolo
--
--  Idempotent : `on conflict ... do update` (pas de delete+reinsert),
--  pour qu'un ajout futur puisse se faire sans toucher à l'existant.
-- ============================================================

insert into public.saison_skins (saison_slug, category, item_id, label, prix) values
  ('halloween','full','hfullvampire','Petit Vampire',23),
  ('halloween','full','hfullsorciere','Petite Sorcière',24),
  ('halloween','full','hfullsquelette','Squelette Rigolo',25)
on conflict (saison_slug, category, item_id) do update
  set label = excluded.label,
      prix = excluded.prix;

-- Les skins de saison rejoignent le catalogue payant général : ainsi ils
-- peuvent tomber dans les boîtes mystères et restent achetables/possédables
-- comme n'importe quel accessoire (même logique que les vagues 1 et 2).
insert into public.accessoires_catalogue (category, item_id, price)
select category, item_id, prix from public.saison_skins where saison_slug = 'halloween'
on conflict (category, item_id) do update set price = excluded.price;
