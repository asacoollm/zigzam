-- ============================================================
--  ZIGZAM — Saison Halloween 🎃 : Vague 2 des skins exclusifs
--   Même méthode que la vague 1 (20261029120000) et que Jurassic/Disney :
--   catalogue dans `saison_skins`, synchronisé vers
--   `accessoires_catalogue`. Visibles/achetables UNIQUEMENT pendant que
--   la saison `halloween` est active (toggle superadmin /admin →
--   Saisons) : cette migration ne touche PAS à son activation, ni aux
--   objets des autres saisons, ni à ceux de la vague 1, ni à ceux déjà
--   possédés par les élèves.
--
--   6 objets de la vague 2 (préfixe "h") — la saison en compte 10 au
--   total avec la vague 1 :
--    - hat     hsorcierestar       : grand chapeau de sorcière étoilé
--    - glasses hlunettescitrouille : lunettes citrouilles
--    - hair    hdracula            : cheveux gominés façon Dracula
--    - animal  hchatnoir           : petit chat noir
--    - face    hvisagesquelette    : maquillage squelette
--    - sport   hbalai              : balai de sorcière
--
--  Idempotent : `on conflict ... do update` (pas de delete+reinsert),
--  pour qu'une vague 3 future puisse ajouter ses propres lignes sans
--  toucher à celles des vagues 1 et 2.
-- ============================================================

insert into public.saison_skins (saison_slug, category, item_id, label, prix) values
  ('halloween','hat','hsorcierestar','Sorcière Étoilée',13),
  ('halloween','glasses','hlunettescitrouille','Lunettes Citrouille',9),
  ('halloween','hair','hdracula','Dracula',10),
  ('halloween','animal','hchatnoir','Chat Noir',14),
  ('halloween','face','hvisagesquelette','Squelette',10),
  ('halloween','sport','hbalai','Balai de Sorcière',14)
on conflict (saison_slug, category, item_id) do update
  set label = excluded.label,
      prix = excluded.prix;

-- Les skins de saison rejoignent le catalogue payant général : ainsi ils
-- peuvent tomber dans les boîtes mystères et restent achetables/possédables
-- comme n'importe quel accessoire (même logique que la vague 1).
insert into public.accessoires_catalogue (category, item_id, price)
select category, item_id, prix from public.saison_skins where saison_slug = 'halloween'
on conflict (category, item_id) do update set price = excluded.price;
