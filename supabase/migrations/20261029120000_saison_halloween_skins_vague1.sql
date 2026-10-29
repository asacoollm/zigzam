-- ============================================================
--  ZIGZAM — Saison Halloween 🎃 : Vague 1 des skins exclusifs
--   Même méthode que Jurassic Web / Zigzamland Paris
--   (20260624120000_saisons.sql, 20260718120000_saison_disney.sql) :
--   catalogue dans `saison_skins`, synchronisé vers
--   `accessoires_catalogue` pour tomber dans les boîtes mystères et
--   rester achetable comme n'importe quel accessoire (boutique avatar,
--   collection). Visibles/achetables UNIQUEMENT pendant que la saison
--   `halloween` est active (toggle superadmin /admin → Saisons) :
--   cette migration ne touche PAS à son activation, ni aux objets des
--   autres saisons, ni à ceux déjà possédés par les élèves.
--
--   4 objets de la vague 1 (préfixe "h") :
--    - color hcitrouille          : couleur de corps citrouille
--    - hat   hcitrouillechap      : chapeau tête de citrouille
--    - animal hchauvesouris       : compagnon chauve-souris
--    - face  hvisagecitrouille    : maquillage citrouille
--
--  Idempotent : `on conflict ... do update` au lieu d'un
--  delete+reinsert complet, pour qu'une vague 2 future puisse ajouter
--  ses propres lignes sans jamais toucher à celles de la vague 1.
-- ============================================================

insert into public.saison_skins (saison_slug, category, item_id, label, prix) values
  ('halloween','color','hcitrouille','Citrouille',10),
  ('halloween','hat','hcitrouillechap','Tête de citrouille',9),
  ('halloween','animal','hchauvesouris','Chauve-souris',12),
  ('halloween','face','hvisagecitrouille','Sourire de citrouille',9)
on conflict (saison_slug, category, item_id) do update
  set label = excluded.label,
      prix = excluded.prix;

-- Les skins de saison rejoignent le catalogue payant général : ainsi ils
-- peuvent tomber dans les boîtes mystères et restent achetables/possédables
-- comme n'importe quel accessoire (même logique que Jurassic/Disney).
insert into public.accessoires_catalogue (category, item_id, price)
select category, item_id, prix from public.saison_skins where saison_slug = 'halloween'
on conflict (category, item_id) do update set price = excluded.price;
